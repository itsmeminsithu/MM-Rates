const test = require("node:test");
const assert = require("node:assert/strict");
const { validateRow, collectAll, runCollection } = require("../src/collect");

function mockDatabase(previous = null) {
  const calls = { inserted: [], rejected: [], success: [], errors: [], attempts: [] };
  return {
    calls,
    latest: () => previous,
    latestAttemptAt: () => null,
    confirmOutlier: () => false,
    clearPending: () => {},
    recordRejection: (row, reason) => calls.rejected.push({ row, reason }),
    insertMany: (rows) => calls.inserted.push(...rows),
    markAttempt: (source) => calls.attempts.push(source),
    markSuccess: (...args) => calls.success.push(args),
    markError: (...args) => calls.errors.push(args),
  };
}

const now = Date.now();
const validUsd = {
  pair: "USD_MMK_MARKET",
  source: "fixture",
  buy: 4480,
  sell: 4520,
  mid: 4500,
  fetched_at: now,
  source_published_at: now,
  collected_at: now,
};

test("validator accepts a reasonable market row", () => {
  assert.deepEqual(validateRow(validUsd, mockDatabase()), { ok: true, changed: true });
});

test("validator rejects impossible values", () => {
  const result = validateRow({ ...validUsd, mid: 99 }, mockDatabase());
  assert.equal(result.ok, false);
  assert.match(result.reason, /outside allowed range/);
});

test("validator rejects inconsistent source and effective timestamps", () => {
  const result = validateRow({ ...validUsd, fetched_at: now - 10_000 }, mockDatabase());
  assert.equal(result.ok, false);
  assert.match(result.reason, /must match source_published_at/);
});

test("validator rejects reversed buy and sell rates", () => {
  const result = validateRow({ ...validUsd, buy: 4550, sell: 4450 }, mockDatabase());
  assert.equal(result.ok, false);
  assert.match(result.reason, /buy rate cannot exceed sell rate/);
});

test("validator rejects a midpoint outside the quoted spread", () => {
  const result = validateRow({ ...validUsd, mid: 4600 }, mockDatabase());
  assert.equal(result.ok, false);
  assert.match(result.reason, /mid must be between buy and sell/);
});

test("validator skips identical snapshots inside ten minutes using collection time", () => {
  const previous = { ...validUsd, collected_at: validUsd.collected_at - 60_000 };
  const result = validateRow(validUsd, mockDatabase(previous));
  assert.equal(result.unchanged, true);
});

test("validator skips the same source-published snapshot even after ten minutes", () => {
  const previous = { ...validUsd, collected_at: validUsd.collected_at - 30 * 60_000 };
  const laterCheck = { ...validUsd, collected_at: validUsd.collected_at };
  const result = validateRow(laterCheck, mockDatabase(previous));
  assert.equal(result.unchanged, true);
  assert.match(result.reason, /source-published/);
});

test("validator holds a sudden jump for confirmation", () => {
  const database = mockDatabase({ ...validUsd, mid: 4000, buy: 3980, sell: 4020, collected_at: now - 30 * 60_000 });
  const result = validateRow({ ...validUsd, mid: 5000, buy: 4980, sell: 5020 }, database);
  assert.equal(result.pending, true);
});

test("collector stores accepted rows and reports source failures", async () => {
  const database = mockDatabase();
  const summary = await collectAll({ database, sources: [
    { name: "good", core: true, fn: async () => [validUsd] },
    { name: "bad", core: false, fn: async () => { throw new Error("fixture failed"); } },
  ] });
  assert.equal(summary.success_count, 1);
  assert.equal(summary.failure_count, 1);
  assert.deepEqual(summary.changed_pairs, ["USD_MMK_MARKET"]);
  assert.equal(database.calls.inserted.length, 1);
  assert.equal(database.calls.success[0][3].lastDataAt, validUsd.fetched_at);
  assert.equal(database.calls.errors[0][0], "bad");
});

test("collector treats an empty upstream result as a failure", async () => {
  const database = mockDatabase();
  const summary = await collectAll({ database, sources: [
    { name: "empty", core: true, fn: async () => [] },
  ] });
  assert.equal(summary.success_count, 0);
  assert.equal(summary.failure_count, 1);
  assert.match(database.calls.errors[0][1], /no rows/);
});

test("public collection cooldown uses the last attempt, not stale data time", async () => {
  const database = mockDatabase();
  database.latestAttemptAt = () => Date.now() - 1000;
  const outcome = await runCollection({ database, force: false, minAgeMs: 600_000, sources: [] });
  assert.equal(outcome.skipped, true);
  assert.equal(outcome.reason, "recent_collection_attempt");
});
