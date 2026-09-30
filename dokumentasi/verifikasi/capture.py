#!/usr/bin/env python3
"""
capture.py — Pengambil screenshot dokumentasi TUSKO via Playwright (Python).

Dipakai untuk MENGISI data lewat UI sekaligus MENANGKAP screenshot tiap flow
ke path yang didefinisikan di dokumentasi/verifikasi/flows.json.

Contoh:
  python3 dokumentasi/verifikasi/capture.py --base http://localhost:4173 D02 P01 --full
  python3 dokumentasi/verifikasi/capture.py --base http://localhost:4173 --all

Opsi login: set env DOC_ADMIN_EMAIL/PASSWORD dan DOC_CUSTOMER_EMAIL/PASSWORD.
"""
import argparse
import json
import os
import sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DOC = os.path.join(REPO, "dokumentasi")
MANIFEST = os.path.join(DOC, "verifikasi", "flows.json")


def load_manifest():
    with open(MANIFEST, encoding="utf-8") as f:
        return json.load(f)


def login(page, base, kind):
    email = os.environ.get(f"DOC_{kind.upper()}_EMAIL")
    password = os.environ.get(f"DOC_{kind.upper()}_PASSWORD")
    if not email or not password:
        print(f"⚠️  kredensial DOC_{kind.upper()}_EMAIL/PASSWORD tidak diset.")
        return False
    page.goto(f"{base}/login", wait_until="domcontentloaded")
    page.fill('input[name="login-email"]', email)
    page.fill('input[name="login-password"]', password)
    page.click('button[type="submit"]')
    page.wait_for_timeout(2500)
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=os.environ.get("DOC_VERIFY_BASE_URL", "http://localhost:4173"))
    ap.add_argument("--full", action="store_true", help="screenshot seluruh halaman")
    ap.add_argument("--all", action="store_true", help="capture semua flow ber-URL")
    ap.add_argument("codes", nargs="*")
    args = ap.parse_args()
    base = args.base.rstrip("/")

    manifest = load_manifest()
    entries = {e["kode"].upper(): e for e in manifest["flows"]}
    codes = [c.upper() for c in args.codes]
    if args.all:
        codes = [k for k, e in entries.items() if e.get("url")]
    if not codes:
        print("Tidak ada kode flow. Gunakan CODE... atau --all.")
        return 1

    from playwright.sync_api import sync_playwright

    failures = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()
        console_errors = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        logged = {"admin": False, "customer": False}

        for code in codes:
            entry = entries.get(code)
            if not entry or not entry.get("url"):
                print(f"↷ {code}: dilewati (tanpa URL).")
                continue
            url = base + entry["url"]
            print(f"📸 {code} → {url}")
            try:
                need = entry.get("login")
                if need and not logged.get(need):
                    logged[need] = login(page, base, need)
                page.goto(url, wait_until="networkidle", timeout=30000)
                page.wait_for_timeout(1200)
                expect = entry.get("expect_text")
                body = page.inner_text("body")
                if expect and expect.lower() not in body.lower():
                    print(f"   ⚠️ teks penanda '{expect}' tidak ditemukan.")
                outs = entry.get("gambar") or []
                if not outs:
                    print("   ⚠️ tidak ada path gambar di manifest.")
                    continue
                for rel in outs:
                    dst = os.path.join(DOC, rel)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    page.screenshot(path=dst, full_page=args.full)
                    print(f"   ✅ {rel} ({os.path.getsize(dst)} bytes)")
            except Exception as exc:  # noqa: BLE001
                failures += 1
                print(f"   ❌ GAGAL: {exc}")
        browser.close()

    if console_errors:
        print(f"\n⚠️  {len(console_errors)} console error:")
        for e in console_errors[:10]:
            print("   -", e[:160])
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
