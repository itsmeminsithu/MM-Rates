# MM Rates for Android

Native Android shell for the MM Rates PWA/API. It uses Android `WebView`, native pull-to-refresh, offline recovery, safe external-link handling, and a JavaScript bridge for the system share sheet. The user sees the same Rates, Convert, Gold, Crypto, Profile, Sync, language, and theme interface as the Web app.

![Android preview](screenshots/APP_PREVIEW.png)

## Requirements

- Android Studio Quail 1 or newer
- JDK 17+
- Android SDK 36
- The `Web/` server running locally, or a deployed HTTPS MM Rates URL

## Run in the emulator

1. Start the web server from `../Web`.
2. Open this `Android` folder in Android Studio.
3. Let Gradle sync.
4. Run the `app` configuration.

The debug build defaults to:

```text
http://10.0.2.2:3000
```

`10.0.2.2` is the Android emulator route to your Mac/PC localhost.

## Use another URL

Add this to `~/.gradle/gradle.properties` or pass it on the command line:

```properties
MM_RATES_DEBUG_URL=http://192.168.1.25:3000
MM_RATES_RELEASE_URL=https://mmrates.minsithu.org
```

Build:

```bash
./gradlew test
./gradlew assembleDebug
./gradlew bundleRelease -PMM_RATES_RELEASE_URL=https://your-domain.example
```

## Release checklist

- Deploy `Web/` to HTTPS first.
- Replace `MM_RATES_RELEASE_URL` with the production URL.
- Change the package ID if required.
- Create a signing key and configure release signing outside Git.
- Update `versionCode` and `versionName`.
- Test all external links, offline recovery, pull-to-refresh, and profile actions.
- Build an Android App Bundle (`.aab`) for Google Play.

## Security

The release manifest rejects cleartext HTTP. Debug builds permit HTTP for local development. The WebView keeps only the configured MM Rates origin inside the app; other web links open in the user's browser.

Developer: **Min SiThu** · [minsithu.org](https://minsithu.org) · [@itsmeminsithu](https://github.com/itsmeminsithu) · alex@minsithu.org
