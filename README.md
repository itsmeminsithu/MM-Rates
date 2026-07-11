# MM Rates

> Myanmar exchange rates, CBM official references, Yangon gold, crypto, conversion, charts, bilingual English/Burmese UI, and transparent freshness information — delivered as Web, Android, and iOS projects from one repository.

![MM Rates app preview](GitHub/APP_PREVIEW.png)

**New here?** See [`QUICK_START.md`](QUICK_START.md), or double-click `RUN_DEMO_ON_MAC.command`.

## Repository structure

| Folder | Purpose |
|---|---|
| [`Web/`](Web/) | Canonical Node.js API, SQLite history collector, PWA, admin endpoints, Docker, PM2, Caddy, tests, privacy policy, and methodology page |
| [`Android/`](Android/) | Android Studio project that presents the same Web experience in a secured native WebView shell with native refresh, sharing, and offline recovery |
| [`iOS/`](iOS/) | SwiftUI/Xcode project using WKWebView with the same interface, native refresh, sharing, safe external links, and offline recovery |
| [`GitHub/`](GitHub/) | Repository setup, upload instructions, release checklist, store copy, and preview assets |
| [`.github/`](.github/) | CI workflows, Dependabot, issue templates, and pull-request template |

## Architecture

```text
Android app ─┐
             ├── hosted MM Rates Web/PWA ── MM Rates API ── SQLite
 iOS app ────┘                                 │
 Browser/PWA ───────────────────────────────────┘
                                               ├─ CBM
                                               ├─ CoinGecko
                                               ├─ Binance P2P
                                               ├─ verified manual market fallback
                                               └─ manual Yangon gold
```

The PWA is the canonical product. Android and iOS are native shells around the same deployed HTTPS app, so all platforms share one UI, one API contract, one profile/settings experience, and one release of the rate logic.

## Fastest UI preview — no npm required

```bash
cd Web
python3 scripts/demo_server.py
```

Open `http://localhost:3000`.

This uses mock rates and does not collect production data.

## Run the real Web backend

```bash
cd Web
cp .env.example .env
npm ci
npm test
npm start
```

Open `http://localhost:3000`.

Production requires a strong `ADMIN_TOKEN`, HTTPS, backups, monitoring, and current verified market data. Read [`Web/DEPLOYMENT.md`](Web/DEPLOYMENT.md).

## Android

Open [`Android/`](Android/) in Android Studio. Debug defaults to `http://10.0.2.2:3000`, which routes the Android emulator to the host computer.

```bash
cd Android
./gradlew test
./gradlew assembleDebug
```

Set the production URL with:

```bash
./gradlew bundleRelease -PMM_RATES_RELEASE_URL=https://your-domain.example
```

See [`Android/README.md`](Android/README.md).

## iOS

Open [`iOS/MMRates.xcodeproj`](iOS/MMRates.xcodeproj) in Xcode. Debug defaults to `http://127.0.0.1:3000` for the iOS Simulator. Change [`iOS/Configuration/Release.xcconfig`](iOS/Configuration/Release.xcconfig) before archiving.

See [`iOS/README.md`](iOS/README.md).

## GitHub upload

Read [`GitHub/UPLOAD_TO_GITHUB.md`](GitHub/UPLOAD_TO_GITHUB.md), or run:

```bash
git init
git add .
git commit -m "Initial MM Rates multiplatform release"
git branch -M main
git remote add origin https://github.com/itsmeminsithu/mm-rates.git
git push -u origin main
```

## Important data warning

MM Rates displays aggregated public reference rates. It is not a transaction quote. The automatic community market feed may be stale and is rejected when its provider timestamp exceeds the configured age limit. Use a verified manual fallback or integrate another reliable market source before public launch.

## Version

- Multiplatform repository: **1.4.1**
- Web/PWA cache: **`mmrates-shell-v8`**
- Developer: **Min SiThu**
- Website: **https://minsithu.org**
- GitHub: **https://github.com/itsmeminsithu**
- Contact: **alex@minsithu.org**

## License

ISC — see [`LICENSE`](LICENSE).
