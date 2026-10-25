const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

test("mobile UI renders freshness, profile, converter and refresh states", async () => {
  const publicDir = path.join(__dirname, "..", "public");
  const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8").replace('<script src="/app.js"></script>', "");
  const appJs = fs.readFileSync(path.join(publicDir, "app.js"), "utf8");
  const now = Date.now() - 12 * 60 * 1000;
  const rates = [
    { pair: "USD_MMK_MARKET", source: "myanmar-currency-api", buy: 4480, sell: 4520, mid: 4500, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: { abs: 10, pct: 0.22 } },
    { pair: "USD_MMK_OFFICIAL", source: "cbm", buy: null, sell: null, mid: 2100, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "THB_MMK_MARKET", source: "myanmar-currency-api", buy: 132, sell: 136, mid: 134, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: { abs: 1, pct: 0.75 } },
    { pair: "USDT_MMK_P2P", source: "binance-p2p", buy: 4510, sell: 4550, mid: 4530, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: { abs: -5, pct: -0.11 } },
    { pair: "BTC_USD", source: "coingecko", buy: null, sell: null, mid: 108000, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "SGD_MMK_MARKET", source: "myanmar-currency-api", buy: 3400, sell: 3440, mid: 3420, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "EUR_MMK_MARKET", source: "myanmar-currency-api", buy: 5000, sell: 5050, mid: 5025, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "GOLD_YGN_KYATTHA", source: "manual", buy: null, sell: null, mid: 7850000, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "XAU_USD_PROXY", source: "coingecko", buy: null, sell: null, mid: 3300, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "ETH_USD", source: "coingecko", buy: null, sell: null, mid: 4200, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
    { pair: "USDT_USD", source: "coingecko", buy: null, sell: null, mid: 1, fetched_at: now, source_published_at: now, collected_at: now + 1000, effective_at: now, freshness: "fresh", change24h: null },
  ];
  const sources = ["market-rates", "cbm-official", "coingecko", "binance-p2p"].map((source) => ({ source, core: false, last_success: now, last_attempt: now + 1000, last_data_at: now, status: "fresh" }));
  const payload = { server_time: Date.now(), data_updated_at: now, data_collected_at: now + 1000, core_updated_at: now, sources, rates };

  const dom = new JSDOM(html, {
    url: "https://mmrates.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      window.Response = Response;
      window.Headers = Headers;
      window.Request = Request;
      window.fetch = async (url) => {
        const value = String(url);
        const body = value.includes("/v1/history")
          ? { points: [{ t: now - 3600000, mid: 4400 }, { t: now, mid: 4500 }] }
          : value.includes("/v1/refresh")
            ? { ...payload, refresh: { started: false, skipped: true, reason: "data_is_fresh", collection_changed: false, failure_count: 0 } }
            : payload;
        return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
      };
      window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
    },
  });

  dom.window.eval(appJs);
  await wait(30);
  const document = dom.window.document;
  assert.match(document.body.textContent, /USD \/ MMK/);
  assert.match(document.body.textContent, /Fresh/);

  document.querySelector("#profileBtn").click();
  await wait();
  assert.equal(document.querySelector("#profileOverlay").hidden, false);
  assert.match(document.querySelector("#profileContent").textContent, /Coming soon/);
  assert.match(document.querySelector("#profileContent").textContent, /alex@minsithu\.org/);
  assert.match(document.querySelector("#profileContent").textContent, /Data sources/);

  document.querySelector("#editName").click();
  document.querySelector("#profileNameInput").value = "Min SiThu";
  document.querySelector("#saveName").click();
  assert.equal(document.querySelector("#headerInitials").textContent, "MS");

  document.querySelector("#profileClose").click();
  document.querySelector('[data-tab="convert"]').click();
  assert.match(document.querySelector("#view").textContent, /448,000 MMK/);
  assert.match(document.querySelector("#view").textContent, /market buy rate/);

  document.querySelector("#syncBtn").click();
  await wait(20);
  assert.match(document.querySelector("#updatedLine").textContent, /checked recently/i);
  dom.window.close();
});


test("rates screen explains when the core market feed is unavailable", async () => {
  const publicDir = path.join(__dirname, "..", "public");
  const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8").replace('<script src="/app.js"></script>', "");
  const appJs = fs.readFileSync(path.join(publicDir, "app.js"), "utf8");
  const now = Date.now() - 30 * 60_000;
  const payload = { server_time: Date.now(), data_updated_at: now, rates: [{ pair: "USD_MMK_OFFICIAL", source: "cbm", mid: 2100, fetched_at: now, source_published_at: now, collected_at: Date.now(), effective_at: now, freshness: "fresh", change24h: null }], sources: [] };
  const dom = new JSDOM(html, {
    url: "https://mmrates.test/", runScripts: "outside-only", pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      window.Response = Response; window.Headers = Headers; window.Request = Request;
      window.fetch = async () => new Response(JSON.stringify(payload), { status: 200, headers: { "content-type": "application/json" } });
      window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {};
    },
  });
  dom.window.eval(appJs);
  await wait(30);
  assert.match(dom.window.document.querySelector("#view").textContent, /Market rates are temporarily unavailable/);
  assert.match(dom.window.document.querySelector("#view").textContent, /USD \/ MMK \(CBM\)/);
  dom.window.close();
});
