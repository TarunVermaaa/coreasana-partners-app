#!/usr/bin/env bash
# Builds an installable release APK locally (no EAS account needed).
#
#   EXPO_PUBLIC_API_URL=https://your-api.example.com npm run build:apk
#
# The API URL is baked into the JS bundle at build time (it can still be changed in the app:
# long-press the wordmark on the Welcome screen). Output: build/core-asana-partners.apk
set -euo pipefail
cd "$(dirname "$0")/.."

# .env (if present) supplies defaults; anything already exported wins.
if [[ -f .env ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    [[ -z "${!key:-}" ]] && export "$key=$value"
  done < .env
fi
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:4100}"
export EXPO_PUBLIC_USE_FIXTURES=0
export NODE_ENV=production
export JAVA_HOME="${JAVA_HOME:-/Library/Java/JavaVirtualMachines/jdk-17.0.2.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

echo "Building with EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"

# android/ is generated from app.json (Continuous Native Generation) and is not committed.
npx expo prebuild --platform android --clean --no-install

# Release build signed with the template's debug keystore: installable by sideloading (fine for review),
# not for the Play Store. arm64-v8a only keeps the build fast and the APK small.
(cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon)

mkdir -p build
cp android/app/build/outputs/apk/release/app-release.apk build/core-asana-partners.apk
ls -lh build/core-asana-partners.apk
