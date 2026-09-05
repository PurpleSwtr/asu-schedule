import requests
from bs4 import BeautifulSoup

URL = "https://madi.ru/6073-informaciya-o-sostave-pps.html"
OUT = "full_names.txt"

html = requests.get(URL).text

soup = BeautifulSoup(html, "html.parser")
names = [td.get_text(strip=True) for td in soup.select('td[itemprop="fio"]')]

surnames = set()
for name in names:
    name = name.strip()
    if not name or name == "Скоро появится":
        continue
    surname = name.split()[0]
    surnames.add(surname)

result = sorted(surnames)

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(result) + "\n")
