#!/bin/bash

echo "🤖 [Audit 6/9: Frontend Build Integrity] Memeriksa bundling & kompilasi Vite/React..."

STAGED_FE=$(git diff --cached --name-only -- "frontend/src/**" "frontend/package.json" "frontend/vite.config.js")

if [ -z "$STAGED_FE" ]; then
    echo "ℹ️ [Audit Frontend] Tidak ada file frontend yang di-stage. Skip."
    exit 0
fi

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

echo "✅ [Audit Frontend] PASSED (Build frontend sukses tanpa error)."
exit 0
