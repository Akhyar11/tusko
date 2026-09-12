#!/bin/bash

echo "🤖 [Audit 1/9: Branch & Master Protection (OpenCode AI)] Memeriksa branch aktif..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

# Hard check: Proteksi mutlak branch master dan main
if [ "$CURRENT_BRANCH" = "master" ] || [ "$CURRENT_BRANCH" = "main" ]; then
    if [ "$ALLOW_MASTER_COMMIT" != "1" ]; then
        echo ""
        echo "❌ [Audit Branch Protection] DILARANG COMMIT LANGSUNG DI BRANCH '$CURRENT_BRANCH'!"
        echo "💡 Sesuai SOP kolaborasi tim di PANDUAN_PEMBAGIAN_TUGAS_TIM.md:"
        echo "   1. Buat branch fitur baru: git checkout -b feat/nama-fitur-anda"
        echo "   2. Lakukan commit pada branch fitur tersebut."
        echo "   (Bypass sementara jika darurat: ALLOW_MASTER_COMMIT=1 git commit -m '...')"
        echo ""
        exit 1
    fi
fi

# Cek Cerdas dengan OpenCode AI: Validasi konvensi penamaan branch
PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Git Workflow Auditor untuk proyek Tusko Performance Storefront.
Tugasmu adalah memvalidasi nama branch Git berikut:
Branch aktif:
EOF

echo "$CURRENT_BRANCH" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

Aturan Branching:
1. Branch WAJIB memiliki prefix kategori yang jelas: feat/, fix/, refactor/, chore/, test/, docs/, atau style/.
2. Dilarang menggunakan nama branch acak tanpa konteks (misal: "test", "temp", "asdf", "coba").
3. Nama branch mendeskripsikan fitur atau perbaikan yang sedang dikerjakan.

Format Jawaban:
Jawab HANYA kata "PASSED" jika valid.
Jika melanggar aturan penamaan branch, jawab:
REJECTED
- Nama Branch Saat Ini: [Nama branch aktif yang diperiksa]
- Alasan Penolakan: [Alasan mengapa nama branch melanggar konvensi]
- Rekomendasi Nama: [Contoh nama branch yang benar, misal: feat/nama-fitur atau fix/nama-bug]
- Solusi: Ubah nama branch dengan perintah: git branch -m feat/nama-fitur-baru
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 25s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo ""
    echo "❌ [Audit Branch Protection] NAMA BRANCH DITOLAK OLEH OPENCODE AI:"
    echo "$AUDITOR_RESULT" | sed -n -E '/(REJECTED|DITOLAK)/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Branch Protection] PASSED (Branch: $CURRENT_BRANCH terverifikasi oleh OpenCode AI)."
exit 0
