#!/bin/bash

echo "🤖 [Audit 1/9: Branch & Master Protection] Memeriksa branch aktif..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)

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

echo "✅ [Audit Branch Protection] PASSED (Branch: $CURRENT_BRANCH)."
exit 0
