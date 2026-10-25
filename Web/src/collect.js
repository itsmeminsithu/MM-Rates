const dbApi = require("./db");
const { fetchMarketRates } = require("./sources/marketRates");
const { fetchCbmOfficial } = require("./sources/cbm");
const { fetchCrypto } = require("./sources/coingecko");
const { fetchUsdtMmkP2P } = require("./sources/binanceP2P");

const SOURCES = [
  { name: "market-rates", fn: fetchMarketRates, core: true },
  { name: "cbm-official", fn: fetchCbmOfficial, core: false },
  { name: "coingecko", fn: fetchCrypto, core: false },
  { name: "binance-p2p", fn: fetchUsdtMmkP2P, core: false },
];

const PAIR_RULES = {
  USD_MMK_MARKET: { min: 500, max: 20000, jumpPct: 12 },
  THB_MMK_MARKET: { min: 10, max: 1000, jumpPct: 12 },
  SGD_MMK_MARKET: { min: 300, max: 15000, jumpPct: 12 },
  EUR_MMK_MARKET: { min: 500, max: 25000, jumpPct: 12 },
  MYR_MMK_MARKET: { min: 50, max: 5000, jumpPct: 15 },
  JPY_MMK_MARKET: { min: 1, max: 500, jumpPct: 15 },
  CNY_MMK_MARKET: { min: 50, max: 5000, jumpPct: 15 },
  KRW_MMK_MARKET: { min: 0.1, max: 100, jumpPct: 18 },
  USD_MMK_OFFICIAL: { min: 500, max: 10000, jumpPct: 8 },
  THB_MMK_OFFICIAL: { min: 10, max: 500, jumpPct: 8 },
  SGD_MMK_OFFICIAL: { min: 300, max: 10000, jumpPct: 8 },
  EUR_MMK_OFFICIAL: { min: 500, max: 15000, jumpPct: 8 },
  USDT_MMK_P2P: { min: 500, max: 20000, jumpPct: 15 },
  BTC_USD: { min: 1000, max: 1000000, jumpPct: 25 },
  ETH_USD: { min: 50, max: 100000, jumpPct: 25 },
  USDT_USD: { min: 0.8, max: 1.2, jumpPct: 8 },
  XAU_USD_PROXY: { min: 500, max: 10000, jumpPct: 15 },
  GOLD_YGN_KYATTHA: { min: 500000, max: 50000000, jumpPct: 15 },
};

const MANUAL_MARKET_PAIRS = new Set(Object.keys(PAIR_RULES).filter((pair) => pair.endsWith("_MMK_MARKET")));

