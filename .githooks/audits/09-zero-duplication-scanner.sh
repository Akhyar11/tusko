#!/bin/bash

echo "🤖 [Audit 9/9: Whole-Project Zero Duplication Scanner] Memindai seluruh codebase tanpa git diff..."

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
SCANNER_SCRIPT="$REPO_ROOT/.githooks/audits/helpers/duplication-scanner.js"

if [ ! -f "$SCANNER_SCRIPT" ]; then
    echo "❌ [Audit Duplikasi] Helper scanner tidak ditemukan di $SCANNER_SCRIPT!"
    exit 1
fi

# Eksekusi scanner langsung terhadap berkas codebase (Node.js)
node "$SCANNER_SCRIPT"
SCAN_EXIT=$?

if [ $SCAN_EXIT -ne 0 ]; then
    echo ""
    echo "❌ [Audit Duplikasi] DITEMUKAN DUPLIKASI PADA CODEBASE!"
    echo "💡 Sesuai aturan arsitektur, seluruh rute API, migrasi tabel database, helper/formatter, dan komponen wajib tunggal & bebas duplikasi."
    echo ""
    exit $SCAN_EXIT
fi

echo "✅ [Audit Duplikasi] PASSED (Codebase bebas duplikasi 100%)."
exit 0
