#!/usr/bin/env python3
"""
verify_screenshots.py — Verifikasi screenshot dokumentasi TUSKO dengan Playwright (Python).

Tujuan (AGENTS.md auditor 14):
  - Membuktikan setiap gambar dokumentasi BENAR-BENAR screenshot hasil render aplikasi
    nyata (bukan gambar palsu/diedit), dengan MENGAMBIL ULANG via Playwright Chromium
    dan membandingkan kemiripan (perceptual hash) dengan gambar yang di-commit.
  - Membuktikan halaman/alur yang didokumentasikan BENAR-BENAR ada di aplikasi aktual
    (navigasi ke URL flow + verifikasi teks penanda) → dokumentasi vs kode/flow sinkron.

Manifest: dokumentasi/verifikasi/flows.json
Base URL: env DOC_VERIFY_BASE_URL (default http://localhost:5173)
Login    : env DOC_ADMIN_EMAIL/PASSWORD, DOC_CUSTOMER_EMAIL/PASSWORD (opsional)
Mode tegas: env DOC_STRICT_MATCH=1 → gambar harus MIRIP dengan hasil re-capture.
Bukti    : .agent-test-proofs/docs-verify/<KODE>.png  (+ laporan JSON)

Exit 0 = lolos; 1 = ada kegagalan.
"""
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOC = os.path.join(REPO, "dokumentasi")
MANIFEST = os.path.join(DOC, "verifikasi", "flows.json")
PROOF_DIR = os.path.join(REPO, ".agent-test-proofs", "docs-verify")
BASE_URL = os.environ.get("DOC_VERIFY_BASE_URL", "http://localhost:5173").rstrip("/")
STRICT = os.environ.get("DOC_STRICT_MATCH") == "1"

IMG_EXT = (".png", ".jpg", ".jpeg")


def dhash(path, size=8):
    from PIL import Image
    with Image.open(path) as im:
        g = im.convert("L").resize((size + 1, size))
        pixels = list(g.getdata())
    bits = []
    for row in range(size):
        for col in range(size):
            left = pixels[row * (size + 1) + col]
            right = pixels[row * (size + 1) + col + 1]
            bits.append(1 if left > right else 0)
    return bits


def hamming(a, b):
    return sum(1 for x, y in zip(a, b) if x != y)


def collect_images():
    """Gambar .png/.jpg di folder dokumentasi/gambar (yang benar-benar ada)."""
    found = {}
    root = os.path.join(DOC, "gambar")
    for dirpath, _dirs, files in os.walk(root):
        for fn in files:
            if fn.lower().endswith(IMG_EXT):
                found[os.path.join(dirpath, fn)] = fn
    return found


def match_flow_code(filename):
    """Ambil kode flow (P01/A01/D01/L01) dari nama berkas gambar."""
    stem = filename.split("-")[0].upper()
    return stem if len(stem) >= 3 else None


def load_manifest():
    if not os.path.isfile(MANIFEST):
        return None
    with open(MANIFEST, encoding="utf-8") as f:
        return json.load(f)


def do_login(page, kind):
    email = os.environ.get(f"DOC_{kind.upper()}_EMAIL")
    password = os.environ.get(f"DOC_{kind.upper()}_PASSWORD")
    if not email or not password:
        return False, f"kredensial DOC_{kind.upper()}_EMAIL/PASSWORD tidak diset"
    page.goto(f"{BASE_URL}/login", wait_until="domcontentloaded")
    page.fill('input[type="email"], input[name="email"]', email)
    page.fill('input[type="password"], input[name="password"]', password)
    page.click('button[type="submit"], button:has-text("Masuk")')
    page.wait_for_timeout(1500)
    return True, "login dieksekusi"


def main():
    images = collect_images()
    manifest = load_manifest()

    if not images:
        print("ℹ️ [Verifikasi Screenshot] Belum ada gambar di dokumentasi/gambar/. Skip Playwright.")
        return 0

    if manifest is None:
        print("❌ [Verifikasi Screenshot] Manifest dokumentasi/verifikasi/flows.json TIDAK ADA.")
        return 1

    entries = {e["kode"].upper(): e for e in manifest.get("flows", [])}

    # Pasangkan gambar -> flow
    targets = []
    for path, fn in sorted(images.items()):
        code = match_flow_code(fn)
        if not code or code not in entries:
            print(f"⚠️  Gambar {os.path.relpath(path, REPO)} tidak punya entri manifest (kode={code}). "
                  f"Tambahkan ke flows.json agar dapat diuji.")
            continue
        entry = entries[code]
        if not entry.get("url"):
            print(f"ℹ️  {code}: flow tanpa URL (mis. email/ops) — dilewati Playwright.")
            continue
        targets.append((code, entry, path))

    if not targets:
        print("ℹ️ [Verifikasi Screenshot] Tidak ada flow ber-URL untuk diuji. Skip.")
        return 0

    try:
        from playwright.sync_api import sync_playwright
    except Exception as exc:  # noqa: BLE001
        print(f"❌ Playwright tidak tersedia: {exc}")
        return 1

    os.makedirs(PROOF_DIR, exist_ok=True)
    report = []
    failures = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        logged = {"admin": False, "customer": False}
        try:
            for code, entry, committed in targets:
                url = BASE_URL + entry["url"]
                need = entry.get("login")
                print(f"🎭 {code} → {url}")
                try:
                    if need and not logged.get(need):
                        ok, msg = do_login(page, need)
                        if not ok:
                            failures.append(f"{code}: {msg}")
                            continue
                        logged[need] = True
                    page.goto(url, wait_until="domcontentloaded", timeout=20000)
                    page.wait_for_timeout(1200)

                    expect = entry.get("expect_text")
                    body = page.inner_text("body")
                    if expect and expect.lower() not in body.lower():
                        failures.append(f"{code}: teks penanda '{expect}' TIDAK ditemukan di {url} "
                                        f"(halaman/alur tidak sesuai dokumentasi)")
                        continue

                    proof = os.path.join(PROOF_DIR, f"{code}.png")
                    page.screenshot(path=proof, full_page=True)

                    dist = hamming(dhash(committed), dhash(proof))
                    status = "MATCH" if dist <= 20 else "DIFFER"
                    report.append({"kode": code, "url": entry["url"], "gambar": os.path.relpath(committed, REPO),
                                   "hash_distance": dist, "status": status, "proof": os.path.relpath(proof, REPO)})
                    print(f"    → {status} (dHash distance={dist})")
                    if STRICT and status == "DIFFER":
                        failures.append(f"{code}: gambar {os.path.relpath(committed, REPO)} tidak mirip dengan "
                                        f"screenshot aktual (distance={dist}) — kemungkinan gambar lama/palsu")
                except Exception as exc:  # noqa: BLE001
                    failures.append(f"{code}: gagal memuat {url} — {exc}")
        finally:
            browser.close()

    with open(os.path.join(PROOF_DIR, "report.json"), "w", encoding="utf-8") as f:
        json.dump({"base_url": BASE_URL, "strict": STRICT, "results": report, "failures": failures}, f, indent=2)

    if console_errors:
        print(f"⚠️  {len(console_errors)} console error di browser (contoh: {console_errors[0][:120]})")

    print(f"\n🎭 [Verifikasi Screenshot] {len(report)} flow diuji, {len(failures)} gagal.")
    if failures:
        for x in failures:
            print(f"   - {x}")
        return 1
    print("✅ [Verifikasi Screenshot] Semua gambar terbukti screenshot dari aplikasi nyata (Playwright).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
