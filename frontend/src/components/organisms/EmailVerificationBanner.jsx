import React, { useState } from 'react';
import { AlertTriangle, Loader2, MailCheck } from 'lucide-react';
import { authService } from '../../services/authService';

/**
 * Organism: EmailVerificationBanner
 * Menampilkan peringatan + aksi kirim ulang verifikasi untuk akun yang
 * belum memverifikasi email (email_verified_at null). Tidak tampil jika terverifikasi.
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
      <div className="mb-6 p-4 sm:p-5 bg-emerald-50 border-l-4 border-emerald-600 rounded-none flex items-start gap-3">
        <MailCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-sport font-black uppercase tracking-wider text-emerald-800">
            Tautan Verifikasi Terkirim
          </p>
          <p className="text-xs text-emerald-800 mt-1">
            Silakan periksa kotak masuk email <strong>{user.email}</strong> dan klik tautan verifikasi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 sm:p-5 bg-amber-50 border-l-4 border-amber-500 rounded-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-sport font-black uppercase tracking-wider text-amber-900">
            Email Belum Diverifikasi
          </p>
          <p className="text-xs text-amber-800 mt-1">
            Verifikasi email <strong>{user.email}</strong> untuk mengamankan akun dan menerima notifikasi pesanan.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={isSending}
        className="shrink-0 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Mengirim...</span>
          </>
        ) : (
          <span>Kirim Ulang Verifikasi</span>
        )}
      </button>
    </div>
  );
}
