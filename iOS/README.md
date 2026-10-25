# MM Rates for iOS

SwiftUI + `WKWebView` iPhone/iPad shell for the MM Rates Web app. It preserves the same Rates, Convert, Gold, Crypto, Profile, Sync, language, theme, chart, and freshness experience while adding native pull-to-refresh, system sharing, external-link safety, and an offline recovery card.

![iOS preview](screenshots/APP_PREVIEW.png)

## Requirements

- macOS with Xcode 26 or a recent Xcode release
- iOS 16+
- The `Web/` server running locally, or a deployed HTTPS MM Rates URL

## Run in the simulator

1. Start the server from `../Web`.
2. Open `MMRates.xcodeproj`.
3. Select an iPhone simulator.
4. Press **Run**.

The Debug configuration loads:

```text
http://127.0.0.1:3000
```

## Run on a physical iPhone

A phone cannot use your Mac's `127.0.0.1`. Either:

- deploy the Web app to HTTPS, or
- change `Configuration/Debug.xcconfig` to your Mac's LAN address and add a matching temporary ATS exception for development.

## Production

Edit `Configuration/Release.xcconfig`:

```text
MM_RATES_WEB_URL = https:/$()/your-domain.example
PRODUCT_BUNDLE_IDENTIFIER = your.bundle.identifier
```

Then choose your Apple Developer team under **Signing & Capabilities**, archive the Release build, and upload it to TestFlight/App Store Connect.

A thin web-content app can receive additional App Review scrutiny. Keep the native pull-to-refresh, sharing, offline handling, safe-link behavior, and future native notifications/widgets meaningful, and verify the latest App Store policies before submission.

Developer: **Min SiThu** · [minsithu.org](https://minsithu.org) · [@itsmeminsithu](https://github.com/itsmeminsithu) · alex@minsithu.org
