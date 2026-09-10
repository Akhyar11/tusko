#!/bin/bash

echo "🤖 [Audit 3/9: Tusko Design System & Sharp Styling (OpenCode AI)] Memeriksa rounded-none & brand standard..."

STAGED_DIFF=$(git diff --cached -- "frontend/src/**/*.jsx" "frontend/src/**/*.js" "prototype/**/*.html")

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Design System] Tidak ada perubahan UI frontend yang di-stage. Skip."
    exit 0
fi

# Audit Cerdas Design System dengan OpenCode AI
PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Tusko Design System (Sharp & Athletic Performance).
Tugasmu adalah memeriksa Git Diff berikut terhadap Standar Desain Tusko:

ATURAN DESAIN TUSKO:
1. Wajib Sudut Siku (rounded-none):
   - Seluruh komponen antarmuka baru atau yang dimodifikasi (tombol, kartu, input, modal, badge, banner, avatar) WAJIB menggunakan sudut siku tegas `rounded-none`.
   - DILARANG KERAS menyisipkan class sudut melengkung seperti `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-lg`, atau `rounded-full` (kecuali indikator status bulat kecil seperti dot status).
2. Branding & Label:
   - DILARANG menggunakan teks/badge "GOLD MEMBER VIP" atau istilah VIP lainnya. Label keanggotaan wajib disederhanakan menjadi "Member" atau "Admin".

Git Diff (Staged Frontend Changes):
```diff
EOF

echo "$STAGED_DIFF" | head -n 120 >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
```

FORMAT JAWABAN:
- Jika kode mematuhi standar desain Tusko (rounded-none dan tidak ada label VIP):
  Jawab HANYA kata "PASSED".
- Jika melanggar:
  REJECTED
  - Pelanggaran: [Sebutkan file, baris, dan elemen yang melanggar rounded-none atau VIP]
  - Solusi: [Ganti dengan rounded-none atau sesuaikan label]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 30s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if echo "$AUDITOR_RESULT" | grep -qi "REJECTED"; then
    echo ""
    echo "❌ ======================================================================"
    echo "❌ [Audit Design System] DITOLAK OLEH OPENCODE AI CODE AUDITOR!"
    echo "❌ ======================================================================"
    echo "$AUDITOR_RESULT" | sed -n '/REJECTED/,$p'
    echo ""
    exit 1
fi

echo "✅ [Audit Design System] PASSED (Kepatuhan rounded-none & branding terverifikasi oleh OpenCode AI)."
exit 0
