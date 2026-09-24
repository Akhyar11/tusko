import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Save
} from 'lucide-react';
import TextInput from './molecules/TextInput';
import IconButton from './atoms/IconButton';
import StorefrontAuthLayout from './templates/StorefrontAuthLayout';
import { authService } from '../services/authService';

export default function ResetPasswordPage({
  onNavigateLogin = () => {},
  onBackToHome = () => {}
}) {
  const { token, emailFromUrl } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      token: params.get('token') || '',
      emailFromUrl: params.get('email') || ''
    };
  }, []);

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Alamat email tidak valid.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.resetPassword({
        token,
        email,
        password,
        passwordConfirmation
      });
      setSuccessMessage(result.message || 'Kata sandi berhasil direset.');
      setPassword('');
      setPasswordConfirmation('');
    } catch (err) {
      if (err.errors) {
        const firstError = Object.values(err.errors)[0];
        setErrorMessage(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setErrorMessage(err.message || 'Gagal mereset kata sandi. Silakan minta tautan baru.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isInvalidLink = !token || !emailFromUrl;

  return (
    <StorefrontAuthLayout
      badgeText="PENGATURAN ULANG KATA SANDI MEMBER TUSKO CLUB"
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
            <Lock size={20} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 leading-tight">
              Atur Ulang Kata Sandi
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Buat kata sandi baru yang kuat untuk mengamankan akun Tusko Anda.
            </p>
          </div>
        </div>

        {isInvalidLink ? (
          <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <p className="text-xs font-sport font-black uppercase">Tautan Tidak Valid</p>
            </div>
            <p className="text-xs mt-2">
              Tautan reset kata sandi tidak lengkap atau telah kedaluwarsa. Silakan minta tautan baru.
            </p>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="mt-3 text-xs font-black text-neutral-950 underline uppercase cursor-pointer"
            >
              Kembali ke Halaman Login &rarr;
            </button>
          </div>
        ) : (
          <>
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
              <div className="mb-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-none animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-xs font-sport font-black uppercase">Kata Sandi Direset</p>
                </div>
                <p className="text-xs mt-2">{successMessage}</p>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="mt-3 text-xs font-black text-emerald-900 underline uppercase cursor-pointer"
                >
                  Masuk dengan Kata Sandi Baru &rarr;
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="reset-email"
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

              <div>
                <label
                  htmlFor="reset-password"
                  className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5"
                >
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <TextInput
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Minimal 6 karakter"
                      required
                    />
                  </div>
                  <IconButton
                    icon={showPassword ? EyeOff : Eye}
                    tooltip={showPassword ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
                    variant="outline"
                    onClick={() => setShowPassword((prev) => !prev)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reset-password-confirmation"
                  className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5"
                >
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <TextInput
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  value={passwordConfirmation}
                  onChange={setPasswordConfirmation}
                  placeholder="Ulangi kata sandi baru"
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
                    <span>Menyimpan Kata Sandi...</span>
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

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
    </StorefrontAuthLayout>
  );
}
