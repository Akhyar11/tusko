#!/usr/bin/env python3
"""Generate daftarisi.txt — daftar isi taks.txt (judul task + nomor baris).

Tujuan: navigasi cepat & hemat token. Alur kerja agent:
  1. Baca daftarisi.txt (kecil) untuk menemukan baris task.
  2. Baru baca/grep bagian taks.txt yang presisi (mis. `sed -n 'A,Bp' taks.txt`).

Jalankan ulang setelah taks.txt berubah:  python3 scripts/generate_daftarisi.py
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAKS = ROOT / "taks.txt"
OUT = ROOT / "daftarisi.txt"

SECTION_KEYWORDS = (
    "BUKTI VERIFIKASI",
    "KEPUTUSAN ARSITEKTUR",
    "ATURAN GLOBAL",
    "DI LUAR SCOPE",
    "AGENT ASSIGNMENT",
    "MASTER DATABASE SCHEMA",
    "GAP ANALYSIS",
    "FASE ",
    "CROSS-CUTTING",
    "ACCEPTANCE CRITERIA",
    "MATRIKS DEPENDENSI",
    "URUTAN PENGERJAAN",
    "MILESTONE RILIS",
    "CATATAN REVISI",
    "PATCH 3.1",
    "REVISI 4",
    "MAJOR TAMBAHAN",
)

MAJOR_RE = re.compile(r"^T\d+\.\s")
MINOR_RE = re.compile(r"^\s+(T\d+\.\d+[a-z]?)\s+(\[[A-Z ]+\])")


def main() -> None:
    lines = TAKS.read_text(encoding="utf-8").splitlines()

    rows = []
    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()

        minor = MINOR_RE.match(line)
        if minor:
            rows.append((idx, "MINOR", f"{minor.group(1)} {minor.group(2)} {line[minor.end():].strip()[:70]}"))
            continue

        if MAJOR_RE.match(line):
            rows.append((idx, "MAJOR", stripped[:90]))
            continue

        if any(stripped.startswith(keyword) for keyword in SECTION_KEYWORDS):
            rows.append((idx, "SEKSI", stripped[:90]))

    header = [
        "# DAFTAR ISI taks.txt — dibuat otomatis (jangan edit manual).",
        "# Regenerasi: python3 scripts/generate_daftarisi.py",
        "#",
        "# Alur pemakaian (hemat token):",
        "#   1) Baca baris task di file ini -> dapatkan nomor baris.",
        "#   2) Baca presisi:  sed -n '<baris>,<baris+25>p' taks.txt",
        "#      atau grep minor: grep -n '<T06.5>' taks.txt",
        "#",
        "# FORMAT: <baris>|<jenis>|<judul/ringkas>",
        "",
    ]

    OUT.write_text("\n".join(header + [f"{n}|{kind}|{text}" for n, kind, text in rows]) + "\n", encoding="utf-8")
    print(f"daftarisi.txt ditulis: {len(rows)} entri")


if __name__ == "__main__":
    main()