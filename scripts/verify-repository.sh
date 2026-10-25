#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
required=(
  README.md
  Android/app/src/main/AndroidManifest.xml
  Android/gradle/wrapper/gradle-wrapper.jar
  Android/screenshots/APP_PREVIEW.png
  iOS/MMRates.xcodeproj/project.pbxproj
  iOS/MMRates/WebAppView.swift
  iOS/screenshots/APP_PREVIEW.png
  Web/package.json
  Web/public/index.html
  Web/screenshots/APP_PREVIEW.png
  APP_PREVIEW.png
)
for path in "${required[@]}"; do
  [[ -f "$path" ]] || { echo "Missing: $path" >&2; exit 1; }
done
python3 -m py_compile Web/scripts/demo_server.py
node --check Web/public/app.js
node --check Web/public/sw.js
printf 'Repository structure and static checks passed.\n'
