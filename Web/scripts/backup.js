"use strict";
const fs = require("fs");
const path = require("path");
const dbApi = require("../src/db");

async function main() {
  const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, "..", "backups"));
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 14);
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destination = path.join(backupDir, `mmrates-${stamp}.db`);
  await dbApi.db.backup(destination);

  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  for (const name of fs.readdirSync(backupDir)) {
    if (!/^mmrates-.*\.db$/.test(name)) continue;
    const file = path.join(backupDir, name);
    if (fs.statSync(file).mtimeMs < cutoff) fs.unlinkSync(file);
  }
  console.log(`[backup] wrote ${destination}`);
  dbApi.close();
}

main().catch((error) => {
  console.error("[backup] failed", error);
  process.exitCode = 1;
});
