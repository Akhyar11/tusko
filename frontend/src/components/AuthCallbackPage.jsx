import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';

/**
 * T41.6 — Halaman callback OAuth Google.
 *
 * Menerima `?code=` (one-time code) atau `?error=` dari backend, menukar code
 * menjadi token Sanctum, lalu menyerahkan user ke App (login).
 */
export default function AuthCallbackPage({
  onLoginSuccess = () => {},
  onNavigateLogin = () => {},
}) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Memproses login Google...');
  const ranRef = useRef(false);
  const paramsRef = useRef(null);

  if (paramsRef.current === null && typeof window !== 'undefined') {
    paramsRef.current = new URLSearchParams(window.location.search);
  }

  useEffect(() => {
    if (ranRef.current) return undefined;
    ranRef.current = true;

    const params = paramsRef.current || new URLSearchParams();
    const error = params.get('error');
    const code = params.get('code');

    if (error) {
      setStatus('error');
      setMessage(error);
      return undefined;
    }

    if (!code) {
      setStatus('error');
      setMessage('Kode login Google tidak ditemukan.');
      return undefined;
    }

    (async () => {
      try {
        const res = await authService.exchangeGoogleCode(code);
        setStatus('success');
        setMessage('Login berhasil. Mengalihkan...');
        onLoginSuccess(res.user);
      } catch (err) {
        setStatus('error');
        setMessage(err?.message || 'Gagal menyelesaikan login Google.');
      }
    })();

    return undefined;
  }, [onLoginSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] px-4">
      <div className="w-full max-w-md bg-white border border-neutral-300 rounded-none shadow-2xs p-6 sm:p-8 text-center space-y-4">
        <div className="flex justify-center">
          {status === 'loading' && <Loader2 className="animate-spin text-amber-500" size={32} />}
          {status === 'success' && <CheckCircle2 className="text-emerald-600" size={32} />}
          {status === 'error' && <AlertCircle className="text-rose-600" size={32} />}
        </div>
        <h1 className="text-sm font-sport font-black uppercase tracking-wider text-neutral-950">
          Login Google
        </h1>
        <p className="text-xs text-neutral-600">{message}</p>
        {status === 'error' && (
          <button
            type="button"
            onClick={onNavigateLogin}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-sport font-black uppercase tracking-wider rounded-none cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Login</span>
          </button>
        )}
      </div>
    </div>
  );
}
