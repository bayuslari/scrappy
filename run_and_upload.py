#!/usr/bin/env python3
"""
DAMA Adelaide Job Scraper — Run & Upload
=========================================
Runs the scraper, then drops a trigger file so Cowork
can auto-upload the results to Google Drive.

Usage:
    python run_and_upload.py

What it does:
    1. Runs dama_adelaide_job_scraper.py
    2. Writes upload_ready.json with the output file paths
    3. Cowork picks up upload_ready.json and uploads to Drive

Tip: Run this, then come back to Cowork chat and say
     "upload the latest results" — Claude will detect the
     trigger file and handle the rest automatically.
"""

import subprocess
import sys
import json
import glob
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).parent
TRIGGER_FILE = HERE / "upload_ready.json"


def run_scraper():
    print("\n🚀  Running DAMA Adelaide Job Scraper...\n")
    result = subprocess.run(
        [sys.executable, str(HERE / "dama_adelaide_job_scraper.py")],
        cwd=str(HERE),
    )
    return result.returncode == 0


def write_trigger():
    today = datetime.now().strftime("%Y%m%d")
    csv_path  = HERE / f"dama_jobs_{today}.csv"
    xlsx_path = HERE / f"dama_jobs_{today}.xlsx"

    existing = {
        "csv":  str(csv_path)  if csv_path.exists()  else None,
        "xlsx": str(xlsx_path) if xlsx_path.exists() else None,
        "date": today,
        "ready_at": datetime.now().isoformat(),
    }

    with open(TRIGGER_FILE, "w") as f:
        json.dump(existing, f, indent=2)

    print(f"\n✅  Trigger file written: {TRIGGER_FILE}")
    print("    → Come back to Cowork and say: 'upload the latest results'")
    print("    → Claude will detect upload_ready.json and upload to Drive automatically.\n")
    return existing


def main():
    success = run_scraper()

    if not success:
        print("\n❌  Scraper exited with error. Check output above.")
        sys.exit(1)

    info = write_trigger()

    print("📁  Files ready for upload:")
    if info["csv"]:
        print(f"    CSV  → {info['csv']}")
    if info["xlsx"]:
        print(f"    XLSX → {info['xlsx']}")


if __name__ == "__main__":
    main()
