#!/usr/bin/env python3
"""Build a small municipality lookup from the Japan Post UTF-8 postal archive.

Download the official archive, then run:
python3 scripts/update-japanese-postal.py --archive /path/utf_ken_all.zip --version YYYY-MM-DD
The generator reads no client data and does not alter the registration layout.
"""
import argparse, csv, hashlib, io, json, re, zipfile
from collections import defaultdict
from pathlib import Path

SOURCE = "https://www.post.japanpost.jp/service/search/zipcode/download/utf/zip/utf_ken_all.zip"
README = "https://www.post.japanpost.jp/service/search/zipcode/download/utf-readme.html"

def generate(archive, version, destination):
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", version):
        raise ValueError("Use the official source release date, YYYY-MM-DD")
    archive_bytes = archive.read_bytes()
    with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zipped:
        names = [n for n in zipped.namelist() if n.lower().endswith('.csv')]
        if len(names) != 1:
            raise ValueError("Expected one UTF-8 CSV; no archive paths are extracted")
        raw = zipped.read(names[0]).decode('utf-8-sig')
    locations = defaultdict(set)
    rows = 0
    for row in csv.reader(io.StringIO(raw)):
        if len(row) < 9 or not re.fullmatch(r"\d{7}", row[2]):
            raise ValueError("Unexpected postal record")
        prefecture, city = row[0][:2], row[7].strip()
        if not re.fullmatch(r"\d{5}", row[0]) or not 1 <= int(prefecture) <= 47 or not city:
            raise ValueError("Unexpected prefecture/municipality")
        locations[row[2]].add((prefecture, city))
        rows += 1
    if rows < 100000:
        raise ValueError("Expected the complete national archive")
    cities = sorted({city for found in locations.values() for city in found})
    indexes = {city: i for i, city in enumerate(cities)}
    shards = defaultdict(dict)
    ambiguous = 0
    for postal, found in sorted(locations.items()):
        ids = sorted(indexes[city] for city in found)
        shards[postal[:2]][postal[2:]] = ids[0] if len(ids) == 1 else ids
        ambiguous += len(ids) > 1
    destination.mkdir(parents=True, exist_ok=True)
    existing = {p.name for p in destination.glob('*.json')}
    expected = {'catalog.json', 'manifest.json'} | {prefix+'.json' for prefix in shards}
    if existing - expected:
        raise ValueError("Choose a fresh version directory; stale shards would remain")
    def write(name, value):
        (destination/name).write_text(json.dumps(value, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
    write('catalog.json', {'version': version, 'municipalities': cities, 'prefixes': sorted(shards)})
    for prefix, data in shards.items():
        write(prefix+'.json', data)
    manifest = {'source': SOURCE, 'explanation': README, 'sourceUpdatedAt': version,
        'sourceSha256': hashlib.sha256(archive_bytes).hexdigest(),
        'sourceRows': rows, 'postalCodes': len(locations), 'municipalities': len(cities),
        'ambiguousPostalCodes': ambiguous, 'shards': len(shards),
        'purpose': 'Prefecture and municipality only. No street, dwelling number or client data.',
        'redistribution': 'Japan Post permits redistribution of postal data; see explanation URL.'}
    write('manifest.json', manifest)
    return manifest

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--version', required=True)
    parser.add_argument('--destination', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    dest = args.destination or root/'public/data/postal/jp'/args.version
    print(json.dumps(generate(args.archive, args.version, dest), ensure_ascii=False, indent=2))
