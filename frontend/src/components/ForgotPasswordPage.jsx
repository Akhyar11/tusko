import React, { useState } from 'react';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Save
} from 'lucide-react';
import TextInput from './molecules/TextInput';
import StorefrontAuthLayout from './templates/StorefrontAuthLayout';
import { authService } from '../services/authService';

export default function ForgotPasswordPage({
  onNavigateLogin = () => {},
  onBackToHome = () => {}
}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      setSuccessMessage(result.message || 'Tautan reset kata sandi telah dikirim ke email Anda.');
      setEmail('');
    } catch (err) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        setErrorMessage(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setErrorMessage(err.message || 'Gagal mengirim tautan reset. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StorefrontAuthLayout
      badgeText="PEMULIHAN AKUN MEMBER TUSKO CLUB"
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
      <div className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-2xs rounded-none">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0 rounded-none">
            <KeyRound size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 leading-tight">
              Lupa Kata Sandi?
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Masukkan email terdaftar. Kami akan mengirim tautan untuk mengatur ulang kata sandi Anda.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="text-xs font-sport font-bold uppercase">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage('')}
              className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0"
              title="Tutup pesan"
            >
              <AlertCircle size={15} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-none flex items-start gap-2 animate-in fade-in duration-150">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-sport font-black uppercase">Tautan Terkirim</p>
              <p className="text-xs text-emerald-800 mt-1">{successMessage}</p>
              <p className="text-xs text-emerald-800 mt-1">
                Periksa kotak masuk (dan folder spam) email Anda, lalu ikuti tautan tersebut.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5"
            >
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <TextInput
              type="email"
              name="email"
              value={email}
              onChange={setEmail}
              placeholder="nama@email.com"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Mengirim Tautan...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Kirim Tautan Reset</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-neutral-200 text-center text-xs text-neutral-600">
          Sudah ingat kata sandi Anda?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-black text-neutral-950 underline uppercase ml-1 hover:text-neutral-700 cursor-pointer"
          >
            Masuk di Sini &rarr;
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 hover:text-black uppercase tracking-wider cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Beranda</span>
        </button>
      </div>
    </StorefrontAuthLayout>
  );
}
