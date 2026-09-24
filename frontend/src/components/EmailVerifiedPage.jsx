import React, { useMemo } from 'react';
import { AlertCircle, CheckCircle2, MailCheck } from 'lucide-react';
import StorefrontAuthLayout from './templates/StorefrontAuthLayout';

export default function EmailVerifiedPage({
  onNavigateLogin = () => {},
  onBackToHome = () => {}
}) {
  const isSuccess = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('status') !== 'failed';
  }, []);

  return (
    <StorefrontAuthLayout
      badgeText="VERIFIKASI EMAIL MEMBER TUSKO CLUB"
      onBackToHome={onBackToHome}
      headerAction={(
        <button
          type="button"
          onClick={onNavigateLogin}
          className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
        >
          <span>Kembali ke Login</span>
        </button>
      )}
    >
      <div className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-2xs rounded-none text-center">
        <div className="flex justify-center mb-5">
          <div className={`w-16 h-16 flex items-center justify-center rounded-none ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            {isSuccess ? <MailCheck size={32} /> : <AlertCircle size={32} />}
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
          {isSuccess ? 'Email Berhasil Diverifikasi' : 'Verifikasi Gagal'}
        </h1>
        <p className="text-xs text-neutral-600 mt-2 max-w-sm mx-auto">
          {isSuccess
            ? 'Terima kasih! Alamat email akun Tusko Anda telah terverifikasi. Anda kini dapat menikmati seluruh layanan kami.'
            : 'Tautan verifikasi tidak valid atau telah kedaluwarsa. Silakan masuk dan minta tautan verifikasi baru dari halaman profil.'}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onNavigateLogin}
            className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer rounded-none"
          >
            Masuk ke Akun
          </button>
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full sm:w-auto px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
          >
            Kembali ke Beranda
          </button>
        </div>

        {isSuccess && (
          <div className="mt-6 inline-flex items-center gap-2 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
            <CheckCircle2 size={14} />
            <span>Status akun: Terverifikasi</span>
          </div>
        )}
      </div>
    </StorefrontAuthLayout>
  );
}
