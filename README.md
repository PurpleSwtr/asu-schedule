# AsuSchedule

Статическое веб-приложение для просмотра расписания занятий, сгенерированное на **Nuxt 3 + Nuxt UI**. Разворачивается на **GitHub Pages**.

- Просмотр расписания по неделям (**числитель / знаменатель**)
- Переключение между двумя группами (1 и 2)
- Поддержка пар «1 раз в месяц» с авторасчётом дат
- Адаптивный интерфейс под мобильные устройства

## Структура проекта

```
asu-schedule/
├── app.vue                     # корневой компонент
├── nuxt.config.ts              # конфигурация Nuxt (SSG, baseURL, Nuxt UI)
├── composables/
│   └── useSchedule.ts          # хук: загрузка данных и логика фильтрации недель
├── components/
│   ├── GroupSelector.vue       # переключатель группы (1 / 2)
│   ├── WeekSelector.vue        # выбор недели
│   ├── DayTabs.vue             # табы дней недели
│   └── LessonCard.vue          # карточка одной пары
├── pages/
│   └── index.vue               # главная страница
├── public/
│   └── schedule.json           # данные расписания (генерирует скрипт)
├── parser/
│   ├── parse.py                # Python-скрипт парсинга PDF (OCR)
│   └── requirements.txt        # зависимости парсера
└── .github/workflows/
    └── deploy.yml              # деплой на GitHub Pages
```

## Как запустить локально

```bash
cd asu-schedule
npm install
npm run dev        # http://localhost:3000
```

Сгенерировать статику для продакшена:

```bash
npm run generate   # результат в .output/public (baseURL = /)
npm run generate:gh  # то же, но с baseURL /asu-schedule/ (как на GitHub Pages)
```

Локально разрабатывать и тестировать:

```bash
npm run dev           # http://localhost:3000
npm run dev -- --host # доступно по Wi-Fi с телефона: http://<IP>:3000
```

## Формат данных (public/schedule.json)

```jsonc
{
  "meta": {
    "university": "МАДИ",
    "semester": "2026-2027 Осенний",
    "weeks": {
      "1": { "number": 1, "type": "numerator",   "dates": "01.09 – 07.09" },
      "2": { "number": 2, "type": "denominator", "dates": "08.09 – 14.09" }
    }
  },
  "groups": {
    "1": {
      "name": "46АСУ1",
      "days": {
        "Понедельник": [
          {
            "number": 1,
            "time": "11:35 – 13:05",
            "subject": "Базы данных",
            "type": "Лекции",
            "room": "710л",
            "teacher": "Исмоилов М.И.",
            "schedule": "числитель",          // числитель | знаменатель | обе | месяц
            "monthly": { "firstDate": "2026-09-08" }  // только для "месяц"
          }
        ]
      }
    },
    "2": { /* вторая группа */ }
  }
}
```

Поле `schedule` пары:
- `числитель` → показывается только в недели числителя
- `знаменатель` → только в недели знаменателя
- `обе` → каждую неделю
- `месяц` → раз в месяц (см. ниже)

### Пары «1 раз в месяц»

В PDF не указано, в какие именно даты проходят занятия «раз в месяц» (их задают
преподаватели отдельно). Поэтому для таких пар нужно вручную указать дату
**первого** занятия в поле `monthly.firstDate` (формат `ГГГГ-ММ-ДД`):

```jsonc
{
  "subject": "Базы данных",
  "schedule": "месяц",
  "monthly": { "firstDate": "2026-09-08" }
}
```

Фронтенд сам рассчитает последующие занятия — каждые 4 недели от первой даты.

## Парсер PDF (parser/parse.py)

PDF-файлы расписания не содержат текстового слоя (это скриншоты страницы),
поэтому для извлечения данных используется **OCR (Tesseract + русский язык)**.

- PDF должны лежать в корне родительского проекта: `1.pdf`, `2.pdf`
- Tesseract OCR должен быть установлен с поддержкой русского языка
  (файл `rus.traineddata`)

```bash
pip install -r parser/requirements.txt
python parser/parse.py          # сгенерирует public/schedule.json
python parser/parse.py --debug  # вывести сырой OCR-текст для отладки
```

> ⚠️ Из-за свойств OCR результат может содержать ошибки распознавания
> (особенно в названиях дисциплин из-за переносов и слипшихся ячеек).
> **Обязательно проверьте и при необходимости отредактируйте
> `public/schedule.json` вручную** после генерации, а также впишите
> `monthly.firstDate` для пар «раз в месяц».

## Деплой на GitHub Pages

Полная пошаговая инструкция — в [DEPLOY.md](DEPLOY.md). Кратко:

В репозитории хранится **только** ветка `gh-pages` с готовой сборкой —
исходники не публикуются. Деплой выполняется локально:

```bash
./utils/deploy-gh-pages.sh https://github.com/ЛОГИН/asu-schedule.git
```

Скрипт собирает сайт (`npm run generate:gh`), создаёт `.nojekyll`, кладёт
**только** `.output/public` во временную папку и принудительно пушит её в ветку
`gh-pages`. После этого в настройках **Settings → Pages → Source: Deploy from a
branch → Branch: `gh-pages` → `/ (root)`**.
Сайт доступен на `https://ЛОГИН.github.io/asu-schedule/`.

> Локально `baseURL` равен `/` (см. `nuxt.config.ts`), поэтому `npm run dev`
> и `npm run generate` работают без настройки.

## Обновление расписания

1. Положите новые PDF-файлы (`1.pdf`, `2.pdf`) в корневую папку проекта.
2. `python parser/parse.py`
3. Проверьте/отредактируйте `public/schedule.json`.
4. Пересоберите и задеплойте:
   `./utils/deploy-gh-pages.sh https://github.com/ЛОГИН/asu-schedule.git`
