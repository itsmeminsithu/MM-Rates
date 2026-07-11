# Recommended repository settings

## About

**Description:** Myanmar exchange rates, CBM references, gold and crypto for Web, Android and iOS.

**Website:** https://minsithu.org

**Topics:** `myanmar`, `mmk`, `exchange-rates`, `pwa`, `android`, `ios`, `swiftui`, `nodejs`, `sqlite`, `crypto`

## Branch protection

For `main`:

- Require a pull request before merging.
- Require Web CI, Android CI, iOS CI, and Repository Check.
- Require branches to be up to date.
- Block force pushes and deletions.

## Secrets

The included workflows do not need production secrets. Add deployment or store secrets only when a real deployment workflow is created. Use GitHub Environments for production approvals.
