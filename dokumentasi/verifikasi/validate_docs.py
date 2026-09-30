r"""
validate_docs.py — Validator deterministik dokumentasi TUSKO (tanpa AI).

Memeriksa:
  1. Setiap \\input{...} di main.tex punya berkas .tex (dan sebaliknya: tidak ada
     berkas flow "yatim" yang tidak di-\\input).
  2. Setiap gambar yang direferensikan \\shot{gambar/...} benar-benar ada.
  3. Setiap gambar yang ada adalah SCREENSHOT ASLI (PNG/JPEG valid, dimensi wajar,
     tidak polos/blank) — bukan gambar palsu/placeholder hasil editan.
  4. Tidak ada penanda "(TODO)" pada berkas flow yang diubah.
  5. Berkas flow konten yang diubah WAJIB memuat minimal 1 gambar (\\shot).

Cakupan PER-FLOW: pengecekan berkas (gambar hilang / TODO / minimal 1 gambar)
hanya diberlakukan pada berkas yang DIUBAH (env DOC_CHANGED), sehingga commit
dapat dilakukan bertahap satu flow tanpa tertahan flow lain yang belum dikerjakan.
Set DOC_STRICT_ALL=1 untuk memvalidasi SELURUH berkas (fase QA akhir).
Set DOC_ALLOW_MISSING=1 untuk mengizinkan gambar belum tersedia (fase penyusunan).

Exit code 0 = valid, 1 = ada pelanggaran (dilaporkan sebagai path:baris).
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOC = os.path.join(REPO, "dokumentasi")
MAIN = os.path.join(DOC, "main.tex")

SHOT_RE = re.compile(r"\\shot\s*\{([^}]*)\}")
TODO_RE = re.compile(r"\(TODO\)")
CONTENT_FLOW_RE = re.compile(r"^(P\d{2}|A\d{2}|D0[2-5])-")

DIRS = ["01-pendahuluan", "02-pelanggan", "03-admin", "04-lampiran"]

errors = []
warnings = []


def rel(p):
    return os.path.relpath(p, REPO)


def flow_files():
    out = []
    for d in DIRS:
        base = os.path.join(DOC, d)
        if not os.path.isdir(base):
            continue
        for name in sorted(os.listdir(base)):
            if name.endswith(".tex"):
                out.append(os.path.join(base, name))
    return out


def changed_set():
    raw = os.environ.get("DOC_CHANGED", "")
    return {x.strip() for x in raw.splitlines() if x.strip()}


def is_genuine_image(path):
    """Kembalikan (ok, alasan) untuk memvalidasi gambar sebagai screenshot asli."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return False, "berkas tidak terbaca"
    if size < 8 * 1024:
        return False, f"ukuran terlalu kecil ({size} bytes) — kemungkinan bukan screenshot"
    try:
        with open(path, "rb") as f:
            head = f.read(12)
    except OSError:
        return False, "gagal membaca berkas"
    is_png = head.startswith(b"\x89PNG\r\n\x1a\n")
    is_jpg = head.startswith(b"\xff\xd8\xff")
    if not (is_png or is_jpg):
        return False, "format bukan PNG/JPEG (bukan screenshot gambar)"
    try:
        from PIL import Image, ImageStat
        with Image.open(path) as im:
            w, h = im.size
            std = ImageStat.Stat(im.convert("L")).stddev[0]
    except Exception as exc:  # noqa: BLE001
        return False, f"gagal decode gambar: {exc}"
    if w < 320 or h < 240:
        return False, f"dimensi terlalu kecil ({w}x{h}) — bukan screenshot layar penuh"
    if std < 8:
        return False, f"gambar nyaris polos (stddev={std:.1f}) — bukan screenshot UI"
    return True, "ok"


