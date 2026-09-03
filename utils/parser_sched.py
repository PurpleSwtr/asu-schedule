import json
import sys

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def get_schedule_as_json(group_name: str, group_id: str) -> dict:
    url = "https://raspisanie.madi.ru/tplan/tasks/tableFiller.php"

    payload = {"tab": "7", "gp_name": group_name, "gp_id": group_id}

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Accept": "text/html, */*; q=0.01",
        "Referer": "https://raspisanie.madi.ru/tplan/r/?task=7",
    }

    try:
        response = requests.post(
            url, data=payload, headers=headers, timeout=10, verify=False
        )

        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="timetable")

        if not table:
            return {
                "status": "error",
                "message": "Таблица с расписанием не найдена в ответе сервера.",
            }

        schedule = []
        current_day = "Не указано"

        for row in table.find_all("tr"):
            day_header = row.find("th", colspan="6")
            if day_header:
                current_day = day_header.text.strip()
                continue

            cols = row.find_all("td")
            if not cols:
                continue

            if cols[0].find("b"):
                if "Полнодневные" in cols[0].text:
                    continue
                continue

            if len(cols) == 3 and "colspan" in cols[0].attrs:
                schedule.append(
                    {
                        "day": cols[0].text.strip(),
                        "time": "Полный день",
                        "subject": cols[1].text.strip(),
                        "type": "Полнодневное занятие",
                        "periodicity": cols[2].text.strip(),
                        "room": "-",
                        "teacher": "-",
                    }
                )
                continue

            if len(cols) >= 6:
                lesson = {
                    "day": current_day,
                    "time": cols[0].text.strip(),
                    "subject": cols[1].text.strip(),
                    "type": cols[2].text.strip(),
                    "periodicity": cols[3].text.strip(),
                    "room": cols[4].text.strip(),
                    "teacher": cols[5].text.strip().replace("\n", " ").strip(),
                }
                schedule.append(lesson)

        return {"status": "success", "group": group_name, "data": schedule}

    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Ошибка сети или HTTP: {e}"}
    except Exception as e:
        return {
            "status": "error",
            "message": f"Непредвиденная ошибка при парсинге: {e}",
        }


if __name__ == "__main__":
    TARGET_GROUP_NAME = "4бИТС3"
    TARGET_GROUP_ID = "90673"

    print(
        f"[*] Этап 1: Запрос расписания для группы {TARGET_GROUP_NAME} (ID: {TARGET_GROUP_ID})..."
    )

    result = get_schedule_as_json(TARGET_GROUP_NAME, TARGET_GROUP_ID)

    if result.get("status") == "success":
        clean_name = "".join(c for c in TARGET_GROUP_NAME if c not in r'\/:*?"<>|')

        with open(f"{clean_name}.json", "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)
    else:
        print(f"[-] Этап 2: Завершился с ошибкой -> {result.get('message')}")
        sys.exit(1)
