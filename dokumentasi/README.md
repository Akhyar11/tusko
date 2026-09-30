# Dokumentasi TUSKO (LaTeX)

Panduan Pengguna Sistem TUSKO untuk aktor **Admin** dan **Pelanggan**.
Seluruh isi **dipisah per alur/fitur** (1 alur = 1 berkas `.tex`); `main.tex`
hanya berisi `\input`.

## Struktur
- `01-pendahuluan/` — D01 cover, D02–D05 gambaran sistem/arsitektur/akses/login
- `02-pelanggan/`   — P01–P21 alur pelanggan (storefront)
- `03-admin/`       — A01–A27 alur admin (ERP)
- `04-lampiran/`    — L01–L05 lampiran teknis
- `gambar/`         — screenshot/diagram: `umum/`, `pelanggan/`, `admin/`, `lampiran/`

## Menambah gambar
Simpan screenshot sesuai nama pada caption/placeholder, mis.
`gambar/pelanggan/p10-1-halaman-keranjang.png`. Bila berkas belum ada,
`\shot{...}` otomatis menampilkan placeholder. Nama file = path di makro `\shot`.

## Makro
- `\flowmeta{KODE}{Judul}{Aktor}` — judul alur + label `flow:<KODE>`
- `\begin{flowsection}{Judul} ... \end{flowsection}` — subbagian alur
- `\shot{path}{caption}{label}` — gambar/placeholder + caption + label
- `\docver{versi}{tanggal}` — catatan versi alur

## Build
```bash
bash dokumentasi/build.sh
# hasil: dokumentasi/Tusko-Panduan-Pengguna.pdf
```

## Auditor Dokumentasi (pre-commit)
Commit dokumentasi dijaga oleh `.githooks/audits/14-documentation-consistency-auditor.sh`:

1. **Deterministik** — `python3 dokumentasi/verifikasi/validate_docs.py`
   memeriksa struktur `.tex` (semua `\input` punya berkas, tidak ada flow yatim),
   setiap `\shot{gambar/...}` punya berkas gambar **asli** (PNG/JPEG, dimensi wajar,
   bukan polos/placeholder), dan tidak ada `(TODO)` pada flow yang diubah.
2. **Playwright** — `python3 dokumentasi/verifikasi/verify_screenshots.py`
   (manifest `dokumentasi/verifikasi/flows.json`) membuka tiap alur di aplikasi nyata
   dan mengambil ulang screenshot (Chromium) untuk membuktikan halaman ADA & gambar
   bukan palsu. Bukti: `.agent-test-proofs/docs-verify/`.
3. **OpenCode AI** — menilai kesesuaian isi dokumentasi vs rute/endpoint aktual.

### Menjalankan verifikasi manual
```bash
# Aplikasi harus berjalan (FE). Sesuaikan base URL bila perlu.
DOC_VERIFY_BASE_URL=http://localhost:5173 python3 dokumentasi/verifikasi/verify_screenshots.py
# Kredensial untuk halaman ber-login:
# DOC_ADMIN_EMAIL, DOC_ADMIN_PASSWORD, DOC_CUSTOMER_EMAIL, DOC_CUSTOMER_PASSWORD
```

### Catatan mode
- Default `AUDIT_MODE=docs`: hanya auditor 14 yang jalan (auditor kode 01–13 mati).
- Aktifkan seluruh auditor: `AUDIT_MODE=full git commit ...`.
- Fase penyusunan (gambar belum ada): `DOC_ALLOW_MISSING=1` untuk melewati cek
  gambar, dan `DOC_STRICT_ALL=1` untuk memeriksa keaslian gambar SELURUH repo.
