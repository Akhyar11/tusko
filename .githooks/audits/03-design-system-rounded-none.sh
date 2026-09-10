#!/bin/bash

echo "🤖 [Audit 3/9: Tusko Design System & Sharp Styling] Memeriksa kepatuhan rounded-none & brand standard..."

STAGED_DIFF=$(git diff --cached -- "frontend/src/**/*.jsx" "frontend/src/**/*.js" "prototype/**/*.html")

if [ -z "$STAGED_DIFF" ]; then
    echo "ℹ️ [Audit Design System] Tidak ada perubahan UI frontend yang di-stage. Skip."
    exit 0
fi

# Cek 1: Dilarang penambahan kelas rounded melengkung (rounded-xl, rounded-2xl, rounded-3xl, rounded-lg)
if echo "$STAGED_DIFF" | grep -E "^\+[^\+]*\b(rounded-xl|rounded-2xl|rounded-3xl|rounded-lg)\b" > /dev/null; then
    echo ""
    echo "❌ [Audit Design System] DITEMUKAN PENGGUNAAN KELAS SUDUT MELENGKUNG (ROUNDED)!"
    echo "💡 Identitas desain Tusko Storefront adalah 'Sharp / Athletic Performance' (rounded-none)."
    echo "   Dilarang menambahkan kelas rounded-xl, rounded-2xl, rounded-3xl, atau rounded-lg."
    echo "   Baris diff yang melanggar:"
    echo "$STAGED_DIFF" | grep -E "^\+[^\+]*\b(rounded-xl|rounded-2xl|rounded-3xl|rounded-lg)\b" | head -n 5
    echo ""
    exit 1
fi

# Cek 2: Dilarang penambahan teks "GOLD MEMBER VIP"
if echo "$STAGED_DIFF" | grep -E -i "^\+[^\+]*GOLD MEMBER VIP" > /dev/null; then
    echo ""
    echo "❌ [Audit Design System] DITEMUKAN LABEL 'GOLD MEMBER VIP'!"
    echo "💡 Label status keanggotaan wajib disederhanakan menjadi 'Member' atau 'Admin' tanpa kata 'VIP'."
    echo ""
    exit 1
fi

# Cek 3: Verifikasi AI Agent Auditor jika agy tersedia
PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Code Auditor khusus Design System Tusko Storefront.
Periksa Git Diff berikut HANYA terhadap Aturan Desain:
Aturan:
1. Tidak boleh ada komponen UI tombol, kartu, avatar, atau popup baru yang melengkung bulat (wajib rounded-none atau siku tajam).
2. Tidak boleh ada tulisan "GOLD MEMBER VIP" pada antarmuka.

Git Diff:
EOF

echo '```diff' >> "$PROMPT_FILE"
echo "$STAGED_DIFF" | head -n 80 >> "$PROMPT_FILE"
echo '```' >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"
Jawab HANYA:
- PASSED jika kode memenuhi standar desain Tusko.
- REJECTED: [alasan singkat] jika melanggar.
EOF

if command -v agy &> /dev/null; then
    RESULT=$(timeout 15s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v opencode &> /dev/null; then
    RESULT=$(timeout 20s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if echo "$RESULT" | grep -qi "REJECTED"; then
    echo "❌ [Audit Design System] DITOLAK OLEH AGENT AUDITOR:"
    echo "$RESULT" | grep -i "REJECTED"
    exit 1
fi

echo "✅ [Audit Design System] PASSED (Kepatuhan rounded-none & branding terverifikasi)."
exit 0
