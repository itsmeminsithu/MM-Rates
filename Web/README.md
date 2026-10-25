# MM Rates API + PWA

**Current version: 1.4.1 — Data Source Integration Hotfix**

MM Rates is a bilingual Myanmar exchange-rate PWA and SQLite-backed API. Market rates are the primary view, with CBM official references, Yangon gold, crypto, and a Binance P2P reference.

Developer: **MIN SITHU** · [minsithu.org](https://minsithu.org) · [GitHub](https://github.com/itsmeminsithu) · alex@minsithu.org

## Important current source status

The community Myanmar Currency API currently publishes a dataset timestamped June 21, 2024. v1.4.1 rejects it automatically and will not display it as fresh. Until that feed recovers or a second reliable automated market source is integrated, use the protected manual market-rate fallback for verified current values.

This is deliberate fail-closed behavior: missing market data is safer than old market data labeled as current.

## What changed in v1.4.1

- Stores both `source_published_at` and `collected_at`; legacy v1.4 rows with unverifiable timestamps are quarantined from latest/history after migration.
- Freshness and readiness use the provider's publication time when available.
- Rejects stale community, CBM, and CoinGecko datasets before storage.
- Normalizes the community feed's customer-side buy/sell labels into app-side buy and sell.
- Maps upstream `JPN` to `JPY` and omits unavailable currencies.
- Uses CoinGecko `last_updated_at` timestamps.
- Public refresh cooldown is based on the last attempt, not the age of stale source data.
- Adds individual and batch admin endpoints for manually verified market rates.
- Allows fresh manual USD/MMK data to satisfy readiness in degraded mode.
- The PWA distinguishes source time from check time and explains missing market data.
- Service-worker shell is `mmrates-shell-v8`; API data cache is `mmrates-data-v2`, so old offline payloads are purged during upgrade.

## Quick start

```bash
cp .env.example .env
npm ci
npm test
npm start
```

Open `http://localhost:3000`.

The database parent directory is created automatically. `data/mmrates.db` is the historical chart archive; back it up.

## Timestamp model

Each rate has:

- `source_published_at`: provider publication time, or `null` if unavailable.
- `collected_at`: when MM Rates downloaded or accepted the value.
- `fetched_at`: backward-compatible effective data time. It equals `source_published_at` when available, otherwise `collected_at`.
- `effective_at`: API convenience field used for freshness.
- `timestamp_kind`: `source_published` or `collected`.

Example:

```json
{
  "pair": "USD_MMK_MARKET",
  "source": "manual-market",
  "buy": 4380,
  "sell": 4480,
  "mid": 4430,
  "source_published_at": 1783760000000,
  "collected_at": 1783760060000,
  "effective_at": 1783760000000,
  "freshness": "fresh"
}
```

## API

### `GET /v1/latest`

Returns the newest usable stored rate for each pair, source health, source/collection timestamps, and per-rate freshness.

### `GET /v1/history?pair=USD_MMK_MARKET&range=24h`

Allowed ranges: `24h`, `7d`, `30d`, and `90d`.

### `POST /v1/refresh`

Public, rate-limited, and attempt-aware. It will not repeatedly call upstream services within `PUBLIC_REFRESH_MIN_AGE_MS`, even when an upstream dataset is stale.

`POST /v1/sync` remains as a deprecated compatibility alias.

### `POST /v1/admin/sync`

Forces collection. Requires `x-admin-token`.

### `POST /v1/admin/manual-rate`

Requires `x-admin-token`. Accepts `GOLD_YGN_KYATTHA` or any supported `*_MMK_MARKET` pair. Market pairs require both `buy` and `sell`.

```json
{
  "pair": "USD_MMK_MARKET",
  "buy": 4380,
  "sell": 4480,
  "published_at": 1783760000000
}
```

`published_at` is optional and defaults to the current time. Old manual values are rejected.

### `POST /v1/admin/manual-market-rates`

Posts a verified batch. `JPN` is accepted as an alias for `JPY`.

```json
{
  "published_at": 1783760000000,
  "rates": [
    { "currency": "USD", "buy": 4380, "sell": 4480 },
    { "currency": "THB", "buy": 119.05, "sell": 123.46 },
    { "currency": "JPY", "buy": 27.38, "sell": 28.40 }
  ]
}
```

Example curl:

```bash
curl -X POST https://mmrates.example.com/v1/admin/manual-market-rates \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  --data @verified-market-rates.json
```

### Health

- `GET /v1/health/live`: process and database liveness.
- `GET /v1/health/ready`: requires a fresh `USD_MMK_MARKET` row. A fresh manual fallback returns 200 with `status: "degraded"` and `using_manual_market: true`.
- `GET /v1/health`: compatibility redirect to readiness.

## Validation and source-age limits

Configure these in `.env`:

- `MARKET_SOURCE_MAX_AGE_MS` — default 6 hours.
- `CBM_SOURCE_MAX_AGE_MS` — default 72 hours.
- `CRYPTO_SOURCE_MAX_AGE_MS` — default 2 hours.
- `CORE_STALE_MS` — readiness limit for USD/MMK market data, default 2 hours.

Pair bounds, positive-number checks, spread limits, timestamp consistency, and supported-pair rules are also applied. Identical values inside ten minutes are skipped. A sudden movement above the pair threshold must be observed again before publication.

## PWA behavior

- Four bottom sections: Rates, Convert, Gold, Crypto.
- Top profile avatar and notification information shortcut.
- Header refresh button and pull-to-refresh share the same safe public refresh flow.
- If core market data is unavailable, the app says so and continues showing other valid references.
- Unsupported/missing currencies are omitted from cards and converter options.
- Source time and checked time are shown separately.
- Last successful latest/history responses remain available offline.
- Push notifications remain marked Coming soon; no subscription is created.

## Commands

```bash
npm start
npm test
npm run check
npm run audit
npm run backup
npm run smoke
```

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md). Do not make the app public until `/v1/health/ready` returns 200 with a verified fresh USD/MMK market rate and you have completed the live trial checklist.

## Disclaimer

MM Rates aggregates public reference data for information only. It is not a money changer and does not provide a transaction quote. Confirm rates and fees directly with the provider before any transaction.

## Multiplatform repository

This folder is the canonical backend and PWA used by the sibling `Android/` and `iOS/` native shells. For a zero-install UI preview, see [`DEMO.md`](DEMO.md).

Developer contact: **alex@minsithu.org**.

Native-shell packaging uses service-worker shell `mmrates-shell-v8`.
