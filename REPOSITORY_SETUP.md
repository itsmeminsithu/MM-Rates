# Recommended repository settings

## About

**Description:** Myanmar exchange rates, CBM references, gold and crypto for Web, Android and iOS.

**Website:** https://minsithu.org

**Topics:** `myanmar`, `mmk`, `exchange-rates`, `pwa`, `android`, `ios`, `swiftui`, `nodejs`, `sqlite`, `crypto`

## Branch protection

For `main`:

- Require a pull request before merging.
- Do not require CI checks that do not exist yet: this repository contains no `.github/workflows`. If CI is wanted, add the workflows manually through the GitHub web UI first, then require the checks they provide.
- Require branches to be up to date.
- Block force pushes and deletions.

## Secrets

There are no workflows in this repository, so no workflow secrets are needed. Add deployment or store secrets only when a real deployment workflow is created. Use GitHub Environments for production approvals.
