import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, MailCheck } from 'lucide-react';
import { authService } from '../../services/authService';

/**
 * Organism: EmailVerificationBanner
 * Peringatan ramping + aksi kirim ulang verifikasi untuk akun yang belum
 * memverifikasi email (email_verified_at null). Tidak tampil jika terverifikasi.
 */
export default function EmailVerificationBanner({ user, onShowToast = () => {} }) {
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!user || user.email_verified_at) {
    return null;
  }

  const handleResend = async () => {
    setIsSending(true);
    try {
      const result = await authService.resendVerificationEmail();
      setIsSent(true);
      onShowToast(result.message || 'Tautan verifikasi telah dikirim ulang.', 'success');
    } catch (err) {
      onShowToast(err.message || 'Gagal mengirim ulang tautan verifikasi.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <div className="mb-6 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 border-l-2 border-l-emerald-600 rounded-none px-4 py-3">
        <MailCheck size={16} className="text-emerald-600 shrink-0" />
        <p className="text-[11px] sm:text-xs text-emerald-800">
          <span className="font-sport font-black uppercase tracking-wider">Tautan verifikasi terkirim</span>
          <span className="mx-1.5 text-emerald-300">•</span>
          Cek kotak masuk <strong>{user.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4 bg-white border border-neutral-300 border-l-2 border-l-amber-500 rounded-none px-4 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertCircle size={16} className="text-amber-500 shrink-0" />
        <p className="text-[11px] sm:text-xs text-neutral-700 truncate">
          <span className="font-sport font-black uppercase tracking-wider text-neutral-950">Email belum diverifikasi</span>
          <span className="mx-1.5 text-neutral-300">•</span>
          <span className="text-neutral-600">{user.email}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending}
        className="sm:ml-auto shrink-0 inline-flex items-center gap-1 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-950 hover:text-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>Mengirim…</span>
          </>
        ) : (
          <>
            <span>Kirim ulang verifikasi</span>
            <ArrowRight size={13} />
          </>
        )}
      </button>
    </div>
  );
}
