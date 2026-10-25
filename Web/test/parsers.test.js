const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseMarketRates } = require("../src/sources/marketRates");
const { parseCbmOfficial } = require("../src/sources/cbm");
const { parseCrypto } = require("../src/sources/coingecko");
const { parseAdPrices, median } = require("../src/sources/binanceP2P");

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8"));
const MARKET_PUBLISHED_AT = 1718952608455;

test("market parser rejects the currently published stale dataset", () => {
  const json = fixture("myanmar-currency-api-2024.json");
  assert.throws(() => parseMarketRates(json, { now: Date.UTC(2026, 6, 11), maxAgeMs: 6 * 3600_000 }), /dataset is stale/);
});

test("market parser normalizes customer-side labels and JPN alias", () => {
  const json = fixture("myanmar-currency-api-2024.json");
  const now = MARKET_PUBLISHED_AT + 60_000;
  const rows = parseMarketRates(json, { now, maxAgeMs: 2 * 3600_000 });
  const usd = rows.find((row) => row.pair === "USD_MMK_MARKET");
  const jpy = rows.find((row) => row.pair === "JPY_MMK_MARKET");
  assert.equal(usd.buy, 4380);
  assert.equal(usd.sell, 4480);
  assert.equal(usd.mid, 4430);
  assert.equal(usd.source_published_at, MARKET_PUBLISHED_AT);
  assert.equal(usd.collected_at, now);
  assert.ok(jpy);
});

test("CBM parser uses the source timestamp rather than collection time", () => {
  const json = fixture("cbm-current-shape.json");
  const sourceAt = 1783670400000;
  const now = sourceAt + 12 * 3600_000;
  const rows = parseCbmOfficial(json, { now, maxAgeMs: 72 * 3600_000 });
  const usd = rows.find((row) => row.pair === "USD_MMK_OFFICIAL");
  assert.equal(usd.fetched_at, sourceAt);
  assert.equal(usd.source_published_at, sourceAt);
  assert.equal(usd.collected_at, now);
  assert.equal(rows.some((row) => row.pair === "JPY_MMK_OFFICIAL"), false);
});

test("CBM parser rejects an unexpected payload", () => {
  assert.throws(() => parseCbmOfficial({}, { now: Date.now() }), /unexpected shape/);
});

test("crypto parser requires current asset timestamps", () => {
  const now = 1_800_000_000_000;
  const updated = Math.floor((now - 60_000) / 1000);
  const rows = parseCrypto({
    bitcoin: { usd: 100000, last_updated_at: updated },
    tether: { usd: 1, last_updated_at: updated },
  }, { now, maxAgeMs: 2 * 3600_000 });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].pair, "BTC_USD");
  assert.equal(rows[0].source_published_at, updated * 1000);
  assert.throws(() => parseCrypto({ bitcoin: { usd: 100000 } }, { now }), /no current valid rows/);
});

test("Binance parser requires enough consistent advertisements", () => {
  const data = Array.from({ length: 10 }, (_, index) => ({ adv: { price: String(4495 + index) } }));
  assert.equal(parseAdPrices({ data }, "BUY"), median(data.map((item) => Number(item.adv.price))));
  assert.throws(() => parseAdPrices({ data: data.slice(0, 4) }, "SELL"), /only 4 usable/);
});
