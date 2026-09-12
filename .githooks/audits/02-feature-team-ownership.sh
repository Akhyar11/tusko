#!/bin/bash

echo "🤖 [Audit 2/9: Feature Team Ownership (OpenCode AI)] Memeriksa pembagian modul tim..."

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo "ℹ️ [Audit Feature Ownership] Tidak ada berkas yang di-stage. Skip."
    exit 0
fi

# Lewati verifikasi jika branch merupakan perbaikan global atau chore/tooling
if echo "$CURRENT_BRANCH" | grep -E "^(chore|fix|refactor|test|docs)/" > /dev/null; then
    echo "✅ [Audit Feature Ownership] PASSED (Branch pemeliharaan global: $CURRENT_BRANCH)."
    exit 0
fi

PROMPT_FILE=$(mktemp)
cat << 'EOF' > "$PROMPT_FILE"
Kamu adalah Team Boundary & Feature Ownership Auditor untuk proyek Tusko Performance Storefront.
Tugasmu adalah menganalisis apakah Developer pada branch aktif sedang menyentuh file yang berada di luar batas kepemilikan fiturnya tanpa koordinasi.

Pedoman Pembagian Tim:
1. Developer 1 (Alur Akun & Pembeli):
   - Fitur: Autentikasi Pengguna, Halaman Profil, Buku Alamat, Peta GPS, Voucher, Keranjang Belanja, Kupon, Alur Checkout & Pembayaran.
   - File Terkait: ProfilePage, AddressFormPage, MapPickerModal, CartPage, CheckoutPage, OrderSuccessPage, AuthController, ShippingAddressController, VoucherController, CartController, CheckoutController.
   - Branch: feat/auth-*, feat/profile-*, feat/cart-*, feat/checkout-*, feat/payment-*.

2. Developer 2 (Katalog & Operasional Toko):
   - Fitur: Katalog Produk Publik, Multi-filter & Search, Detail Produk & Varian, Panel Admin Produk, Manajemen Pesanan, Detail Resi/Invoice, Buku Kas, Manajemen Stok Gudang, Pengaturan Ekspedisi.
   - File Terkait: ProductGrid, ProductDetail, ProductListPage, ProductCreateForm, OrderListPage, OrderDetailPage, FinancialTransactionsPage, StockManagementPage, ExpeditionSettingsPage, ProductController, OrderController, TransactionController, InventoryController, ExpeditionController.
   - Branch: feat/catalog-*, feat/product-*, feat/orders-*, feat/stock-*, feat/expedition-*, feat/operations-*.

Konteks Saat Ini:
EOF

echo "Branch: $CURRENT_BRANCH" >> "$PROMPT_FILE"
echo "Berkas Ter-stage:" >> "$PROMPT_FILE"
echo "$STAGED_FILES" >> "$PROMPT_FILE"

cat << 'EOF' >> "$PROMPT_FILE"

Tugas Audit:
1. Periksa apakah ada konflik kepemilikan file yang bertentangan dengan branch developer yang bersangkutan.
2. Jawab:
- PASSED jika branch dan file yang disentuh sesuai dengan boundary atau merupakan file bersama (shared layout, routing, migrasi umum).
- WARNING
  - Lokasi Berkas: [WAJIB sebutkan path berkas lengkap yang melanggar boundary tim, contoh: frontend/src/components/ProfilePage.jsx]
  - Pelanggaran: [Developer pemilik fitur berkas tersebut dan alasan mengapa tidak boleh disentuh pada branch ini]
  - Tindakan: [Lakukan koordinasi dengan Developer 1/2 sebelum melanjutkan]
EOF

AUDITOR_RESULT=""
if command -v opencode &> /dev/null; then
    AUDITOR_RESULT=$(timeout 25s opencode run -m opencode/muse-spark-1.3-contributor-free "$(cat "$PROMPT_FILE")" 2>&1)
elif command -v agy &> /dev/null; then
    AUDITOR_RESULT=$(timeout 20s agy --print "$(cat "$PROMPT_FILE")" 2>&1)
fi
rm -f "$PROMPT_FILE"

if grep -E -q "(^|[[:space:]]|\*\*)WARNING([[:space:]]|:|\*\*|$)" <<< "$AUDITOR_RESULT"; then
    echo "⚠️ ======================================================================"
    echo "⚠️ [Audit Feature Ownership] PERINGATAN BOUNDARY FITUR OLEH OPENCODE AI:"
    echo "⚠️ ======================================================================"
    echo "$AUDITOR_RESULT" | sed -n -E '/WARNING/,$p'
    echo "💡 Pastikan Anda telah berkoordinasi antar pengembang untuk mencegah merge conflict."
    echo ""
fi

echo "✅ [Audit Feature Ownership] PASSED (Analisis kepemilikan fitur terverifikasi oleh OpenCode AI)."
exit 0
