import json

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def get_all_groups() -> dict:
    """
    Получает список всех групп, используя эндпоинт fastview.
    """
    url = "https://raspisanie.madi.ru/tplan/tasks/task3,7_fastview.php"

    payload = {"step_no": "1", "task_id": "7", "kaf_presel": ""}

    headers = {
        "Accept": "text/html, */*; q=0.01",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://raspisanie.madi.ru",
        "Referer": "https://raspisanie.madi.ru/tplan/r/?task=7",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
    }

    try:
        print("[*] Этап 1: Отправка POST-запроса на task3,7_fastview.php...")
        response = requests.post(
            url, data=payload, headers=headers, timeout=10, verify=False
        )
        response.raise_for_status()

        print("[*] Этап 2: Парсинг HTML-ответа...")
        soup = BeautifulSoup(response.text, "html.parser")

        list_items = soup.find_all("li", attrs={"value": True})

        groups = []
        for li in list_items:
            group_id = li.get("value")
            group_name = li.get_text(strip=True)

            if group_id and group_id.isdigit() and any(c.isalpha() for c in group_name):
                groups.append({"id": group_id, "name": group_name})

        if not groups:
            return {
                "status": "error",
                "message": "Список групп не найден в ответе сервера.",
            }

        print(f"[+] Этап 3: Успешно извлечено {len(groups)} групп")
        return {"status": "success", "count": len(groups), "groups": groups}

    except requests.exceptions.RequestException as e:
        return {"status": "error", "message": f"Ошибка сети или HTTP: {e}"}
    except Exception as e:
        return {"status": "error", "message": f"Непредвиденная ошибка: {e}"}


if __name__ == "__main__":
    result = get_all_groups()

    if result.get("status") == "success":
        output_file = "madi_groups.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=4)

        print(f"[+] Этап 4: Данные успешно сохранены в файл '{output_file}'")
        print("\nПример первых 5 групп:")
        for group in result["groups"][:5]:
            print(f"  ID: {group['id']:<6} | Название: {group['name']}")

        print("\nПример последних 5 групп:")
        for group in result["groups"][-5:]:
            print(f"  ID: {group['id']:<6} | Название: {group['name']}")
    else:
        print(f"[-] Ошибка: {result.get('message')}")