def main():
    if not os.path.isfile(MAIN):
        print(f"❌ {rel(MAIN)} tidak ditemukan.")
        return 1

    main_lines = open(MAIN, encoding="utf-8").read().splitlines()
    includes = {}
    for i, line in enumerate(main_lines, start=1):
        for m in re.finditer(r"\\input\{([^}]+)\}", line):
            includes[m.group(1).strip()] = i
    include_set = set(includes)

    # 1a. include -> file
    for inc, line in includes.items():
        full = os.path.join(DOC, inc + ".tex")
        if not os.path.isfile(full):
            errors.append(f"{rel(MAIN)}:{line} — \\input{{{inc}}} menunjuk berkas yang TIDAK ADA: dokumentasi/{inc}.tex")

    # 1b. file flow -> harus di-input
    for f in flow_files():
        rel_inc = os.path.splitext(os.path.relpath(f, DOC))[0].replace(os.sep, "/")
        if rel_inc not in include_set:
            errors.append(f"{rel(f)} — berkas flow YATIM: tidak di-\\input dari main.tex (tidak akan tercetak)")

    all_changed = changed_set()
    strict_all = os.environ.get("DOC_STRICT_ALL") == "1"
    allow_missing = os.environ.get("DOC_ALLOW_MISSING") == "1"

    ref_images = {}   # abs img -> list[(file_rel, line)]
    shots_per_file = {}
    todo_hits = {}

    for f in flow_files():
        lines = open(f, encoding="utf-8").read().splitlines()
        frel = rel(f)
        for i, line in enumerate(lines, start=1):
            hits = SHOT_RE.findall(line)
            if hits:
                shots_per_file[frel] = shots_per_file.get(frel, 0) + len(hits)
                for img in hits:
                    abs_img = os.path.join(DOC, img.strip())
                    ref_images.setdefault(abs_img, []).append((frel, i))
            if TODO_RE.search(line):
                todo_hits.setdefault(frel, []).append(i)

    # 2 & 3. gambar
    for abs_img, refs in sorted(ref_images.items()):
        exists = os.path.isfile(abs_img)
        if exists:
            ok, reason = is_genuine_image(abs_img)
            if not ok:
                for frel, ln in refs:
                    errors.append(f"{frel}:{ln} — GAMBAR BUKAN SCREENSHOT VALID: {rel(abs_img)} — {reason}")
            continue
        # gambar belum ada: tegakkan hanya untuk berkas yang diubah (atau strict)
        for frel, ln in refs:
            relevant = strict_all or frel in all_changed
            if not relevant:
                continue
            if allow_missing:
                warnings.append(f"  (diizinkan) gambar belum ada: {rel(abs_img)}  ← {frel}:{ln}")
            else:
                errors.append(f"{frel}:{ln} — GAMBAR TIDAK DITEMUKAN: {rel(abs_img)} (wajib screenshot asli, bukan placeholder)")

    # 4 & 5. per berkas yang diubah (atau strict)
    for f in flow_files():
        frel = rel(f)
        relevant = strict_all or frel in all_changed
        if not relevant:
            continue
        base = os.path.basename(f)
        if CONTENT_FLOW_RE.match(base) and shots_per_file.get(frel, 0) == 0:
            errors.append(f"{frel} — flow konten WAJIB memuat minimal 1 gambar (\\shot), belum ada")
        for ln in todo_hits.get(frel, []):
            errors.append(f"{frel}:{ln} — masih ada penanda \"(TODO)\": isi dokumentasi belum lengkap")

    # ringkas
    print("🔎 [Validator Dokumentasi] Ringkasan:")
    print(f"   - Berkas flow .tex      : {len(flow_files())}")
    print(f"   - \\input di main.tex    : {len(includes)}")
    print(f"   - Gambar direferensikan : {len(ref_images)}")
    print(f"   - Gambar valid (asli)   : {sum(1 for a in ref_images if os.path.isfile(a) and is_genuine_image(a)[0])}")
    print(f"   - Mode cakupan          : {'STRICT-ALL' if strict_all else 'per-berkas-diubah'}")
    if all_changed:
        print(f"   - Berkas diubah         : {len(all_changed)}")

    if warnings:
        print("\n⚠️  Peringatan:")
        for w in warnings:
            print(w)

    if errors:
        print(f"\n❌ [Validator Dokumentasi] {len(errors)} pelanggaran:")
        for e in errors:
            print(f"   - {e}")
        return 1

    print("\n✅ [Validator Dokumentasi] Struktur & keaslian gambar VALID.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
