/**
 * Loader Midtrans Snap.js yang dipakai bersama (checkout & halaman pesanan).
 * URL Snap.js berasal dari konfigurasi admin (G6) — tanpa hardcode.
 */
export function loadSnapScript(clientKey, snapUrl) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.snap && typeof window.snap.pay === 'function') {
      resolve(true);
      return;
    }

    if (!snapUrl) {
      reject(new Error('Snap URL tidak dikonfigurasi.'));
      return;
    }

    const script = document.createElement('script');
    script.id = 'midtrans-snap-script';
    script.src = snapUrl;
    script.setAttribute('data-client-key', clientKey || '');
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Gagal memuat Snap.js.'));
    document.body.appendChild(script);
  });
}

/**
 * Buka popup Snap untuk token tertentu.
 */
export async function openSnapPayment({ clientKey, snapJsUrl, token, onSuccess, onPending, onError, onClose }) {
  await loadSnapScript(clientKey, snapJsUrl);

  if (typeof window === 'undefined' || !window.snap || typeof window.snap.pay !== 'function') {
    throw new Error('Snap.js tidak tersedia.');
  }

  window.snap.pay(token, { onSuccess, onPending, onError, onClose });
}
