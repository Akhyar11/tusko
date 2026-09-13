import { apiClient } from '../services/apiClient';

/**
 * Midtrans Snap Dynamic Loader & Integration Helper
 * Tusko Athletic Performance Storefront
 */

let snapScriptLoadingPromise = null;

/**
 * Dynamically load Midtrans Snap JS SDK
 */
export async function loadMidtransSnap(clientKey = '', isProduction = false) {
  if (window.snap) {
    return window.snap;
  }

  if (snapScriptLoadingPromise) {
    return snapScriptLoadingPromise;
  }

  const scriptUrl = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';

  snapScriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script already in DOM
    const existing = document.querySelector(`script[src*="midtrans.com/snap/snap.js"]`);
    if (existing) {
      if (window.snap) {
        resolve(window.snap);
        return;
      }
      existing.addEventListener('load', () => resolve(window.snap));
      existing.addEventListener('error', () => reject(new Error('Failed to load Midtrans Snap SDK.')));
      return;
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    script.onload = () => {
      resolve(window.snap);
    };

    script.onerror = () => {
      snapScriptLoadingPromise = null;
      console.warn('Gagal memuat Midtrans Snap SDK secara langsung. Beralih ke fallback internal.');
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return snapScriptLoadingPromise;
}

/**
 * Trigger Midtrans Snap Payment Popup or fallback
 */
export async function triggerMidtransPayment({
  snapToken,
  clientKey,
  isProduction = false,
  onSuccess = () => {},
  onPending = () => {},
  onError = () => {},
  onClose = () => {},
}) {
  try {
    const snap = await loadMidtransSnap(clientKey, isProduction);

    if (snap && typeof snap.pay === 'function' && snapToken) {
      snap.pay(snapToken, {
        onSuccess: (result) => {
          onSuccess(result);
        },
        onPending: (result) => {
          onPending(result);
        },
        onError: (err) => {
          onError(err);
        },
        onClose: () => {
          onClose();
        },
      });
      return true;
    }
  } catch (e) {
    console.warn('Midtrans Snap payment error:', e);
  }

  return false;
}
