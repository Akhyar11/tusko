# Tusko Performance - Interactive Prototype Canvas

Koleksi prototipe interaktif berstandar tinggi terinspirasi oleh **adidas.co.id**, dirancang menggunakan Design System resmi Tusko Performance sebelum implementasi kode.

## 📄 Halaman Prototipe Tersedia:
1. **[Beranda & Etalase](index.html)**: Hero campaign, kategori olahraga, trending chips, produk unggulan, adiClub banner, 4 pilar footer.
2. **[Detail Produk Ultimashow FX3632](detail-produk.html)**: Galeri multi-sudut, spesifikasi Cloudfoam, grid ukuran UK/EUR, ulasan performa.
3. **[Tas Belanja (Cart)](cart.html)**: Sesuai referensi `https://www.adidas.co.id/id/cart` (daftar item, selector kuantitas, estimasi gratis ongkir, kode kupon voucher, loyalty rewards, sticky order summary, trust badges).

## 🚀 Cara Melihat Prototipe:

### 1. Buka Langsung di Browser Lokal:
Buka file `cart.html` atau `index.html` langsung dengan browser pilihan Anda (Chrome/Edge/Firefox).

### 2. Jalankan Local Server:
```bash
npx serve prototype -l 3333
# Buka http://localhost:3333/cart.html
```

### 3. Deploy Publik Gratis untuk Tim & Klien:
```bash
# Opsi A: Deploy ke Vercel
npx vercel prototype --prod

# Opsi B: Deploy ke Surge.sh
npx surge prototype --domain tusko-store-demo.surge.sh
```

## 🛠️ MCP Server:
MCP Server `prototype-mcp` terdaftar di `~/.gemini/config/mcp_config.json` dan siap digunakan oleh AI agent untuk menambah, mengedit, atau meninjau halaman secara konsisten.
