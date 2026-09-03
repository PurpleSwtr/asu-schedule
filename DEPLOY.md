# Деплой AsuSchedule на GitHub Pages (без CI)

## Схема

В репозитории хранится **только** ветка `gh-pages` с содержимым готовой сборки.
Никаких исходников, никакого GitHub Actions — весь процесс выполняется локально.

| Что | Где |
|---|---|
| исходники проекта | только на твоём компьютере (не публикуются) |
| ветка `gh-pages` | только готовая статика `.output/public` (+ `.nojekyll`) |
| сборка | делается локально через `npm run generate:gh` |

---

## Пошаговая инструкция

### 1. Собрать и запушить одним скриптом

Скрипт `deploy-gh-pages.sh` собирает сайт, кладёт **только** `.output/public`
во временную git-папку и принудительно пушит её в ветку `gh-pages`:

```bash
./utils/deploy-gh-pages.sh https://github.com/ЛОГИН/asu-schedule.git
```

Либо задай URL заранее:

```bash
export REPO_URL=https://github.com/ЛОГИН/asu-schedule.git
./utils/deploy-gh-pages.sh
```

> Скрипт пушит с `--force` (`-f`) и всегда перезаписывает `gh-pages` свежей
> сборкой — это нормально, т.к. в этой ветке живёт только сборка.

Если не хочется использовать скрипт — те же шаги вручную:

```bash
# 1. собрать
npm run generate:gh
# 2. положить .nojekyll
touch .output/public/.nojekyll
# 3. скопировать сборку в отдельную папку-деплой
mkdir -p /tmp/gh-pages-deploy
cp -R .output/public/. /tmp/gh-pages-deploy/
# 4. в этой папке: init git, коммит, push
cd /tmp/gh-pages-deploy
git init
git checkout -b gh-pages
git add -A
git commit -m "Deploy"
git push -f https://github.com/ЛОГИН/asu-schedule.git gh-pages
```

### 2. Настроить источник Pages на gh-pages

В настройках репозитория (один раз):

1. **Settings → Pages**.
2. **Build and deployment → Source: Deploy from a branch**.
3. **Branch: `gh-pages` → `/ (root)`**.
4. **Save**.

### 3. Проверить сайт

```
https://ЛОГИН.github.io/asu-schedule/
```

---

## Обновление сайта

При каждой новой сборке достаточно повторить шаг 1:

```bash
./utils/deploy-gh-pages.sh https://github.com/ЛОГИН/asu-schedule.git
```

Ветка `gh-pages` обновится, Pages покажет новую версию.

---

## Устранение неполадок

| Симптом | Причина / решение |
|---|---|
| Сайт 404 | Ветка `gh-pages` ещё не существует (скрипт ещё не вызывался) или в Settings → Pages источник не `gh-pages`. |
| Пустая страница / не грузятся стили и JS | Открывай сайт именно по пути `/asu-schedule/`, а не как файл. Сборка сделана с baseURL `/asu-schedule/` (скрипт использует `generate:gh`). |
| Ошибка протокола/подключения при push | Скрипт делает `git push` по HTTPS — нужна авторизация (токен/token, git credential manager). Убедись, что ты можешь пушить в этот репозиторий. |
| В репе завелись исходники / не та ветка | Проверь, что push идёт в ветку `gh-pages`, а не в `main`. Скрипт всегда работает в отдельной временной папке с веткой `gh-pages` — исходники в неё не попадают. |

---

## Локальная проверка (до деплоя)

```bash
npm run dev            # быстрый просмотр: http://localhost:3000
npm run dev -- --host  # доступно с телефона по Wi-Fi: http://<IP>:3000
```

Для превью именно собранной статики **без префикса** используй `npm run generate`
(не `generate:gh`):

```bash
npm run generate
npx serve .output/public
```
