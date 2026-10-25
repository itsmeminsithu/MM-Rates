require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const cron = require("node-cron");
const path = require("path");
const dbApi = require("./db");
const { validateRow, runCollection, collectionState, MANUAL_MARKET_PAIRS } = require("./collect");

const PORT = Number(process.env.PORT || 3000);
const CRON = process.env.CRON_SCHEDULE || "*/30 * * * *";
const PUBLIC_REFRESH_MIN_AGE_MS = Number(process.env.PUBLIC_REFRESH_MIN_AGE_MS || 10 * 60 * 1000);
const CORE_STALE_MS = Number(process.env.CORE_STALE_MS || 2 * 60 * 60 * 1000);
const OPTIONAL_STALE_MS = Number(process.env.OPTIONAL_STALE_MS || 6 * 60 * 60 * 1000);
const OFFICIAL_STALE_MS = Number(process.env.OFFICIAL_STALE_MS || 72 * 60 * 60 * 1000);
const GOLD_STALE_MS = Number(process.env.GOLD_STALE_MS || 36 * 60 * 60 * 1000);

const EXPECTED_SOURCES = [
  { source: "market-rates", core: false, stale_ms: CORE_STALE_MS },
  { source: "cbm-official", core: false, stale_ms: OFFICIAL_STALE_MS },
  { source: "coingecko", core: false, stale_ms: CORE_STALE_MS },
  { source: "binance-p2p", core: false, stale_ms: CORE_STALE_MS },
];

const RANGES = {
  "24h": { ms: 24 * 3600e3, bucket: 15 * 60e3 },
  "7d": { ms: 7 * 24 * 3600e3, bucket: 2 * 3600e3 },
  "30d": { ms: 30 * 24 * 3600e3, bucket: 8 * 3600e3 },
  "90d": { ms: 90 * 24 * 3600e3, bucket: 24 * 3600e3 },
};

function secureEqual(value, expected) {
  if (!value || !expected) return false;
  const a = crypto.createHash("sha256").update(String(value)).digest();
  const b = crypto.createHash("sha256").update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

function createRateLimiter({ windowMs, max, name }) {
  const buckets = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, item] of buckets) if (item.resetAt <= now) buckets.delete(key);
  }, Math.min(windowMs, 60_000));
  timer.unref?.();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: "rate_limited", limiter: name, retry_after_ms: bucket.resetAt - now });
    }
    next();
  };
}

function securityHeaders(req, res, next) {
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (process.env.NODE_ENV === "production") csp.push("upgrade-insecure-requests");
  res.set({
    "Content-Security-Policy": csp.join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Permitted-Cross-Domain-Policies": "none",
  });
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  next();
}

function freshnessThresholds(pair) {
  if (pair.endsWith("_MMK_OFFICIAL")) return { fresh: 36 * 60 * 60 * 1000, stale: OFFICIAL_STALE_MS };
  if (pair === "GOLD_YGN_KYATTHA") return { fresh: 12 * 60 * 60 * 1000, stale: GOLD_STALE_MS };
  if (["BTC_USD", "ETH_USD", "USDT_USD", "XAU_USD_PROXY"].includes(pair)) {
    return { fresh: 30 * 60 * 1000, stale: 2 * 60 * 60 * 1000 };
  }
  return { fresh: 45 * 60 * 1000, stale: CORE_STALE_MS };
}

function freshnessLabel(ageMs, pair = "") {
  const thresholds = freshnessThresholds(pair);
  if (ageMs < thresholds.fresh) return "fresh";
  if (ageMs < thresholds.stale) return "delayed";
  return "stale";
}

function sourceFreshnessLabel(ageMs, source, staleMs) {
  const freshMs = source === "cbm-official" ? 36 * 60 * 60 * 1000
    : source === "manual-gold" ? 12 * 60 * 60 * 1000
      : source === "coingecko" ? 30 * 60 * 1000
        : 45 * 60 * 1000;
  if (ageMs < freshMs) return "fresh";
  if (ageMs < staleMs) return "delayed";
  return "stale";
}

