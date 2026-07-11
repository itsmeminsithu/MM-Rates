# Upload MM Rates to GitHub

## Option A — GitHub website

1. Sign in to GitHub.
2. Create a new repository named `mm-rates`.
3. Do not add another README, license, or `.gitignore` because they are already included.
4. On your Mac, open Terminal in the extracted `MM-Rates` folder and run the commands below.

```bash
git init
git add .
git commit -m "Initial MM Rates multiplatform release"
git branch -M main
git remote add origin https://github.com/itsmeminsithu/mm-rates.git
git push -u origin main
```

## Option B — GitHub CLI

```bash
gh auth login
gh repo create itsmeminsithu/mm-rates --public --source=. --remote=origin --push
```

## After upload

- Add repository description: `Myanmar exchange rates, gold and crypto — Web, Android and iOS.`
- Add topics: `myanmar`, `exchange-rates`, `pwa`, `android`, `ios`, `swiftui`, `webview`, `sqlite`, `nodejs`.
- Enable Issues and Discussions if desired.
- Review Actions on the first push.
- Add branch protection for `main` after CI is green.
- Never upload `.env`, admin tokens, databases, signing keys, or provisioning profiles.
