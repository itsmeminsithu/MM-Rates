# Contributing

1. Create an issue describing the change.
2. Create a branch from `main`.
3. Keep platform behavior aligned with the canonical `Web/` UI and API.
4. Run relevant checks before opening a pull request.

## Checks

```bash
cd Web && npm ci && npm run check && npm test
cd ../Android && ./gradlew test assembleDebug
```

For iOS, build the `MMRates` scheme for an iPhone Simulator in Xcode.

Never commit `.env`, admin tokens, databases, signing keys, provisioning profiles, or store credentials.