function buildSourceHealth(database, now = Date.now()) {
  const statusRows = database.sourceStatus();
  const byName = new Map(statusRows.map((item) => [item.source, item]));
  const definitions = [...EXPECTED_SOURCES];
  for (const row of statusRows) {
    if (!definitions.some((item) => item.source === row.source) && row.last_success) {
      const staleMs = row.source === "manual-market" ? CORE_STALE_MS
        : row.source === "manual-gold" ? GOLD_STALE_MS
          : OPTIONAL_STALE_MS;
      definitions.push({ source: row.source, core: false, stale_ms: staleMs });
    }
  }

  return definitions.map((expected) => {
    const row = byName.get(expected.source) || {};
    const dataAt = row.last_data_at || null;
    const dataAgeMs = dataAt ? Math.max(0, now - dataAt) : null;
    const checkedAgeMs = row.last_attempt ? Math.max(0, now - row.last_attempt) : null;
    const latestCheckFailed = Boolean(row.last_error && (!row.last_success || row.last_error_at >= row.last_success));
    const missingStatus = latestCheckFailed && /stale/i.test(row.last_error || "") ? "stale" : "missing";
    return {
      source: expected.source,
      core: expected.core,
      last_success: row.last_success || null,
      last_attempt: row.last_attempt || null,
      last_data_at: dataAt,
      last_collected_at: row.last_collected_at || null,
      last_error: row.last_error || null,
      last_error_at: row.last_error_at || null,
      check_status: latestCheckFailed ? "error" : row.last_attempt ? "ok" : "never_checked",
      accepted_rows: row.accepted_rows || 0,
      rejected_rows: row.rejected_rows || 0,
      age_ms: dataAgeMs,
      checked_age_ms: checkedAgeMs,
      status: dataAgeMs == null ? missingStatus : sourceFreshnessLabel(dataAgeMs, expected.source, expected.stale_ms),
    };
  });
}

function latestPayload(database, extra = {}) {
  const now = Date.now();
  const rates = database.latestPerPair().map((row) => {
    const effectiveAt = row.source_published_at || row.fetched_at || row.collected_at;
    const ageMs = Math.max(0, now - effectiveAt);
    return {
      ...row,
      effective_at: effectiveAt,
      timestamp_kind: row.source_published_at ? "source_published" : "collected",
      age_ms: ageMs,
      freshness: freshnessLabel(ageMs, row.pair),
      change24h: database.changeSince(row.pair, now - 24 * 3600e3),
    };
  });
  const usd = rates.find((row) => row.pair === "USD_MMK_MARKET") || null;
  return {
    server_time: now,
    data_updated_at: typeof database.latestFetchedAt === "function" ? database.latestFetchedAt() : null,
    data_collected_at: typeof database.latestCollectedAt === "function" ? database.latestCollectedAt() : null,
    core_updated_at: usd?.effective_at || null,
    collection: (() => {
      const state = collectionState();
      const persisted = typeof database.latestAttemptAt === "function" ? database.latestAttemptAt() : null;
      return { ...state, last_attempt_at: Math.max(state.last_attempt_at || 0, persisted || 0) || null };
    })(),
    sources: buildSourceHealth(database, now),
    rates,
    ...extra,
  };
}

function validateProductionConfig(adminToken) {
  if (process.env.NODE_ENV !== "production") return;
  const weak = !adminToken || adminToken.length < 24 || /change-me|password|secret|admin/i.test(adminToken);
  if (weak) throw new Error("ADMIN_TOKEN must be a random value of at least 24 characters in production");
}

function manualRowFromBody(body, now = Date.now()) {
  const pair = String(body?.pair || "").toUpperCase();
  const isGold = pair === "GOLD_YGN_KYATTHA";
  const isMarket = MANUAL_MARKET_PAIRS.has(pair);
  if (!isGold && !isMarket) return { error: "manual_pair_not_allowed" };

  const sourcePublishedAt = body?.published_at == null ? now : Number(body.published_at);
  if (!Number.isInteger(sourcePublishedAt) || sourcePublishedAt <= 0) return { error: "invalid_published_at" };
  if (now - sourcePublishedAt > (isGold ? GOLD_STALE_MS : CORE_STALE_MS)) return { error: "manual_rate_is_stale" };

  const buy = body?.buy == null ? null : Number(body.buy);
  const sell = body?.sell == null ? null : Number(body.sell);
  let mid = body?.mid == null ? null : Number(body.mid);
  if (isMarket && (!(buy > 0) || !(sell > 0))) return { error: "market_buy_and_sell_required" };
  if (mid == null && buy > 0 && sell > 0) mid = (buy + sell) / 2;

  return {
    row: {
      pair,
      source: isGold ? "manual-gold" : "manual-market",
      buy,
      sell,
      mid,
      fetched_at: sourcePublishedAt,
      source_published_at: sourcePublishedAt,
      collected_at: now,
    },
  };
}

