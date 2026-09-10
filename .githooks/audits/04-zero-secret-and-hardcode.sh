#!/bin/bash

echo "🤖 [Audit 4/9: Zero Secret & Credentials Security] Memeriksa staged diff untuk mencegah kebocoran rahasia..."

STAGED_DIFF=$(git diff --cached)

if [ -z "$STAGED_DIFF" ]; then
    exit 0
fi

# Cek 1: Dilarang meng-commit file .env
STAGED_ENV=$(git diff --cached --name-only | grep -E "^\.env" || true)
if [ -n "$STAGED_ENV" ]; then
    echo ""
    echo "❌ [Audit Security] DILARANG MENYERTAKAN FILE .env DALAM COMMIT!"
    echo "   File terdeteksi: $STAGED_ENV"
    echo "💡 Harap unstage file .env: git restore --staged $STAGED_ENV"
    echo ""
    exit 1
fi

# Cek 2: Dilarang menyisipkan private key atau API token mentah
if echo "$STAGED_DIFF" | grep -E "^\+[^\+]*(-----BEGIN (RSA|EC|OPENSSH|PGP) PRIVATE KEY-----|ngpk_[0-9a-zA-Z]{20,}|AIza[0-9A-Za-z\-_]{35}|sk_live_[0-9a-zA-Z]{24})" > /dev/null; then
    echo ""
    echo "❌ [Audit Security] TERDETEKSI PRIVATE KEY ATAU API TOKEN DALAM DIFF!"
    echo "💡 Dilarang meng-commit private key atau credential token rahasia ke repository."
    echo ""
    exit 1
fi

echo "✅ [Audit Security] PASSED (Tidak ada credential rahasia ter-stage)."
exit 0
