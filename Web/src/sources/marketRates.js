const URL = "https://myanmar-currency-api.github.io/api/latest.json";
const DEFAULT_MAX_AGE_MS = Number(process.env.MARKET_SOURCE_MAX_AGE_MS || 6 * 60 * 60 * 1000);
const ALIASES = { JPN: "JPY" };
const WANTED = new Set(["USD", "THB", "SGD", "EUR", "MYR", "JPY", "CNY", "KRW"]);

function parseNumber(value) {
  const number = Number.parseFloat(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(number) ? number : null;
}

function epochToMs(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number < 1e12 ? number * 1000 : number);
}

function optionsFrom(input) {
  if (typeof input === "number") return { now: input, maxAgeMs: DEFAULT_MAX_AGE_MS };
  return { now: Date.now(), maxAgeMs: DEFAULT_MAX_AGE_MS, ...(input || {}) };
}

function parseMarketRates(json, input) {
  const { now, maxAgeMs } = optionsFrom(input);
  if (!Array.isArray(json?.data)) throw new Error("market-rates: unexpected shape");

  const sourcePublishedAt = epochToMs(json.epoch)
    || (json.timestamp ? Date.parse(`${json.timestamp}Z`) : null);
  if (!sourcePublishedAt) throw new Error("market-rates: source timestamp is missing");
  if (sourcePublishedAt > now + 5 * 60 * 1000) throw new Error("market-rates: source timestamp is in the future");
  const ageMs = now - sourcePublishedAt;
  if (ageMs > maxAgeMs) {
    throw new Error(`market-rates: source dataset is stale (${Math.floor(ageMs / 3600000)}h old)`);
  }

  const rows = [];
  for (const item of json.data) {
    const rawCurrency = String(item?.currency || "").toUpperCase();
    const currency = ALIASES[rawCurrency] || rawCurrency;
    if (!WANTED.has(currency)) continue;

    // This upstream feed labels customer-side actions: a customer "buy" is the
    // changer's sell/ask, while customer "sell" is the changer's buy/bid.
    // Normalizing low -> buy and high -> sell also protects against label drift.
    const upstreamBuy = parseNumber(item.buy);
    const upstreamSell = parseNumber(item.sell);
    if (!(upstreamBuy > 0) || !(upstreamSell > 0)) continue;
    const buy = Math.min(upstreamBuy, upstreamSell);
    const sell = Math.max(upstreamBuy, upstreamSell);

    rows.push({
      pair: `${currency}_MMK_MARKET`,
      source: "myanmar-currency-api",
      buy,
      sell,
      mid: (buy + sell) / 2,
      fetched_at: sourcePublishedAt,
      source_published_at: sourcePublishedAt,
      collected_at: now,
    });
  }
  if (!rows.length) throw new Error("market-rates: no valid supported rows");
  return rows;
}

async function fetchMarketRates() {
  const response = await fetch(URL, {
    headers: { accept: "application/json", "user-agent": "MM-Rates/1.4.1 (+https://minsithu.org)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`market-rates HTTP ${response.status}`);
  return parseMarketRates(await response.json());
}

module.exports = { fetchMarketRates, parseMarketRates, epochToMs, ALIASES, DEFAULT_MAX_AGE_MS };
