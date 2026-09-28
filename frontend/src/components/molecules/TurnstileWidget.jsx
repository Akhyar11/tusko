import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

const SITEKEY = ((import.meta.env.VITE_TURNSTILE_SITEKEY) || '').trim();
// URL skrip MURNI dari env (G6) — tanpa fallback statis apa pun.
const SCRIPT_URL = ((import.meta.env.VITE_TURNSTILE_API_URL) || '').trim();

let scriptPromise = null;

function loadTurnstileScript() {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (!SCRIPT_URL) {
      reject(new Error('URL skrip Turnstile belum dikonfigurasi.'));
      return;
    }

    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile tidak tersedia.'));
      }
    };
    script.onerror = () => reject(new Error('Gagal memuat Turnstile.'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * TurnstileWidget — komponen reusable anti-bot Cloudflare (T35.5c).
 *
 * Me-render widget pada permukaan form, meneruskan token sekali-pakai via
 * `onVerify`, dan menyediakan `reset()` lewat ref untuk percobaan ulang.
 * Bila `VITE_TURNSTILE_SITEKEY` kosong, tidak me-render apa pun (dev tanpa kunci).
 */
const TurnstileWidget = forwardRef(function TurnstileWidget(
  { action = 'login', onVerify = () => {}, onExpire = () => {}, onError = () => {} },
  ref
) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const callbacksRef = useRef({ onVerify, onExpire, onError });
  callbacksRef.current = { onVerify, onExpire, onError };

  useImperativeHandle(ref, () => ({
    reset() {
      try {
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      } catch {
        // Abaikan kegagalan reset (mis. widget sudah dihapus).
      }
    },
  }), []);

  useEffect(() => {
    let active = true;

    if (!SITEKEY || !SCRIPT_URL) return undefined;

    loadTurnstileScript()
      .then((turnstile) => {
        if (!active || !containerRef.current) return;

        try {
          widgetIdRef.current = turnstile.render(containerRef.current, {
            sitekey: SITEKEY,
            action,
            callback: (token) => callbacksRef.current.onVerify(token),
            'expired-callback': () => callbacksRef.current.onExpire(),
            'error-callback': () => callbacksRef.current.onError(),
          });
        } catch {
          callbacksRef.current.onError();
        }
      })
      .catch(() => {
        if (active) callbacksRef.current.onError();
      });

    return () => {
      active = false;
      try {
        if (widgetIdRef.current !== null && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      } catch {
        // Abaikan saat unmount.
      }
      widgetIdRef.current = null;
    };
  }, [action]);

  if (!SITEKEY || !SCRIPT_URL) return null;

  // Catatan: TANPA class `cf-turnstile` agar tidak diproses oleh implicit-render
  // Turnstile; widget di-render eksplisit via `turnstile.render()` di atas.
  return <div ref={containerRef} className="tusko-turnstile rounded-none" data-action={action} />;
});

export default TurnstileWidget;
