#!/bin/bash

echo "🤖 [Audit 2/9: Feature Team Ownership] Memeriksa kepatuhan pembagian modul & boundary fitur..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Deteksi jika Developer 1 (Auth / Cart / Checkout) menyentuh file produk/stok Developer 2
if echo "$CURRENT_BRANCH" | grep -E "^feat/(auth|profile|cart|checkout)" > /dev/null; then
    DISCORDANT=$(echo "$STAGED_FILES" | grep -E "(ProductListPage|StockManagementPage|ExpeditionSettingsPage|ProductController\.php|InventoryController\.php)" || true)
    if [ -n "$DISCORDANT" ]; then
        echo "⚠️ [Audit Feature Ownership] Peringatan: Branch '$CURRENT_BRANCH' (Developer 1) menyentuh file area Developer 2:"
        echo "$DISCORDANT"
        echo "💡 Pastikan Anda telah berkoordinasi dengan Developer 2 untuk mencegah konflik merge."
    fi
fi

# Deteksi jika Developer 2 (Catalog / Orders / Stock) menyentuh file auth/cart Developer 1
if echo "$CURRENT_BRANCH" | grep -E "^feat/(catalog|product|orders|stock|expedition)" > /dev/null; then
    DISCORDANT=$(echo "$STAGED_FILES" | grep -E "(ProfilePage|AddressFormPage|CartPage|CheckoutPage|AuthController\.php|ShippingAddressController\.php)" || true)
    if [ -n "$DISCORDANT" ]; then
        echo "⚠️ [Audit Feature Ownership] Peringatan: Branch '$CURRENT_BRANCH' (Developer 2) menyentuh file area Developer 1:"
        echo "$DISCORDANT"
        echo "💡 Pastikan Anda telah berkoordinasi dengan Developer 1 untuk mencegah konflik merge."
    fi
fi

echo "✅ [Audit Feature Ownership] PASSED (Boundary kepemilikan fitur terverifikasi)."
exit 0
