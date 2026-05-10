"""
Pelican ビルド後に output/events.json を生成するスクリプト。
usage: uv run python build.py
"""
import json
import os
import re
from datetime import date, datetime

CONTENT_DIR = "content/events"
OUTPUT_PATH = "output/events.json"


def parse_frontmatter(filepath):
    meta = {}
    with open(filepath, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip()
            if not line:
                break
            m = re.match(r"^(\w+):\s*(.+)$", line)
            if m:
                meta[m.group(1).lower()] = m.group(2).strip()
    return meta


def main():
    events = []
    for fname in os.listdir(CONTENT_DIR):
        if not fname.endswith(".md"):
            continue
        meta = parse_frontmatter(os.path.join(CONTENT_DIR, fname))
        if not meta.get("date"):
            continue
        events.append({
            "title":     meta.get("title", ""),
            "date":      meta.get("date", ""),
            "slug":      meta.get("slug", fname[:-3]),
            "thumbnail": meta.get("thumbnail", ""),
            "connpass":  meta.get("connpass", ""),
            "summary":   meta.get("summary", ""),
        })

    events.sort(key=lambda e: e["date"])

    today = date.today().isoformat()
    upcoming = [e for e in events if e["date"] >= today]
    past     = [e for e in events if e["date"] <  today]

    payload = {
        "next_event": upcoming[0] if upcoming else None,
        "past_events": list(reversed(past)),
    }

    os.makedirs("output", exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"Generated {OUTPUT_PATH}")
    if payload["next_event"]:
        print(f"  next: {payload['next_event']['title']} ({payload['next_event']['date']})")
    else:
        print("  next: (none)")


if __name__ == "__main__":
    main()
