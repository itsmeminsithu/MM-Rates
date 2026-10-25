const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createDatabase } = require("../src/db");

let nativeAvailable = true;
try {
  const Database = require("better-sqlite3");
  const probe = new Database(":memory:");
  probe.close();
} catch {
  nativeAvailable = false;
}

test("database creates directories, stores dual timestamps and clears recovered errors", { skip: !nativeAvailable }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mm-rates-"));
  const dbPath = path.join(root, "nested", "mmrates.db");
  const database = createDatabase(dbPath);
  const now = Date.now();
  database.insertMany([{
    pair: "USD_MMK_MARKET", source: "fixture", buy: 4380, sell: 4480, mid: 4430,
    fetched_at: now - 60_000, source_published_at: now - 60_000, collected_at: now,
  }]);
  database.markError("fixture", "temporary failure");
  database.markSuccess("fixture", 1, 0, { lastDataAt: now - 60_000, lastCollectedAt: now });
  const status = database.sourceStatus().find((row) => row.source === "fixture");
  const stored = database.latest("USD_MMK_MARKET");
  assert.equal(fs.existsSync(path.dirname(dbPath)), true);
  assert.equal(stored.source_published_at, now - 60_000);
  assert.equal(stored.collected_at, now);
  assert.equal(database.latestCollectedAt(), now);
  assert.equal(status.last_data_at, now - 60_000);
  assert.equal(status.last_error, null);
  assert.equal(status.last_error_at, null);
  database.close();
});
