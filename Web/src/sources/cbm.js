const URL = "https://forex.cbm.gov.mm/api/latest";
const DEFAULT_MAX_AGE_MS = Number(process.env.CBM_SOURCE_MAX_AGE_MS || 72 * 60 * 60 * 1000);
const WANTED = new Set(["USD", "THB", "SGD", "EUR"]);

function epochToMs(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.round(number < 1e12 ? number * 1000 : number);
}

function optionsFrom(input) {
  if (typeof input === "number") return { now: input, maxAgeMs: DEFAULT_MAX_AGE_MS };
  return { now: Date.now(), maxAgeMs: DEFAULT_MAX_AGE_MS, ...(input || {}) };
}

function parseCbmOfficial(json, input) {
  const { now, maxAgeMs } = optionsFrom(input);
  if (!json?.rates || typeof json.rates !== "object") throw new Error("cbm: unexpected shape");
  const sourcePublishedAt = epochToMs(json.timestamp);
  if (!sourcePublishedAt) throw new Error("cbm: source timestamp is missing");
  if (sourcePublishedAt > now + 5 * 60 * 1000) throw new Error("cbm: source timestamp is in the future");
  const ageMs = now - sourcePublishedAt;
  if (ageMs > maxAgeMs) throw new Error(`cbm: source dataset is stale (${Math.floor(ageMs / 3600000)}h old)`);

  const rows = [];
  for (const [currency, raw] of Object.entries(json.rates)) {
    if (!WANTED.has(currency)) continue;
    const mid = Number.parseFloat(String(raw).replace(/,/g, ""));
    if (!Number.isFinite(mid) || mid <= 0) continue;
    rows.push({
      pair: `${currency}_MMK_OFFICIAL`,
      source: "cbm",
      mid,
      fetched_at: sourcePublishedAt,
      source_published_at: sourcePublishedAt,
      collected_at: now,
    });
  }
  if (!rows.length) throw new Error("cbm: no valid rows");
  return rows;
}

async function fetchCbmOfficial() {
  const response = await fetch(URL, {
    headers: { accept: "application/json", "user-agent": "MM-Rates/1.4.1 (+https://minsithu.org)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`cbm HTTP ${response.status}`);
  return parseCbmOfficial(await response.json());
}

module.exports = { fetchCbmOfficial, parseCbmOfficial, epochToMs, DEFAULT_MAX_AGE_MS };
