# Changelog

## 1.4.1 — Data Source Integration Hotfix

- Added separate `source_published_at` and `collected_at` timestamps throughout SQLite, API payloads, source health, and the PWA.
- Freshness, charts, and readiness now use the source publication time when a source supplies one.
- Added a safe v1.4 migration: legacy rows with unverifiable timestamps are retained but quarantined from latest/history until replaced by trusted observations.
- Rejects stale Myanmar Currency API, CBM, and CoinGecko datasets before storage.
- Quarantines the currently outdated community market feed instead of presenting it as fresh.
- Normalizes the community feed's customer-side buy/sell labels into app-side buy/bid and sell/ask values.
- Normalizes the upstream `JPN` currency code to `JPY`; unavailable currencies are omitted cleanly.
- Uses CoinGecko's per-asset `last_updated_at` values.
- Public refresh cooldown now uses the last collection attempt, preventing repeated calls when source data itself is stale.
- Added token-protected manual market-rate fallback for individual and batch verified rates.
- Readiness accepts a fresh manual USD/MMK market rate but reports degraded mode until the automatic feed recovers.
- Added live-shape fixtures for the current community and CBM payloads plus parser, readiness, fallback, and missing-market UI tests.
- PWA now distinguishes source time from check time and explains when market rates are unavailable.
- Updated the service-worker shell to `mmrates-shell-v7` and API data cache to `mmrates-data-v2`, purging old offline v1.4 payloads.

## 1.4.0 — Trust, Accuracy & Launch

- Replaced request-time `updated_at` with `server_time` and real `data_updated_at`.
- Added per-rate age and Fresh, Delayed, or Stale states.
- Added source freshness/status details to the latest payload and Profile drawer.
- Replaced public force sync with freshness-aware `POST /v1/refresh`; retained `/v1/sync` as a deprecated alias.
- Added protected `POST /v1/admin/sync` for forced collection.
- Unified startup, cron, public, and admin collection through one in-flight lock.
- Added collection summaries with changed pairs, failures, rejected rows, and unchanged rows.
- Added database parent-directory creation, WAL/busy settings, schema migration helpers, rejection history, and pending outlier confirmation.
- Added pair bounds, spread checks, duplicate prevention, and two-observation confirmation for sudden movements.
- Added a minimum and consistency filter for Binance P2P advertisements; renamed it as a reference rather than a definitive street rate.
- Split health into `/v1/health/live` and `/v1/health/ready`; empty databases now fail readiness.
- Cleared old source errors after recovery.
- Updated converter to use buy and sell correctly and show the output currency and calculation method.
- Added per-rate freshness indicators and honest no-newer-data/partial-source refresh messages.
- Added offline cached latest/history data with an explicit offline marker and real 503 errors when no cache exists.
- Replaced unfinished notification permission behavior with a Coming soon state.
- Added inline profile name editing, System/Light/Dark appearance, focus trapping, focus restoration, and accessible chart descriptions.
- Removed runtime Google Font dependencies from the app shell.
- Added privacy and methodology pages.
- Added security headers, per-IP request limits, constant-time admin-token comparison, production token validation, JSON size limits, and trusted-proxy configuration.
- Added Node tests, backup and smoke-test scripts, PM2 config, Caddy example, and deployment runbook.
- Updated the service-worker cache to `mmrates-shell-v6`.

## 1.3.0 — Header profile and settings redesign

- Moved Profile to a top-right avatar and reduced bottom navigation to four market sections.
- Added Profile & Settings drawer, update checker, appearance/language controls, developer information, sharing, sync, and automatic refresh.
- Changed developer contact email to `alex@minsithu.org`.

## 1.4.1 multiplatform packaging

- Added Android and iOS native share bridge support to the PWA.
- Added a zero-install Python demo server.
- Bumped the service-worker shell to `mmrates-shell-v8`.
