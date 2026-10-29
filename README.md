# MM Rates

Myanmar exchange rates in one place: CBM official reference rates, Yangon gold, crypto, conversion, and charts, with an English/Burmese UI and a note on how old each rate is. One repository holds the Web app, the Android project, and the iOS project.

![MM Rates app preview](GitHub/APP_PREVIEW.png)

New to it? Read [`QUICK_START.md`](QUICK_START.md), or double-click `RUN_DEMO_ON_MAC.command`.

## Repository structure

| Folder | Purpose |
|---|---|
| [`Web/`](Web/) | Node.js API, SQLite history collector, PWA, admin endpoints, Docker, PM2, Caddy, tests, privacy policy, methodology page |
| [`Android/`](Android/) | Android Studio project. Same Web app in a native WebView shell, with native refresh, sharing, and offline recovery |
| [`iOS/`](iOS/) | SwiftUI/Xcode project using WKWebView. Same interface, native refresh, sharing, safe external links, offline recovery |
| [`GitHub/`](GitHub/) | Repository setup, upload instructions, release checklist, store copy, preview assets |
| [`.github/`](.github/) | CI workflows, Dependabot, issue templates, pull-request template |

## How it fits together

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

The PWA is the main product. Android and iOS are shells around the same deployed HTTPS app, so every platform uses the same UI, the same API, the same profile/settings, and the same rate logic.

## UI preview, no npm needed

```bash
cd Web
python3 scripts/demo_server.py
```

Open `http://localhost:3000`. This uses mock rates and collects no production data.

## Run the real Web backend

```bash
cd Web
cp .env.example .env
npm ci
npm test
npm start
```

Open `http://localhost:3000`.

Production needs a strong `ADMIN_TOKEN`, HTTPS, backups, monitoring, and current verified market data. Read [`Web/DEPLOYMENT.md`](Web/DEPLOYMENT.md).

## Android

Open [`Android/`](Android/) in Android Studio. Debug defaults to `http://10.0.2.2:3000`, which points the Android emulator at the host machine.

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

## Data warning

MM Rates shows aggregated public reference rates. It is not a transaction quote. The automatic community market feed can go stale, and it is rejected when its provider timestamp is older than the configured age limit. Use a verified manual fallback, or another market source you trust, before a public launch.

## Version

- Multiplatform repository: **1.4.1**
- Web/PWA cache: **`mmrates-shell-v8`**
- Developer: **Min SiThu**
- Website: **https://minsithu.org**
- GitHub: **https://github.com/itsmeminsithu**
- Contact: **alex@minsithu.org**

## License

ISC — see [`LICENSE`](LICENSE).
