#!/usr/bin/env python3
"""
Единый пайплайн обновления расписания для AsuSchedule.

Запускается вручную или из GitHub Actions (cron, раз в неделю).
Не модифицирует существующие скрипты в utils/ — только импортирует их функции.

Формат итоговых JSON в public/ НЕ меняется:
    { "status": "success", "group": <имя>, "data": [...], "monthlySchedule"? : {...} }

Этапы:
  0. get_all_groups()            — актуальный список групп с сайта МАДИ (parser_groups)
  1. читаем public/groups-manifest.json — какие группы реально парсим
  2. get_schedule_as_json(...)   — парсинг расписания каждой группы (parser_sched)
  3. слияние с utils/monthly/<file>.json (ручные monthlySchedule)
  4. расширение ФИО преподавателей (full_names.txt: полные ФИО построчно,
     сопоставление по фамилии + инициалам)
  5. унификация имён файлов в транслит (translit)
  6. регенерация public/groups-manifest.json (как в nuxt.config.ts)
  7. (опционально) git commit public/*.json  — только с флагом --commit

Использование:
  python utils/build_schedule.py            # обновить данные, ничего не коммитить
  python utils/build_schedule.py --commit   # обновить данные и закоммитить
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
UTILS_DIR = ROOT_DIR / "utils"
PUBLIC_DIR = ROOT_DIR / "public"
MONTHLY_DIR = UTILS_DIR / "monthly"
RESOLVER_DIR = UTILS_DIR / "full_name_resolver"
MANIFEST_FILE = PUBLIC_DIR / "groups-manifest.json"

sys.path.insert(0, str(UTILS_DIR))

from parser_groups import get_all_groups  # noqa: E402
from parser_sched import get_schedule_as_json  # noqa: E402
from translit import translit  # noqa: E402

FULL_NAMES_FILE = RESOLVER_DIR / "full_names.txt"

# --- Логика ключей monthly (реплика makeMonthlyKey из composables/useSchedule.ts) ---

DAY_ABBR = {
    "Понедельник": "Пн",
    "Вторник": "Вт",
    "Среда": "Ср",
    "Четверг": "Чт",
    "Пятница": "Пт",
    "Суббота": "Сб",
}

SUBJECT_SHORTENINGS: list[tuple[str, str]] = [
    ("Научно-исследовательская работа", "НИР"),
    (
        "Проектирование и эксплуатация интегрированных автоматизированных систем управления",
        "ПроектированиеИАСУ",
    ),
    ("Технологии разработки приложений для мобильных устройств", "МобПрил"),
    ("Системы искусственного интеллекта", "СИИ"),
    ("Облачные вычисления, облачные программные приложения и сервисы", "Облачные"),
    ("Управление ресурсами предприятия", "УРП"),
    ("Системы реального времени", "СРВ"),
    ("Базы данных", "БД"),
]


def make_monthly_key(day: str, time: str, subject: str) -> str:
    d = DAY_ABBR.get(day.strip(), day.strip()[:2])
    t = re.sub(r"\s+", "", time.strip()).split("-")[0]
    s = subject.strip()
    for share, short in SUBJECT_SHORTENINGS:
        s = s.replace(share, short)
    return f"{d}_{t}_{s}"


def is_monthly(periodicity: str) -> bool:
    return "месяц" in (periodicity or "").lower()


def normalize_teacher(name: str) -> str:
    return re.sub(r"\s+", " ", (name or "").strip())


def surname_and_initials(name: str) -> tuple[str, str]:
    parts = normalize_teacher(name).split()
    if not parts:
        return "", ""
    surname = parts[0]
    initials = "".join(tok[0] for tok in parts[1:]).upper()
    return surname, initials


def load_full_names() -> list[str]:
    """Читает полные ФИО из full_names.txt (по одному на строку)."""
    if not FULL_NAMES_FILE.exists():
        print(f"  [WARN] Нет файла {FULL_NAMES_FILE.name} — расшифровка ФИО отключена")
        return []
    names = [
        normalize_teacher(line)
        for line in FULL_NAMES_FILE.read_text(encoding="utf-8").splitlines()
        if normalize_teacher(line)
    ]
    return names


def expand_teacher_name(teacher: str, full_names: list[str]) -> tuple[str, bool]:
    """Возвращает (полное_имя, было_ли_расшифровано).

    Сравнение по фамилии (первое слово) и инициалам: первые буквы имени/отчества
    в полном ФИО должны совпасть с сокращением из расписания.
    """
    norm = normalize_teacher(teacher)
    if not norm:
        return teacher, False

    surname, initials = surname_and_initials(norm)

    for full in full_names:
        f_surname, f_initials = surname_and_initials(full)
        if f_surname and f_initials and f_surname == surname and (
            f_initials == initials or f_initials.startswith(initials)
        ):
            return full, True

    return norm, False


# --- Шаг 0 / 1: список групп с сайта и из манифеста ---

def fetch_group_id_map() -> dict[str, str]:
    print("=" * 70)
    print("[Этап 0] Получаю список групп с raspisanie.madi.ru...")
    result = get_all_groups()
    if result.get("status") != "success":
        print(f"  [ОШИБКА] Не удалось получить список групп: {result.get('message')}")
        return {}
    id_map = {g["name"]: g["id"] for g in result["groups"]}
    print(f"  [OK] Получено групп с сайта: {len(id_map)}")
    return id_map


def load_manifest_groups() -> list[dict[str, str]]:
    print("[Этап 1] Читаю public/groups-manifest.json...")
    if MANIFEST_FILE.exists():
        try:
            manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
            groups = manifest.get("groups", [])
            if groups:
                print(f"  [OK] Групп из манифеста: {len(groups)}")
                return groups
        except Exception as e:
            print(f"  [WARN] Не удалось прочитать манифест: {e}")

    # Fallback: сканируем public/*.json (логика как в nuxt.config.ts)
    print("  [WARN] Манифест пуст/недоступен — сканирую public/*.json")
    groups = []
    for file in PUBLIC_DIR.glob("*.json"):
        if file.name == "groups-manifest.json":
            continue
        try:
            raw = json.loads(file.read_text(encoding="utf-8"))
            name = (raw.get("group") or file.stem).strip()
            groups.append({"id": name, "file": file.name})
        except Exception as e:
            print(f"  [WARN] Пропускаю {file.name}: {e}")
    print(f"  [OK] Групп найдено в public/: {len(groups)}")
    return groups


# --- Шаг 2: парсинг расписания ---

def parse_group(gp_name: str, gp_id: str) -> dict:
    print(f"  -> Парсю {gp_name} (gp_id={gp_id})...")
    result = get_schedule_as_json(gp_name, gp_id)
    if result.get("status") != "success":
        print(f"     [WARN] Группа {gp_name}: {result.get('message')}")
        return {}
    print(f"     [OK] Пары: {len(result.get('data', []))}")
    return result


# --- Шаг 3: слияние с monthlySchedule ---

def load_monthly(gp_id_name: str) -> dict:
    monthly_file = MONTHLY_DIR / f"{translit(gp_id_name)}.json"
    if not monthly_file.exists():
        print(f"  [INFO] Нет ручного monthlySchedule для {gp_id_name} "
              f"(нет utils/monthly/{translit(gp_id_name)}.json)")
        return {}
    try:
        monthly = json.loads(monthly_file.read_text(encoding="utf-8"))
        print(f"  [OK] Загружен monthlySchedule: {len(monthly)} записей")
        return monthly if isinstance(monthly, dict) else {}
    except Exception as e:
        print(f"  [WARN] Не удалось прочитать {monthly_file.name}: {e}")
        return {}


def check_monthly_consistency(data: list[dict], monthly: dict, group_name: str) -> None:
    """Диагностика: устаревшие ключи и пары без monthly-конфига."""
    monthly_lessons = {
        make_monthly_key(l.get("day", ""), l.get("time", ""), l.get("subject", ""))
        for l in data
        if is_monthly(l.get("periodicity", ""))
    }

    stale = [k for k in monthly if k not in monthly_lessons]
    if stale:
        print(f"  [WARN] {group_name}: ключи monthly без пары в свежих данных:")
        for k in stale:
            print(f"         - {k}")

    missing = sorted(monthly_lessons - set(monthly))
    if missing:
        print(f"  [WARN] {group_name}: пары «раз в месяц» без monthly-конфига:")
        for k in missing:
            print(f"         - {k}")


# --- Шаг 4: расширение ФИО ---

def expand_names_in_data(data: list[dict], full_names: list[str]) -> int:
    replaced = 0
    unresolved: set[str] = set()
    for lesson in data:
        teacher = lesson.get("teacher")
        if not teacher or teacher == "-":
            continue
        expanded, did = expand_teacher_name(teacher, full_names)
        lesson["teacher"] = expanded
        if did:
            replaced += 1
        elif normalize_teacher(teacher) not in full_names:
            unresolved.add(normalize_teacher(teacher))
    if unresolved:
        print("  [WARN] Не удалось расшифровать ФИО (добавь в full_names.txt):")
        for name in sorted(unresolved):
            print(f"         - {name}")
    return replaced


# --- Шаги 5-6: имена файлов и манифест ---

def translit_filename(gp_name: str) -> str:
    return f"{translit(gp_name)}.json"


def rename_legacy_file(group_id: str, old_file: str) -> str:
    """Возвращает целевое имя файла и переименовывает legacy-файл, если нужно."""
    target = translit_filename(group_id)
    old_path = PUBLIC_DIR / old_file
    target_path = PUBLIC_DIR / target
    if old_path.exists() and old_file != target:
        if target_path.exists():
            target_path.unlink()
        old_path.rename(target_path)
        print(f"  [OK] Файл переименован: {old_file} -> {target}")
    return target


def regenerate_manifest(written: list[tuple[str, str]]) -> None:
    print("[Этап 6] Регенерирую public/groups-manifest.json...")
    files = sorted({file for _, file in written})
    groups = []
    for file in files:
        try:
            raw = json.loads((PUBLIC_DIR / file).read_text(encoding="utf-8"))
            name = (raw.get("group") or Path(file).stem).strip()
            groups.append({"id": name, "file": file})
        except Exception as e:
            print(f"  [WARN] Пропускаю {file} при сборке манифеста: {e}")
    manifest = {"groups": sorted(groups, key=lambda g: g["id"])}
    MANIFEST_FILE.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"  [OK] Манифест обновлён: {len(groups)} групп")


# --- Шаг 7: commit ---

def git_commit() -> None:
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        status = subprocess.run(
            ["git", "status", "--porcelain", "--", "public/"],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
        ).stdout.strip()
        if not status:
            print("[Этап 7] Изменений в public/ нет — commit пропущен.")
            return
        subprocess.run(
            ["git", "add", "public/*.json"],
            cwd=ROOT_DIR,
            check=True,
            capture_output=True,
        )
        subprocess.run(
            ["git", "commit", "-m", f"chore: update schedules {stamp}"],
            cwd=ROOT_DIR,
            check=True,
            capture_output=True,
        )
        print(f"[Этап 7] Закоммичено: 'chore: update schedules {stamp}'")
    except subprocess.CalledProcessError as e:
        print(f"  [WARN] Не удалось закоммитить: {e.stderr.strip() or e}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Пайплайн обновления расписания")
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Закоммитить изменения public/*.json (без push). По умолчанию выключено.",
    )
    args = parser.parse_args()

    # Этап 0: группы с сайта
    id_map = fetch_group_id_map()
    if not id_map:
        print("[ОШИБКА] Останавливаюсь: нет списка групп с сайта.")
        sys.exit(1)

    # Этап 1: группы из манифеста
    manifest_groups = load_manifest_groups()
    if not manifest_groups:
        print("[ОШИБКА] Останавливаюсь: в манифесте нет групп.")
        sys.exit(1)

    # Этап 4 подготовка: полные ФИО
    print("[Этап 4 | подготовка] Загружаю full_names.txt...")
    full_names = load_full_names()
    print(f"  [OK] Полных ФИО в базе: {len(full_names)}")

    written: list[tuple[str, str]] = []

    for entry in manifest_groups:
        group_id = entry["id"]
        gp_id = id_map.get(group_id)
        if not gp_id:
            print(f"[WARN] {group_id}: не найден gp_id на сайте — пропускаю "
                  f"(возможно, группа переименована или недоступна)")
            continue

        # Этап 2: парсинг
        parsed = parse_group(group_id, gp_id)
        if not parsed:
            continue
        data = parsed.get("data", [])

        # Этап 3: слияние с monthlySchedule
        print(f"[Этап 3] Сливаю monthlySchedule для {group_id}...")
        monthly = load_monthly(group_id)
        check_monthly_consistency(data, monthly, group_id)

        # Этап 4: расширение ФИО
        print(f"[Этап 4] Расширяю ФИО для {group_id}...")
        replaced = expand_names_in_data(data, full_names)
        print(f"  [OK] Заменено ФИО: {replaced}")

        # Этап 5: имя файла в транслит
        print(f"[Этап 5] Имя файла для {group_id}...")
        target_file = rename_legacy_file(group_id, entry.get("file", ""))

        final = {
            "status": "success",
            "group": group_id,
            "data": data,
        }
        if monthly:
            final["monthlySchedule"] = monthly

        out_path = PUBLIC_DIR / target_file
        out_path.write_text(
            json.dumps(final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        written.append((group_id, target_file))
        print(f"  [OK] Записан {target_file} ({len(final['data'])} пар)")

    # Этап 6: манифест
    if written:
        regenerate_manifest(written)
    else:
        print("[WARN] Ни одна группа не обработана — манифест не трогаю.")

    # Этап 7: commit (только с флагом --commit)
    if args.commit:
        git_commit()
    else:
        print("[Этап 7] Пропущен (нет флага --commit). "
              "Изменения лежат в рабочем дереве.")

    print("=" * 70)
    print("Готово.")


if __name__ == "__main__":
    main()