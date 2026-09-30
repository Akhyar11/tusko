#!/usr/bin/env bash
# Kompilasi dokumentasi TUSKO -> PDF
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"
JOB="Tusko-Panduan-Pengguna"
for i in 1 2 3; do
  pdflatex -interaction=nonstopmode -halt-on-error -jobname="$JOB" main.tex > build.log 2>&1 || {
    echo "=== BUILD GAGAL (iterasi $i) ===" >&2
    tail -n 50 build.log >&2
    exit 1
  }
done
rm -f "$JOB.aux" "$JOB.log" "$JOB.out" "$JOB.toc" build.log 2>/dev/null || true
echo "OK -> $DIR/$JOB.pdf"
