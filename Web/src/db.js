const fs = require("fs");
const path = require("path");

function createDatabase(dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "mmrates.db")) {
  const Database = require("better-sqlite3");
  const resolved = path.resolve(dbPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });

  const db = new Database(resolved);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");

  db.exec(`
  CREATE TABLE IF NOT EXISTS rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair TEXT NOT NULL,
    source TEXT NOT NULL,
    buy REAL,
    sell REAL,
    mid REAL NOT NULL,
    fetched_at INTEGER NOT NULL,
    source_published_at INTEGER,
    collected_at INTEGER NOT NULL,
    timestamp_trusted INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_rates_pair_time ON rates (pair, fetched_at DESC);
  CREATE INDEX IF NOT EXISTS idx_rates_source_time ON rates (source, fetched_at DESC);

  CREATE TABLE IF NOT EXISTS source_status (
    source TEXT PRIMARY KEY,
    last_success INTEGER,
    last_attempt INTEGER,
    last_data_at INTEGER,
    last_collected_at INTEGER,
    last_error TEXT,
    last_error_at INTEGER,
    accepted_rows INTEGER DEFAULT 0,
    rejected_rows INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS pending_rates (
    pair TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    buy REAL,
    sell REAL,
    mid REAL NOT NULL,
    fetched_at INTEGER NOT NULL,
    seen_count INTEGER NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rejected_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pair TEXT,
    source TEXT,
    buy REAL,
    sell REAL,
    mid REAL,
    fetched_at INTEGER,
    source_published_at INTEGER,
    collected_at INTEGER,
    reason TEXT NOT NULL,
    rejected_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_rejected_time ON rejected_rates (rejected_at DESC);
  `);

  function ensureColumn(table, column, definition) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
    if (columns.includes(column)) return false;
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    return true;
  }

  ensureColumn("rates", "source_published_at", "INTEGER");
  ensureColumn("rates", "collected_at", "INTEGER");
  // Existing v1.4 rows used download time as data time. Mark them untrusted so
  // they cannot be presented as fresh after this migration. New tables already
  // contain this column with DEFAULT 1.
  const quarantinedLegacyTimestamps = ensureColumn("rates", "timestamp_trusted", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn("source_status", "last_attempt", "INTEGER");
  ensureColumn("source_status", "last_data_at", "INTEGER");
  ensureColumn("source_status", "last_collected_at", "INTEGER");
  ensureColumn("source_status", "accepted_rows", "INTEGER DEFAULT 0");
  ensureColumn("source_status", "rejected_rows", "INTEGER DEFAULT 0");
  ensureColumn("rejected_rates", "source_published_at", "INTEGER");
  ensureColumn("rejected_rates", "collected_at", "INTEGER");
  db.exec("CREATE INDEX IF NOT EXISTS idx_rates_collected_time ON rates (collected_at DESC)");

  // Migrate v1.4 rows. Their fetched_at value was the only known timestamp.
  db.exec(`
    UPDATE rates SET collected_at = fetched_at WHERE collected_at IS NULL;
    UPDATE rejected_rates SET collected_at = fetched_at WHERE collected_at IS NULL;
  `);
  if (quarantinedLegacyTimestamps) {
    // Pending anomaly confirmations were derived from the same untrusted legacy
    // timestamps and must not influence the first trusted v1.4.1 snapshot.
    db.exec("DELETE FROM pending_rates");
  }

  const insertRate = db.prepare(`
    INSERT INTO rates (pair, source, buy, sell, mid, fetched_at, source_published_at, collected_at, timestamp_trusted)
    VALUES (@pair, @source, @buy, @sell, @mid, @fetched_at, @source_published_at, @collected_at, @timestamp_trusted)
  `);
  const latestStmt = db.prepare(`
    SELECT pair, source, buy, sell, mid, fetched_at, source_published_at, collected_at
    FROM rates WHERE pair = ? AND timestamp_trusted = 1 ORDER BY fetched_at DESC, collected_at DESC, id DESC LIMIT 1
  `);
  const pendingGet = db.prepare("SELECT * FROM pending_rates WHERE pair = ?");
  const pendingUpsert = db.prepare(`
    INSERT INTO pending_rates (pair, source, buy, sell, mid, fetched_at, seen_count, reason, updated_at)
    VALUES (@pair, @source, @buy, @sell, @mid, @fetched_at, @seen_count, @reason, @updated_at)
    ON CONFLICT(pair) DO UPDATE SET
      source = excluded.source,
      buy = excluded.buy,
      sell = excluded.sell,
      mid = excluded.mid,
      fetched_at = excluded.fetched_at,
      seen_count = excluded.seen_count,
      reason = excluded.reason,
      updated_at = excluded.updated_at
  `);
  const pendingDelete = db.prepare("DELETE FROM pending_rates WHERE pair = ?");
  const rejectionInsert = db.prepare(`
    INSERT INTO rejected_rates (pair, source, buy, sell, mid, fetched_at, source_published_at, collected_at, reason, rejected_at)
    VALUES (@pair, @source, @buy, @sell, @mid, @fetched_at, @source_published_at, @collected_at, @reason, @rejected_at)
  `);

  const insertMany = db.transaction((rows) => {
    for (const input of rows) {
      const collectedAt = input.collected_at || Date.now();
      const sourcePublishedAt = input.source_published_at ?? null;
      const row = {
        buy: null,
        sell: null,
        ...input,
        fetched_at: input.fetched_at || sourcePublishedAt || collectedAt,
        source_published_at: sourcePublishedAt,
        collected_at: collectedAt,
        timestamp_trusted: 1,
      };
      insertRate.run(row);
    }
  });

  function markAttempt(source) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO source_status (source, last_attempt) VALUES (?, ?)
      ON CONFLICT(source) DO UPDATE SET last_attempt = excluded.last_attempt
    `).run(source, now);
  }

  function markSuccess(source, acceptedRows = 0, rejectedRows = 0, metadata = {}) {
    const now = Date.now();
    const lastDataAt = metadata.lastDataAt || null;
    const lastCollectedAt = metadata.lastCollectedAt || now;
    db.prepare(`
      INSERT INTO source_status (
        source, last_success, last_attempt, last_data_at, last_collected_at,
        last_error, last_error_at, accepted_rows, rejected_rows
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)
      ON CONFLICT(source) DO UPDATE SET
        last_success = excluded.last_success,
        last_attempt = excluded.last_attempt,
        last_data_at = COALESCE(excluded.last_data_at, source_status.last_data_at),
        last_collected_at = COALESCE(excluded.last_collected_at, source_status.last_collected_at),
        last_error = NULL,
        last_error_at = NULL,
        accepted_rows = excluded.accepted_rows,
        rejected_rows = excluded.rejected_rows
    `).run(source, now, now, lastDataAt, lastCollectedAt, acceptedRows, rejectedRows);
  }

  function markError(source, message) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO source_status (source, last_attempt, last_error, last_error_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source) DO UPDATE SET
        last_attempt = excluded.last_attempt,
        last_error = excluded.last_error,
        last_error_at = excluded.last_error_at
    `).run(source, now, String(message).slice(0, 500), now);
  }

  function latest(pair) {
    return latestStmt.get(pair);
  }

  function latestPerPair() {
    return db.prepare(`
      SELECT r.pair, r.source, r.buy, r.sell, r.mid, r.fetched_at, r.source_published_at, r.collected_at
      FROM rates r
      WHERE r.timestamp_trusted = 1 AND r.id = (
        SELECT r2.id FROM rates r2
        WHERE r2.pair = r.pair AND r2.timestamp_trusted = 1
        ORDER BY r2.fetched_at DESC, r2.collected_at DESC, r2.id DESC LIMIT 1
      )
      ORDER BY r.pair
    `).all();
  }

  function latestFetchedAt() {
    return db.prepare("SELECT MAX(fetched_at) AS value FROM rates WHERE timestamp_trusted = 1").get().value || null;
  }

  function latestCollectedAt() {
    return db.prepare("SELECT MAX(collected_at) AS value FROM rates WHERE timestamp_trusted = 1").get().value || null;
  }

  function latestAttemptAt() {
    return db.prepare("SELECT MAX(last_attempt) AS value FROM source_status").get().value || null;
  }

  function history(pair, sinceMs, bucketMs) {
    return db.prepare(`
      SELECT CAST(fetched_at / @bucket AS INTEGER) * @bucket AS t,
             AVG(mid) AS mid, AVG(buy) AS buy, AVG(sell) AS sell,
             MIN(mid) AS low, MAX(mid) AS high
      FROM rates
      WHERE pair = @pair AND fetched_at >= @since AND timestamp_trusted = 1
      GROUP BY t ORDER BY t ASC
    `).all({ pair, since: sinceMs, bucket: bucketMs });
  }

  function changeSince(pair, sinceMs) {
    const first = db.prepare(
      "SELECT mid FROM rates WHERE pair = ? AND fetched_at >= ? AND timestamp_trusted = 1 ORDER BY fetched_at ASC, id ASC LIMIT 1"
    ).get(pair, sinceMs);
    const last = db.prepare(
      "SELECT mid FROM rates WHERE pair = ? AND timestamp_trusted = 1 ORDER BY fetched_at DESC, collected_at DESC, id DESC LIMIT 1"
    ).get(pair);
    if (!first || !last || !first.mid) return null;
    return { abs: last.mid - first.mid, pct: ((last.mid - first.mid) / first.mid) * 100 };
  }

  function sourceStatus() {
    return db.prepare("SELECT * FROM source_status ORDER BY source").all();
  }

  function recordRejection(input, reason) {
    const collectedAt = input?.collected_at || Date.now();
    rejectionInsert.run({
      pair: null,
      source: null,
      buy: null,
      sell: null,
      mid: null,
      fetched_at: input?.fetched_at || input?.source_published_at || collectedAt,
      source_published_at: input?.source_published_at ?? null,
      collected_at: collectedAt,
      ...(input || {}),
      reason,
      rejected_at: Date.now(),
    });
  }

  function confirmOutlier(row, reason, options = {}) {
    const tolerancePct = options.tolerancePct ?? 1.5;
    const maxAgeMs = options.maxAgeMs ?? 2 * 60 * 60 * 1000;
    const requiredSeen = options.requiredSeen ?? 2;
    const now = Date.now();
    const pending = pendingGet.get(row.pair);
    let seenCount = 1;

    if (pending && now - pending.updated_at <= maxAgeMs) {
      const pct = Math.abs((row.mid - pending.mid) / pending.mid) * 100;
      if (pct <= tolerancePct) seenCount = pending.seen_count + 1;
    }

    if (seenCount >= requiredSeen) {
      pendingDelete.run(row.pair);
      return true;
    }

    pendingUpsert.run({ buy: null, sell: null, ...row, seen_count: seenCount, reason, updated_at: now });
    recordRejection(row, `${reason}; awaiting confirmation ${seenCount}/${requiredSeen}`);
    return false;
  }

  function clearPending(pair) {
    pendingDelete.run(pair);
  }

  function close() {
    db.close();
  }

  return {
    db,
    path: resolved,
    insertMany,
    markAttempt,
    markSuccess,
    markError,
    latest,
    latestPerPair,
    latestFetchedAt,
    latestCollectedAt,
    latestAttemptAt,
    history,
    changeSince,
    sourceStatus,
    recordRejection,
    confirmOutlier,
    clearPending,
    close,
  };
}

let defaultDb = null;
function getDefaultDatabase() {
  if (!defaultDb) defaultDb = createDatabase();
  return defaultDb;
}

const api = { createDatabase, getDefaultDatabase };
for (const method of [
  "insertMany", "markAttempt", "markSuccess", "markError", "latest", "latestPerPair",
  "latestFetchedAt", "latestCollectedAt", "latestAttemptAt", "history", "changeSince",
  "sourceStatus", "recordRejection", "confirmOutlier", "clearPending", "close",
]) {
  api[method] = (...args) => getDefaultDatabase()[method](...args);
}
Object.defineProperty(api, "db", { enumerable: true, get: () => getDefaultDatabase().db });
Object.defineProperty(api, "path", { enumerable: true, get: () => getDefaultDatabase().path });

module.exports = api;
