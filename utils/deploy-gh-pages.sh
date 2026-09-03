#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${1:-${REPO_URL:-}}"
if [ -z "$REPO_URL" ]; then
  echo "Укажите URL репозитория: ./deploy-gh-pages.sh <URL>" >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
BUILD_DIR="$ROOT_DIR/.output/public"

echo "==> 1/5 Собираю статику (baseURL /asu-schedule/)"
( cd "$ROOT_DIR" && npm run generate:gh )

echo "==> 2/5 Создаю .nojekyll в сборке"
touch "$BUILD_DIR/.nojekyll"

echo "==> 3/5 Копирую сборку во временную папку"
cp -R "$BUILD_DIR/." "$WORK_DIR/"

echo "==> 4/5 Инициализирую git и коммичу только сборку"
cd "$WORK_DIR"
git init -q
git checkout -q -b gh-pages
git config user.name "deploy"
git config user.email "deploy@localhost"
git add -A
git commit -q -m "Deploy: $(date +%Y-%m-%dT%H:%M:%S)"

echo "==> 5/5 Пушу в ветку gh-pages"
git push -f "$REPO_URL" gh-pages

cd "$ROOT_DIR"
rm -rf "$WORK_DIR"
echo "Готово: принудительно запушена ветка gh-pages."