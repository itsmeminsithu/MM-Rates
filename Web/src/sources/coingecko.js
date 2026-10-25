const URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,pax-gold&vs_currencies=usd&include_last_updated_at=true";
const DEFAULT_MAX_AGE_MS = Number(process.env.CRYPTO_SOURCE_MAX_AGE_MS || 2 * 60 * 60 * 1000);

function optionsFrom(input) {
  if (typeof input === "number") return { now: input, maxAgeMs: DEFAULT_MAX_AGE_MS };
  return { now: Date.now(), maxAgeMs: DEFAULT_MAX_AGE_MS, ...(input || {}) };
}

function parseCrypto(json, input) {
  const { now, maxAgeMs } = optionsFrom(input);
  const mapping = [
    ["bitcoin", "BTC_USD"],
    ["ethereum", "ETH_USD"],
    ["tether", "USDT_USD"],
    ["pax-gold", "XAU_USD_PROXY"],
  ];
  const rows = [];
  const errors = [];
  for (const [id, pair] of mapping) {
    const mid = json?.[id]?.usd;
    const rawTimestamp = Number(json?.[id]?.last_updated_at);
    const sourcePublishedAt = Number.isFinite(rawTimestamp) && rawTimestamp > 0
      ? Math.round(rawTimestamp < 1e12 ? rawTimestamp * 1000 : rawTimestamp)
      : null;
    if (typeof mid !== "number" || !Number.isFinite(mid) || mid <= 0) continue;
    if (!sourcePublishedAt) {
      errors.push(`${id}: missing last_updated_at`);
      continue;
    }
    if (sourcePublishedAt > now + 5 * 60 * 1000) {
      errors.push(`${id}: timestamp is in the future`);
      continue;
    }
    if (now - sourcePublishedAt > maxAgeMs) {
      errors.push(`${id}: stale timestamp`);
      continue;
    }
    rows.push({
      pair,
      source: "coingecko",
      mid,
      fetched_at: sourcePublishedAt,
      source_published_at: sourcePublishedAt,
      collected_at: now,
    });
  }
  if (!rows.length) throw new Error(`coingecko: no current valid rows${errors.length ? ` (${errors.join(", ")})` : ""}`);
  return rows;
}

async function fetchCrypto() {
  const response = await fetch(URL, {
    headers: { accept: "application/json", "user-agent": "MM-Rates/1.4.1 (+https://minsithu.org)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`coingecko HTTP ${response.status}`);
  return parseCrypto(await response.json());
}

module.exports = { fetchCrypto, parseCrypto, DEFAULT_MAX_AGE_MS };