function numeric(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function nullableEqual(a, b, scale) {
  if (a == null || b == null) return a == null && b == null;
  return Math.abs(a - b) < Math.max(1e-8, scale * 1e-8);
}

function validateRow(row, database = dbApi) {
  if (!row || typeof row !== "object") return { ok: false, reason: "row is not an object" };
  if (!/^[A-Z0-9_]{3,50}$/.test(String(row.pair || ""))) return { ok: false, reason: "invalid pair" };
  if (!String(row.source || "").trim()) return { ok: false, reason: "missing source" };
  if (!numeric(row.mid) || row.mid <= 0) return { ok: false, reason: "mid must be positive" };
  if (!Number.isInteger(row.fetched_at) || row.fetched_at <= 0) return { ok: false, reason: "invalid fetched_at" };
  if (!Number.isInteger(row.collected_at) || row.collected_at <= 0) return { ok: false, reason: "invalid collected_at" };
  if (row.source_published_at != null && (!Number.isInteger(row.source_published_at) || row.source_published_at <= 0)) {
    return { ok: false, reason: "invalid source_published_at" };
  }
  const now = Date.now();
  if (row.fetched_at > now + 5 * 60 * 1000) return { ok: false, reason: "fetched_at is too far in the future" };
  if (row.collected_at > now + 5 * 60 * 1000) return { ok: false, reason: "collected_at is too far in the future" };
  if (row.source_published_at != null && row.source_published_at > now + 5 * 60 * 1000) {
    return { ok: false, reason: "source_published_at is too far in the future" };
  }
  if (row.source_published_at != null && Math.abs(row.fetched_at - row.source_published_at) > 1000) {
    return { ok: false, reason: "fetched_at must match source_published_at when provided" };
  }
  if (row.source_published_at == null && Math.abs(row.fetched_at - row.collected_at) > 1000) {
    return { ok: false, reason: "fetched_at must match collected_at when source time is unavailable" };
  }
  if (row.buy != null && (!numeric(row.buy) || row.buy <= 0)) return { ok: false, reason: "buy must be positive" };
  if (row.sell != null && (!numeric(row.sell) || row.sell <= 0)) return { ok: false, reason: "sell must be positive" };

  const rule = PAIR_RULES[row.pair];
  if (!rule) return { ok: false, reason: "unsupported pair" };
  if (row.mid < rule.min || row.mid > rule.max) return { ok: false, reason: `mid outside allowed range ${rule.min}-${rule.max}` };

  if (row.buy != null && row.sell != null) {
    if (row.buy > row.sell) return { ok: false, reason: "buy rate cannot exceed sell rate" };
    if (row.mid < row.buy || row.mid > row.sell) return { ok: false, reason: "mid must be between buy and sell" };
    const spreadPct = ((row.sell - row.buy) / row.mid) * 100;
    if (spreadPct > 25) return { ok: false, reason: `spread too wide (${spreadPct.toFixed(2)}%)` };
  }

  const previous = database.latest(row.pair);
  let changed = true;
  if (previous) {
    const sameValue = Math.abs(previous.mid - row.mid) < Math.max(1e-8, row.mid * 1e-8)
      && nullableEqual(previous.buy, row.buy, row.mid)
      && nullableEqual(previous.sell, row.sell, row.mid);
    changed = !sameValue;
    const previousCollectedAt = previous.collected_at || previous.fetched_at;
    const samePublishedSnapshot = row.source_published_at != null
      && previous.source_published_at != null
      && row.source_published_at === previous.source_published_at;
    if (sameValue && (samePublishedSnapshot || row.collected_at - previousCollectedAt < 10 * 60 * 1000)) {
      return { ok: false, unchanged: true, reason: samePublishedSnapshot
        ? "duplicate source-published snapshot"
        : "duplicate snapshot inside 10-minute window" };
    }

    const jumpPct = Math.abs((row.mid - previous.mid) / previous.mid) * 100;
    if (jumpPct > rule.jumpPct) {
      const reason = `sudden movement ${jumpPct.toFixed(2)}% exceeds ${rule.jumpPct}%`;
      if (!database.confirmOutlier(row, reason)) return { ok: false, pending: true, reason };
    } else {
      database.clearPending(row.pair);
    }
  }

  return { ok: true, changed };
}

async function collectAll(options = {}) {
  const database = options.database || dbApi;
  const sourceDefs = options.sources || SOURCES;
  const startedAt = Date.now();
  const results = [];
  const changedPairs = [];

  for (const source of sourceDefs) {
    database.markAttempt(source.name);
    try {
      const rows = await source.fn();
      if (!Array.isArray(rows)) throw new Error("collector did not return an array");
      if (!rows.length) throw new Error("collector returned no rows");
      const accepted = [];
      const observed = [];
      let rejected = 0;
      let unchanged = 0;
      const rejectedReasons = [];

      for (const row of rows) {
        const result = validateRow(row, database);
        if (result.ok) {
          accepted.push(row);
          observed.push(row);
          if (result.changed) changedPairs.push(row.pair);
        } else if (result.unchanged) {
          observed.push(row);
          unchanged += 1;
        } else {
          rejected += 1;
          rejectedReasons.push(`${row?.pair || "unknown"}: ${result.reason}`);
          if (!result.pending) database.recordRejection(row || {}, result.reason);
        }
      }

      if (!accepted.length && !unchanged && rejected) throw new Error(`all ${rejected} candidate rows were rejected`);
      if (accepted.length) database.insertMany(accepted);
      const lastDataAt = Math.max(...observed.map((row) => row.fetched_at).filter(Number.isFinite));
      const lastCollectedAt = Math.max(...observed.map((row) => row.collected_at).filter(Number.isFinite));
      database.markSuccess(source.name, accepted.length, rejected, {
        lastDataAt: Number.isFinite(lastDataAt) ? lastDataAt : null,
        lastCollectedAt: Number.isFinite(lastCollectedAt) ? lastCollectedAt : Date.now(),
      });
      results.push({
        source: source.name,
        core: Boolean(source.core),
        ok: true,
        accepted: accepted.length,
        rejected,
        unchanged,
        data_at: Number.isFinite(lastDataAt) ? lastDataAt : null,
        collected_at: Number.isFinite(lastCollectedAt) ? lastCollectedAt : null,
        errors: rejectedReasons.slice(0, 5),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      database.markError(source.name, message);
      results.push({ source: source.name, core: Boolean(source.core), ok: false, accepted: 0, rejected: 0, unchanged: 0, error: message });
      console.error(`[collect] ${source.name} failed:`, message);
    }
  }

  const summary = {
    started_at: startedAt,
    finished_at: Date.now(),
    success_count: results.filter((item) => item.ok).length,
    failure_count: results.filter((item) => !item.ok).length,
    accepted_rows: results.reduce((sum, item) => sum + item.accepted, 0),
    rejected_rows: results.reduce((sum, item) => sum + item.rejected, 0),
    unchanged_rows: results.reduce((sum, item) => sum + item.unchanged, 0),
    changed_pairs: [...new Set(changedPairs)],
    failed_sources: results.filter((item) => !item.ok).map((item) => item.source),
    results,
  };

  console.log(`[collect] ${new Date(summary.finished_at).toISOString()} — ${summary.success_count} ok, ${summary.failure_count} failed, ${summary.accepted_rows} accepted, ${summary.rejected_rows} rejected, ${summary.unchanged_rows} unchanged`);
  return summary;
}

let collectionInFlight = null;
let lastCollectionAttemptAt = 0;

async function runCollection(options = {}) {
  const database = options.database || dbApi;
  const force = Boolean(options.force);
  const minAgeMs = options.minAgeMs ?? 10 * 60 * 1000;
  const now = Date.now();
  const persistedAttemptAt = typeof database.latestAttemptAt === "function" ? database.latestAttemptAt() : null;
  const mostRecentAttemptAt = Math.max(lastCollectionAttemptAt || 0, persistedAttemptAt || 0) || null;

  if (collectionInFlight) {
    const summary = await collectionInFlight;
    return { started: false, joined: true, skipped: false, reason: "collection_in_flight", summary };
  }

  if (!force && mostRecentAttemptAt && now - mostRecentAttemptAt < minAgeMs) {
    return {
      started: false,
      joined: false,
      skipped: true,
      reason: "recent_collection_attempt",
      next_refresh_in_ms: Math.max(0, minAgeMs - (now - mostRecentAttemptAt)),
      summary: null,
    };
  }

  lastCollectionAttemptAt = now;
  collectionInFlight = collectAll(options).finally(() => {
    collectionInFlight = null;
  });
  const summary = await collectionInFlight;
  return { started: true, joined: false, skipped: false, reason: "collection_started", summary };
}

function collectionState() {
  return { in_flight: Boolean(collectionInFlight), last_attempt_at: lastCollectionAttemptAt || null };
}

module.exports = { SOURCES, PAIR_RULES, MANUAL_MARKET_PAIRS, validateRow, collectAll, runCollection, collectionState };

if (require.main === module) {
  runCollection({ force: true }).then(() => process.exit(0)).catch(() => process.exit(1));
}