function createApp(options = {}) {
  const database = options.database || dbApi;
  const collect = options.runCollection || runCollection;
  const adminToken = options.adminToken ?? process.env.ADMIN_TOKEN ?? "";
  validateProductionConfig(adminToken);

  const app = express();
  if (process.env.TRUST_PROXY) app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : process.env.TRUST_PROXY);
  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(express.json({ limit: "16kb", strict: true }));

  const historyLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 180, name: "history" });
  const refreshLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 12, name: "refresh" });
  const adminLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 20, name: "admin" });

  app.get("/v1/latest", (req, res) => {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.json(latestPayload(database));
  });

  app.get("/v1/history", historyLimiter, (req, res) => {
    const pair = String(req.query.pair || "").toUpperCase();
    const rangeName = String(req.query.range || "24h");
    const range = RANGES[rangeName];
    if (!/^[A-Z0-9_]{3,50}$/.test(pair)) return res.status(400).json({ error: "invalid_pair" });
    if (!range) return res.status(400).json({ error: "invalid_range", allowed: Object.keys(RANGES) });
    const points = database.history(pair, Date.now() - range.ms, range.bucket);
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
    res.json({ pair, range: rangeName, points });
  });

  async function publicRefresh(req, res) {
    try {
      const outcome = await collect({ database, force: false, minAgeMs: PUBLIC_REFRESH_MIN_AGE_MS });
      const summary = outcome.summary;
      res.set("Cache-Control", "no-store");
      res.json(latestPayload(database, {
        refresh: {
          started: outcome.started,
          joined: outcome.joined,
          skipped: outcome.skipped,
          reason: outcome.reason,
          next_refresh_in_ms: outcome.next_refresh_in_ms || 0,
          attempted_at: summary?.started_at || null,
          finished_at: summary?.finished_at || null,
          collection_changed: Boolean(summary?.changed_pairs?.length),
          changed_pairs: summary?.changed_pairs || [],
          success_count: summary?.success_count || 0,
          failure_count: summary?.failure_count || 0,
          failed_sources: summary?.failed_sources || [],
          accepted_rows: summary?.accepted_rows || 0,
          rejected_rows: summary?.rejected_rows || 0,
        },
      }));
    } catch (error) {
      res.status(502).json({ error: "collection_failed", message: String(error.message || error).slice(0, 200) });
    }
  }

  app.post("/v1/refresh", refreshLimiter, publicRefresh);
  app.post("/v1/sync", refreshLimiter, (req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Link", '</v1/refresh>; rel="successor-version"');
    return publicRefresh(req, res, next);
  });

  app.post("/v1/admin/sync", adminLimiter, async (req, res) => {
    if (!secureEqual(req.get("x-admin-token"), adminToken)) return res.status(401).json({ error: "unauthorized" });
    try {
      const outcome = await collect({ database, force: true, minAgeMs: 0 });
      res.json(latestPayload(database, { refresh: { ...outcome, summary: outcome.summary } }));
    } catch (error) {
      res.status(502).json({ error: "collection_failed", message: String(error.message || error).slice(0, 200) });
    }
  });

  app.post("/v1/admin/manual-rate", adminLimiter, (req, res) => {
    if (!secureEqual(req.get("x-admin-token"), adminToken)) return res.status(401).json({ error: "unauthorized" });
    const parsed = manualRowFromBody(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const result = validateRow(parsed.row, database);
    if (!result.ok) return res.status(400).json({ error: "invalid_rate", reason: result.reason, pending: Boolean(result.pending) });
    database.insertMany([parsed.row]);
    database.markSuccess(parsed.row.source, 1, 0, { lastDataAt: parsed.row.fetched_at, lastCollectedAt: parsed.row.collected_at });
    res.json({ ok: true, rate: parsed.row, data_updated_at: database.latestFetchedAt() });
  });

  app.post("/v1/admin/manual-market-rates", adminLimiter, (req, res) => {
    if (!secureEqual(req.get("x-admin-token"), adminToken)) return res.status(401).json({ error: "unauthorized" });
    if (!Array.isArray(req.body?.rates) || !req.body.rates.length || req.body.rates.length > 20) {
      return res.status(400).json({ error: "rates_must_be_a_nonempty_array", max: 20 });
    }
    const now = Date.now();
    const publishedAt = req.body?.published_at == null ? now : Number(req.body.published_at);
    const candidates = req.body.rates.map((item) => {
      const currency = String(item?.currency || "").toUpperCase() === "JPN" ? "JPY" : String(item?.currency || "").toUpperCase();
      return manualRowFromBody({ ...item, pair: `${currency}_MMK_MARKET`, published_at: publishedAt }, now);
    });
    const parseError = candidates.find((item) => item.error);
    if (parseError) return res.status(400).json({ error: parseError.error });

    const rows = candidates.map((item) => item.row);
    const uniquePairs = new Set(rows.map((row) => row.pair));
    if (uniquePairs.size !== rows.length) return res.status(400).json({ error: "duplicate_currency_in_batch" });
    const validation = rows.map((row) => ({ row, result: validateRow(row, database) }));
    const invalid = validation.find((item) => !item.result.ok);
    if (invalid) {
      return res.status(400).json({ error: "invalid_rate", pair: invalid.row.pair, reason: invalid.result.reason, pending: Boolean(invalid.result.pending) });
    }
    database.insertMany(rows);
    database.markSuccess("manual-market", rows.length, 0, { lastDataAt: publishedAt, lastCollectedAt: now });
    res.json({ ok: true, accepted: rows.length, rates: rows, data_updated_at: database.latestFetchedAt() });
  });

  app.get("/v1/health/live", (req, res) => {
    try {
      database.db.prepare("SELECT 1 AS ok").get();
      res.json({ ok: true, server_time: Date.now() });
    } catch {
      res.status(503).json({ ok: false, error: "database_unavailable" });
    }
  });

  app.get("/v1/health/ready", (req, res) => {
    const now = Date.now();
    const sources = buildSourceHealth(database, now);
    const usd = database.latest("USD_MMK_MARKET");
    const usdAt = usd ? (usd.source_published_at || usd.fetched_at || usd.collected_at) : null;
    const coreProblems = [];
    if (!usd) coreProblems.push("USD_MMK_MARKET_missing");
    else if (!usdAt || now - usdAt > CORE_STALE_MS) coreProblems.push("USD_MMK_MARKET_stale");

    const ready = coreProblems.length === 0;
    const optionalProblems = sources
      .filter((source) => ["missing", "stale"].includes(source.status))
      .map((source) => source.source);
    const autoMarket = sources.find((source) => source.source === "market-rates");
    const usingManualMarket = ready && usd?.source === "manual-market";

    res.status(ready ? 200 : 503).json({
      ok: ready,
      status: ready ? (optionalProblems.length || usingManualMarket ? "degraded" : "ready") : "not_ready",
      data_updated_at: typeof database.latestFetchedAt === "function" ? database.latestFetchedAt() : null,
      data_collected_at: typeof database.latestCollectedAt === "function" ? database.latestCollectedAt() : null,
      core_rate: usd ? { pair: usd.pair, source: usd.source, effective_at: usdAt, freshness: freshnessLabel(now - usdAt, usd.pair) } : null,
      core_problems: coreProblems,
      optional_problems: optionalProblems,
      using_manual_market: usingManualMarket,
      automatic_market_source_ok: Boolean(autoMarket && ["fresh", "delayed"].includes(autoMarket.status)),
      sources,
    });
  });

  app.get("/v1/health", (req, res) => res.redirect(307, "/v1/health/ready"));

  app.use(express.static(path.join(__dirname, "..", "public"), {
    etag: true,
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      if (filePath.endsWith("index.html")) res.setHeader("Cache-Control", "no-cache");
    },
  }));

  app.use((req, res) => {
    if (req.path.startsWith("/v1/")) return res.status(404).json({ error: "not_found" });
    res.status(404).sendFile(path.join(__dirname, "..", "public", "index.html"));
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error?.type === "entity.too.large") return res.status(413).json({ error: "payload_too_large" });
    if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ error: "invalid_json" });
    console.error("[server] unhandled error:", error);
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}

function startServer() {
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[mm-rates-api] listening on :${PORT}, cron ${CRON}, db ${dbApi.path}`);
    runCollection({ force: false, minAgeMs: PUBLIC_REFRESH_MIN_AGE_MS }).catch((error) => console.error("[startup collect]", error));
  });

  const task = cron.schedule(CRON, () => {
    runCollection({ force: true, minAgeMs: 0 }).catch((error) => console.error("[cron collect]", error));
  });

  const shutdown = () => {
    task.stop();
    server.close(() => {
      dbApi.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
}

module.exports = {
  createApp,
  startServer,
  secureEqual,
  buildSourceHealth,
  latestPayload,
  createRateLimiter,
  freshnessLabel,
  manualRowFromBody,
};

if (require.main === module) startServer();
