import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { mockDemoUsers } from '../data/mockAuthData';

export default function LoginPage({
  onLoginSuccess = () => {},
  onNavigateRegister = () => {},
  onBackToHome = () => {},
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuickFill = (userType) => {
    const targetUser = mockDemoUsers.find((u) => u.role === userType);
    if (targetUser) {
      setEmail(targetUser.email);
      setPassword(targetUser.password);
      setErrorMessage('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Alamat email atau nomor HP wajib diisi.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    // Simulate network authentication latency
    setTimeout(() => {
      const matchedUser = mockDemoUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );

      if (matchedUser) {
        setSuccessMessage(`Selamat datang kembali, ${matchedUser.name}!`);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(matchedUser);
        }, 600);
      } else {
        setIsLoading(false);
        setErrorMessage('Email atau kata sandi yang Anda masukkan salah. Coba gunakan akun demo di bawah.');
      }
    }, 700);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between relative overflow-hidden selection:bg-amber-500 selection:text-neutral-950">
      {/* Background Ambience / Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 py-4 sm:py-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali ke Belanja</span>
        </button>

        {/* Brand Logo */}
        <div 
          onClick={onBackToHome}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-black text-lg shadow-md transform -skew-x-6">
            T
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tighter uppercase italic text-white">
            TUSKO<span className="text-amber-400">.</span>
          </span>
        </div>

        <div className="w-20 hidden sm:block" />
      </div>

      {/* Login Card Container */}
      <div className="max-w-md w-full mx-auto px-4 py-6 sm:py-10">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* Card Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <Zap size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Masuk ke Akun Anda
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Akses riwayat pesanan, lacak resi, dan nikmati diskon member eksklusif.
            </p>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
              <span>Akun Demo Siap Pakai:</span>
              <span className="text-amber-400/80 font-normal">1-Klik Isi Form</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('customer')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-amber-500/50 rounded-lg text-xs font-semibold text-neutral-300 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <User size={13} className="text-amber-400" />
                <span>Demo Pembeli</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 hover:border-amber-500/50 rounded-lg text-xs font-semibold text-neutral-300 hover:text-amber-400 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Demo Admin</span>
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                Email atau No. Handphone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: budi@tusko.com"
                  autoComplete="username"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => alert('Fitur reset kata sandi demo: Silakan gunakan akun demo atau hubungi admin.')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium hover:underline cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-neutral-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-neutral-400 font-medium">Ingat saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-black uppercase tracking-wider text-sm rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-800" />
            </div>
            <span className="relative px-3 bg-neutral-900 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              atau masuk dengan
            </span>
          </div>

          {/* Social SSO Mock Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleQuickFill('customer')}
              className="py-2.5 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.77 14.77 1 12 1 7.39 1 3.52 3.82 1.83 7.85l3.66 2.84C6.38 7.39 8.94 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.86c2.15-1.99 3.74-4.92 3.74-8.68z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.49 14.69c-.24-.73-.38-1.5-.38-2.31 0-.81.14-1.58.38-2.31L1.83 7.23C.66 9.57 0 12.19 0 15c0 2.81.66 5.43 1.83 7.77l3.66-2.84z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.68-2.86c-1.08.73-2.46 1.16-4.25 1.16-3.06 0-5.62-2.39-6.51-5.69L1.83 15.54C3.52 19.57 7.39 23 12 23z"
                />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('customer')}
              className="py-2.5 px-3 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.42-.58.68-1.1 1.75-.96 2.79 1.07.08 2.12-.59 2.74-1.34z" />
              </svg>
              <span>Apple ID</span>
            </button>
          </div>

          {/* Register Prompt */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            <span>Belum memiliki akun Tusko? </span>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Keamanan Enkripsi Akun 256-bit Terproteksi</span>
        </div>
      </div>

      {/* Footer minimal */}
      <div className="max-w-7xl mx-auto w-full px-4 py-4 text-center text-xs text-neutral-600 border-t border-neutral-900">
        <p>&copy; 2026 Tusko Performance Store. All rights reserved.</p>
      </div>
    </div>
  );
}
