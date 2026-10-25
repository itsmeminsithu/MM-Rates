const URL = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";
const MIN_ADS = 5;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function parseAdPrices(json, tradeType) {
  const raw = Array.isArray(json?.data) ? json.data : [];
  const prices = raw
    .map((item) => Number.parseFloat(item?.adv?.price))
    .filter((price) => Number.isFinite(price) && price > 0);
  if (prices.length < MIN_ADS) throw new Error(`binance-p2p: only ${prices.length} usable ${tradeType} ads`);

  const center = median(prices);
  const filtered = prices.filter((price) => Math.abs(price - center) / center <= 0.15);
  if (filtered.length < MIN_ADS) throw new Error(`binance-p2p: ${tradeType} ads are too inconsistent`);
  return median(filtered);
}

async function side(tradeType) {
  const response = await fetch(URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "user-agent": "MM-Rates/1.4.1 (+https://minsithu.org)",
    },
    body: JSON.stringify({
      asset: "USDT",
      fiat: "MMK",
      tradeType,
      page: 1,
      rows: 10,
      payTypes: [],
      publisherType: null,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`binance-p2p HTTP ${response.status}`);
  return parseAdPrices(await response.json(), tradeType);
}

async function fetchUsdtMmkP2P() {
  // Binance BUY ads are offers to sell USDT to the user (our sell/ask rate).
  // Binance SELL ads are offers to buy USDT from the user (our buy/bid rate).
  const [sell, buy] = await Promise.all([side("BUY"), side("SELL")]);
  const now = Date.now();
  return [{
    pair: "USDT_MMK_P2P",
    source: "binance-p2p",
    buy,
    sell,
    mid: (buy + sell) / 2,
    fetched_at: now,
    source_published_at: null,
    collected_at: now,
  }];
}

module.exports = { fetchUsdtMmkP2P, parseAdPrices, median };
