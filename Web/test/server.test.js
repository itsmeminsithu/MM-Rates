const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp, secureEqual, manualRowFromBody } = require("../src/server");

function makeDatabase({ rows = [], statuses = [] } = {}) {
  const inserted = [];
  return {
    inserted,
    db: { prepare: () => ({ get: () => ({ ok: 1 }) }) },
    latestPerPair: () => rows,
    latestFetchedAt: () => rows.length ? Math.max(...rows.map((row) => row.fetched_at)) : null,
    latestCollectedAt: () => rows.length ? Math.max(...rows.map((row) => row.collected_at || row.fetched_at)) : null,
    latestAttemptAt: () => statuses.length ? Math.max(...statuses.map((row) => row.last_attempt || 0)) : null,
    changeSince: () => null,
    sourceStatus: () => statuses,
    latest: (pair) => rows.find((row) => row.pair === pair) || null,
    history: () => [],
    insertMany: (newRows) => inserted.push(...newRows),
    markSuccess: () => {},
    confirmOutlier: () => true,
    clearPending: () => {},
  };
}

async function withServer(app, fn) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { await new Promise((resolve) => server.close(resolve)); }
}

function currentUsd(source = "manual-market") {
  const now = Date.now() - 60_000;
  return {
    pair: "USD_MMK_MARKET",
    source,
    buy: 4380,
    sell: 4480,
    mid: 4430,
    fetched_at: now,
    source_published_at: now,
    collected_at: now + 10_000,
  };
}

test("constant-time token helper checks equal values", () => {
  assert.equal(secureEqual("abc", "abc"), true);
  assert.equal(secureEqual("abc", "abcd"), false);
  assert.equal(secureEqual("", "abc"), false);
});

test("latest exposes source and collection timestamps separately", async () => {
  const row = currentUsd("fixture");
  const database = makeDatabase({ rows: [row] });
  await withServer(createApp({ database, runCollection: async () => ({ skipped: true, reason: "recent_collection_attempt" }), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/latest`);
    const json = await response.json();
    assert.equal(response.status, 200);
    assert.equal(json.data_updated_at, row.fetched_at);
    assert.equal(json.data_collected_at, row.collected_at);
    assert.equal(json.rates[0].source_published_at, row.source_published_at);
    assert.equal(json.rates[0].collected_at, row.collected_at);
    assert.equal(json.rates[0].timestamp_kind, "source_published");
    assert.equal(json.rates[0].freshness, "fresh");
    assert.equal(response.headers.get("x-powered-by"), null);
    assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  });
});

test("readiness fails for an empty database", async () => {
  await withServer(createApp({ database: makeDatabase(), runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/health/ready`);
    const json = await response.json();
    assert.equal(response.status, 503);
    assert.equal(json.status, "not_ready");
    assert.ok(json.core_problems.includes("USD_MMK_MARKET_missing"));
  });
});

test("fresh manual market fallback satisfies readiness but is degraded", async () => {
  const row = currentUsd();
  const database = makeDatabase({ rows: [row], statuses: [{ source: "manual-market", last_success: Date.now(), last_attempt: Date.now(), last_data_at: row.fetched_at, last_collected_at: row.collected_at }] });
  await withServer(createApp({ database, runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/health/ready`);
    const json = await response.json();
    assert.equal(response.status, 200);
    assert.equal(json.status, "degraded");
    assert.equal(json.using_manual_market, true);
    assert.equal(json.core_rate.source, "manual-market");
  });
});

test("stale core rate fails readiness even when collected recently", async () => {
  const sourceAt = Date.now() - 3 * 3600_000;
  const row = { ...currentUsd("fixture"), fetched_at: sourceAt, source_published_at: sourceAt, collected_at: Date.now() };
  await withServer(createApp({ database: makeDatabase({ rows: [row] }), runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/health/ready`);
    const json = await response.json();
    assert.equal(response.status, 503);
    assert.ok(json.core_problems.includes("USD_MMK_MARKET_stale"));
  });
});

test("public refresh reports whether collection changed data", async () => {
  const database = makeDatabase();
  const runCollection = async () => ({
    started: true, joined: false, skipped: false, reason: "collection_started",
    summary: { started_at: 1, finished_at: 2, changed_pairs: ["USD_MMK_MARKET"], success_count: 3, failure_count: 1, failed_sources: ["coingecko"], rejected_rows: 0 },
  });
  await withServer(createApp({ database, runCollection, adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/refresh`, { method: "POST" });
    const json = await response.json();
    assert.equal(response.status, 200);
    assert.equal(json.refresh.collection_changed, true);
    assert.deepEqual(json.refresh.failed_sources, ["coingecko"]);
  });
});

test("manual market rows require both buy and sell and reject old publication times", () => {
  assert.equal(manualRowFromBody({ pair: "USD_MMK_MARKET", mid: 4400 }).error, "market_buy_and_sell_required");
  assert.equal(manualRowFromBody({ pair: "USD_MMK_MARKET", buy: 4380, sell: 4480, published_at: Date.now() - 3 * 3600_000 }).error, "manual_rate_is_stale");
  const parsed = manualRowFromBody({ pair: "USD_MMK_MARKET", buy: 4380, sell: 4480 });
  assert.equal(parsed.row.mid, 4430);
  assert.equal(parsed.row.source, "manual-market");
});

test("admin endpoints reject missing tokens", async () => {
  await withServer(createApp({ database: makeDatabase(), runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/admin/manual-rate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pair: "GOLD_YGN_KYATTHA", mid: 7_850_000 }) });
    assert.equal(response.status, 401);
  });
});

test("admin can post a batch of verified market rates", async () => {
  const database = makeDatabase();
  await withServer(createApp({ database, runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/admin/manual-market-rates`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": "a".repeat(32) },
      body: JSON.stringify({ rates: [{ currency: "USD", buy: 4380, sell: 4480 }, { currency: "JPN", buy: 27.38, sell: 28.4 }] }),
    });
    const json = await response.json();
    assert.equal(response.status, 200);
    assert.equal(json.accepted, 2);
    assert.equal(database.inserted[1].pair, "JPY_MMK_MARKET");
  });
});


test("manual market batch rejects duplicate currencies", async () => {
  const database = makeDatabase();
  await withServer(createApp({ database, runCollection: async () => ({}), adminToken: "a".repeat(32) }), async (base) => {
    const response = await fetch(`${base}/v1/admin/manual-market-rates`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-token": "a".repeat(32) },
      body: JSON.stringify({ rates: [{ currency: "USD", buy: 4380, sell: 4480 }, { currency: "USD", buy: 4381, sell: 4481 }] }),
    });
    const json = await response.json();
    assert.equal(response.status, 400);
    assert.equal(json.error, "duplicate_currency_in_batch");
  });
});
