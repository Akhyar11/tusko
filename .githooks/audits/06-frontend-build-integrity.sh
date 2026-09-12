#!/bin/bash

echo "🤖 [Audit 6/9: Frontend Build Integrity (OpenCode AI)] Memeriksa bundling & kompilasi Vite/React..."

STAGED_FE=$(git diff --cached --name-only -- "frontend/src/**" "frontend/package.json" "frontend/vite.config.js")

if [ -z "$STAGED_FE" ]; then
    echo "ℹ️ [Audit Frontend] Tidak ada file frontend yang di-stage. Skip."
    exit 0
fi

# 1. OpenCode AI Frontend Build & Import Integrity Auditor
STAGED_FE_DIFF=$(git diff --cached -- "frontend/src/**/*.jsx" "frontend/src/**/*.js" "frontend/package.json")
if [ -n "$STAGED_FE_DIFF" ]; then
    echo "🔍 Menganalisis kebersihan import & JSX bundling dengan OpenCode AI..."
    PROMPT_FILE=$(mktemp)
    cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Frontend Build & Bundle Integrity Auditor untuk aplikasi React/Vite.
Tugasmu adalah menganalisis Git Diff frontend berikut:

ATURAN INTEGRITAS FRONTEND BUILD:
1. Pastikan tidak ada import ke file/modul yang tidak ada atau salah ketik (typo).
2. Pastikan sintaks JSX ditutup dengan benar dan tidak ada variabel yang belum didefinisikan yang menyebabkan build crash.
3. Pastikan export/import komponen sinkron.

Git Diff:
```diff
EOF
    sed -n '1,120p' <<< "$STAGED_FE_DIFF" >> "$PROMPT_FILE"
    cat << 'EOF' >> "$PROMPT_FILE"
```

FORMAT JAWABAN:
- Jika struktur kode frontend bersih dan siap build: Jawab HANYA kata "PASSED".
- Jika berpotensi merusak build:
  REJECTED: [alasan singkat potensi kegagalan build/bundling]
EOF

    AI_RESULT=""
    if command -v opencode &> /dev/null; then
        AI_RESULT=$(timeout 25s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
    elif command -v agy &> /dev/null; then
        AI_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
    fi
    rm -f "$PROMPT_FILE"

    if grep -E -q "(^|[[:space:]]|\*\*)(REJECTED|DITOLAK)([[:space:]]|:|\*\*|$)" <<< "$AI_RESULT"; then
        echo "❌ [Audit Frontend Build] DITOLAK OLEH OPENCODE AI:"
        echo "$AI_RESULT" | grep -i "REJECTED"
        exit 1
    fi
fi

# 2. Bundling Kompilasi Nyata (npm run build)
echo "🔍 Menjalankan Frontend Build (npm run build)..."
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
cd "$REPO_ROOT/frontend" || exit 1

BUILD_OUTPUT=$(npm run build 2>&1)
BUILD_EXIT=$?

if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo "❌ [Audit Frontend] NPM RUN BUILD GAGAL!"
    echo "-----------------------------------------------------"
    echo "$BUILD_OUTPUT" | tail -n 25
    echo "-----------------------------------------------------"
    echo "💡 Ditemukan kesalahan sintaks/bundling frontend. Harap perbaiki sebelum commit."
    echo ""
    exit 1
fi

echo "✅ [Audit Frontend] PASSED (Build frontend sukses & diverifikasi OpenCode AI)."
exit 0
