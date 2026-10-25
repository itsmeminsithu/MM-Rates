# MM Rates v1.4.1 deployment runbook

## 1. Server baseline

Use an Ubuntu VPS with a supported Node.js LTS release, persistent storage, a non-root deploy user, and inbound ports 22, 80, and 443 only.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y caddy git build-essential python3
sudo npm install -g pm2
```

## 2. Install

```bash
git clone https://github.com/itsmeminsithu/mm-rates-api.git
cd mm-rates-api
cp .env.example .env
npm ci
npm test
npm run check
```

Set `NODE_ENV=production`, `TRUST_PROXY=true`, a persistent absolute `DB_PATH`, and a random `ADMIN_TOKEN` of at least 24 characters.

```bash
openssl rand -hex 32
```

Review all source-age settings in `.env`. The defaults intentionally reject an automatic market dataset older than six hours.

## 3. Establish a verified core market rate

The current community market feed may be rejected as stale. Before expecting readiness, publish a recently verified USD/MMK buy/sell pair through the admin fallback:

```bash
curl -X POST http://127.0.0.1:3000/v1/admin/manual-market-rates \
  -H "content-type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  --data '{"rates":[{"currency":"USD","buy":4380,"sell":4480}]}'
```

Replace the example values with rates you have verified from trusted money-changer channels. Do not automate this command with unverified inputs.

Confirm:

```bash
curl -fsS http://127.0.0.1:3000/v1/health/ready
```

A manual fallback should return HTTP 200 with `status: "degraded"` and `using_manual_market: true`. HTTP 503 means the core market rate is missing or stale.

## 4. Run with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Run the command printed by `pm2 startup`.

## 5. HTTPS with Caddy

Copy `deploy/Caddyfile.example` to `/etc/caddy/Caddyfile`, replace the hostname, point DNS to the VPS, then:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 6. Backup and restore

```bash
npm run backup
ls -lh backups/
```

Example daily cron:

```cron
20 2 * * * cd /srv/mm-rates-api && /usr/bin/npm run backup >> /var/log/mmrates-backup.log 2>&1
```

Restore test:

1. Stop the app: `pm2 stop mm-rates-api`.
2. Copy the selected backup over `DB_PATH`.
3. Start the app: `pm2 start mm-rates-api`.
4. Run `npm run smoke` and inspect chart history.

## 7. Monitoring

- `/v1/health/live` must return 200.
- `/v1/health/ready` must return 200 for user traffic.
- Alert if `core_rate.effective_at` is older than `CORE_STALE_MS`.
- Alert when `automatic_market_source_ok` is false, even if a manual fallback keeps readiness at 200.
- Monitor `sources[].last_error` for stale-dataset quarantine messages.
- Monitor disk, process restarts, and backup creation.

## 8. Private live trial

Run privately for at least 48–72 hours before broad sharing:

- Compare USD/MMK and THB/MMK with at least two trusted money-changer references several times daily.
- Compare USDT/MMK against the actual Binance P2P payment methods and order sizes relevant to users.
- Confirm CBM source time matches its published response.
- Confirm stale automatic feeds do not become fresh after refresh or restart.
- Confirm manual rates expire and readiness returns 503 after `CORE_STALE_MS` unless updated.
- Test backup restoration on a separate copy.
- Test offline launch, profile, language, appearance, update flow, charts, and converter on installed Android and iPhone PWAs.

## 9. Release checklist

- `npm ci`, `npm test`, `npm run check`, and `npm audit --omit=dev` pass.
- Service-worker shell is bumped for the release.
- Privacy and methodology pages are public.
- `/v1/health/ready` returns 200 with verified current data.
- The app clearly labels manual-market fallback and source/check times.
- No admin token, `.env`, database, or backup is included in the release archive.
- DNS, HTTPS, backups, restore test, and external monitoring are working.
