#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_KIND="${1:-apk}"

case "$BUILD_KIND" in
  apk)
    GRADLE_TASK="assembleRelease"
    OUTPUT_HINT="android/app/build/outputs/apk/release/app-release.apk"
    ;;
  aab|bundle)
    GRADLE_TASK="bundleRelease"
    OUTPUT_HINT="android/app/build/outputs/bundle/release/app-release.aab"
    ;;
  *)
    echo "Unsupported build kind: $BUILD_KIND"
    echo "Use: apk | aab"
    exit 1
    ;;
esac

ENV_FILE=""
for candidate in \
  "$ROOT_DIR/.env.production.local" \
  "$ROOT_DIR/.env.production" \
  "$ROOT_DIR/.env.local" \
  "$ROOT_DIR/.env"
do
  if [ -f "$candidate" ]; then
    ENV_FILE="$candidate"
    break
  fi
done

if [ -z "$ENV_FILE" ]; then
  echo "No env file found."
  echo "Create .env.production.local or .env.production with EXPO_PUBLIC_API_BASE_URL."
  exit 1
fi

echo "Using env file: $ENV_FILE"

cd "$ROOT_DIR"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

npm run check:prod-env

cd "$ROOT_DIR/android"
./gradlew "$GRADLE_TASK"

echo
echo "Release build finished."
echo "Expected output: $ROOT_DIR/$OUTPUT_HINT"
