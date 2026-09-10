#!/bin/bash

echo "🤖 [Audit 7/9: Frontend Full-Stack Consistency] Memeriksa kepatuhan arsitektur, icon library, & formatters..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
FE_SRC="$REPO_ROOT/frontend/src"

if [ ! -d "$FE_SRC" ]; then
    echo "ℹ️ [Audit Frontend Consistency] Direktori frontend/src tidak ditemukan. Skip."
    exit 0
fi

FAILED=0

# 1. Verifikasi Konsistensi Icon Library (Wajib 100% lucide-react, tolak icon library asing)
echo "🔍 [Frontend Consistency] Memeriksa standardisasi Icon Library..."
ROGUE_ICONS=$(grep -rnE --include="*.jsx" --include="*.js" "from ['\"](react-icons|@heroicons|font-awesome|@fortawesome|feather-icons)['\"]" "$FE_SRC")
if [ -n "$ROGUE_ICONS" ]; then
    echo "❌ Ditemukan import pustaka ikon non-standar! Proyek Tusko Storefront 100% menggunakan 'lucide-react'."
    echo "$ROGUE_ICONS"
    FAILED=1
fi

# 2. Verifikasi Standar LocalStorage Key (Wajib menggunakan prefix 'tusko_')
echo "🔍 [Frontend Consistency] Memeriksa prefix standardisasi LocalStorage (tusko_*)..."
ROGUE_STORAGE=$(grep -rnE --include="*.jsx" --include="*.js" "localStorage\.(setItem|getItem|removeItem)\(['\"][a-zA-Z0-9_]+" "$FE_SRC" | grep -v "tusko_")
if [ -n "$ROGUE_STORAGE" ]; then
    echo "❌ Ditemukan key localStorage tanpa prefix 'tusko_'!"
    echo "$ROGUE_STORAGE"
    FAILED=1
fi

# 3. Verifikasi Konsistensi Currency Formatter (Wajib formatRupiah dari utils/formatters.js)
echo "🔍 [Frontend Consistency] Memeriksa konsistensi formatter mata uang (formatRupiah)..."
INLINE_CURRENCY=$(grep -rnE --include="*.jsx" --include="*.js" --exclude="formatters.js" "new Intl\.NumberFormat\(['\"]id-ID['\"].*IDR" "$FE_SRC")
if [ -n "$INLINE_CURRENCY" ]; then
    echo "❌ Ditemukan deklarasi formatter mata uang inline/lokal! Gunakan 'formatRupiah' dari '@/utils/formatters.js'."
    echo "$INLINE_CURRENCY"
    FAILED=1
fi

# 4. Verifikasi Larangan Penambahan Sudut Melengkung pada Staged Changes
STAGED_FE_DIFF=$(git diff --cached -- "frontend/src/**/*.jsx" "frontend/src/**/*.js")
if [ -n "$STAGED_FE_DIFF" ]; then
    if echo "$STAGED_FE_DIFF" | grep -E "^\+[^\+]*\b(rounded-xl|rounded-2xl|rounded-3xl|rounded-lg)\b" > /dev/null; then
        echo "❌ Ditemukan penambahan kelas rounded melengkung pada perubahan yang di-stage!"
        echo "💡 Identitas desain Tusko Storefront adalah 'Sharp / Athletic Performance' (rounded-none)."
        echo "$STAGED_FE_DIFF" | grep -E "^\+[^\+]*\b(rounded-xl|rounded-2xl|rounded-3xl|rounded-lg)\b" | head -n 5
        FAILED=1
    fi
fi

if [ $FAILED -ne 0 ]; then
    echo ""
    echo "❌ [Audit Frontend Consistency] GAGAL: Terjadi inkonsistensi arsitektur frontend di atas!"
    exit 1
fi

echo "✅ [Audit Frontend Consistency] PASSED (Seluruh standar konsistensi Frontend terpenuhi)."
exit 0
