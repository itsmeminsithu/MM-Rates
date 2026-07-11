# Multiplatform release checklist

## Shared

- [ ] Version updated in Web `package.json`, Android Gradle config, iOS Info plists, and root changelog.
- [ ] Production Web URL is final and HTTPS.
- [ ] Rates, freshness, error states, English/Burmese, light/dark, Profile, Sync, Convert, Gold, and Crypto are tested.
- [ ] Privacy and methodology pages are current.
- [ ] Screenshots are current.

## Web

- [ ] `npm run check`, `npm test`, and production audit pass.
- [ ] Service-worker cache version was bumped.
- [ ] Database backup and restore were tested.
- [ ] `/v1/health/live` and `/v1/health/ready` are monitored.
- [ ] Verified market source or manual fallback is current.

## Android

- [ ] Production URL set.
- [ ] Release signing configured outside Git.
- [ ] `versionCode` incremented.
- [ ] AAB tested on a physical device.
- [ ] Store listing, privacy URL, and data-safety form reviewed.

## iOS

- [ ] Production URL and bundle identifier set.
- [ ] Apple Developer team selected.
- [ ] Build number incremented.
- [ ] Archive validated and tested through TestFlight.
- [ ] App privacy answers and review notes are accurate.
