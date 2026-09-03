import json
import re
from pathlib import Path

def load_names_mapping(half_file, full_file):
    mapping = {}
    with open(half_file, 'r', encoding='utf-8') as hf, open(full_file, 'r', encoding='utf-8') as ff:
        for half_line, full_line in zip(hf, ff):
            half_name = re.sub(r'^\d+\.\s*', '', half_line.strip())
            full_name = re.sub(r'^\d+\.\s*', '', full_line.strip())
            if half_name and full_name:
                mapping[half_name] = full_name
    return mapping

def replace_names_in_json(json_file, mapping):
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    count = 0
    for entry in data.get('data', []):
        if 'teacher' in entry and entry['teacher'] in mapping:
            entry['teacher'] = mapping[entry['teacher']]
            count += 1
    
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return count

if __name__ == '__main__':
    script_dir = Path(__file__).parent
    mapping = load_names_mapping(script_dir / 'half.txt', script_dir / 'full.txt')
    
    for json_file in script_dir.glob('*.json'):
        count = replace_names_in_json(json_file, mapping)
        print(f'{json_file.name}: заменено {count} имен')
