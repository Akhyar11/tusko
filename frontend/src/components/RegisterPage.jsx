import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Check
} from 'lucide-react';

export default function RegisterPage({
  onRegisterSuccess = () => {},
  onNavigateLogin = () => {},
  onBackToHome = () => {}
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Belum diisi', score: 0, color: 'bg-neutral-800' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Lemah', score: 1, color: 'bg-rose-500' };
    if (score <= 3) return { label: 'Sedang', score: 2, color: 'bg-amber-500' };
    return { label: 'Kuat', score: 3, color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  const handleQuickFill = () => {
    setName('Rian Ardianto');
    setEmail('rian.atlet@gmail.com');
    setPhone('0813-8899-7766');
    setPassword('rahasia123');
    setPasswordConfirmation('rahasia123');
    setAgreeTerms(true);
    setErrorMessage('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Format alamat email tidak valid.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Nomor handphone wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan Layanan.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        role: 'customer',
        phone: phone.trim(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinedDate: 'Baru Bergabung',
        membershipTier: 'New Member',
        points: 100, // Welcome bonus points
        defaultAddress: {
          recipient_name: name.trim(),
          phone: phone.trim(),
          full_address: 'Belum ada alamat tersimpan',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postal_code: '10000'
        }
      };

      setIsLoading(false);
      setSuccessMessage(`Akun berhasil didaftarkan! Selamat datang di Tusko, ${newUser.name}.`);

      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 700);
    }, 800);
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
          <span>Kembali ke Toko</span>
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

      {/* Register Card Container */}
      <div className="max-w-md w-full mx-auto px-4 py-6 sm:py-8">
        <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          {/* Card Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mb-3 border border-amber-500/20">
              <Sparkles size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              Daftar Akun Baru
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Dapatkan bonus 100 Poin Selamat Datang & voucher bebas ongkir pertama Anda.
            </p>
          </div>

          {/* Quick Demo Fill Button */}
          <div className="mb-5 p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl flex items-center justify-between gap-2">
            <div className="text-[11px] text-neutral-400">
              <span className="font-bold text-neutral-300">Mode Demo: </span>
              <span>Isi formulir otomatis</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              1-Klik Isi Data
            </button>
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="contoh: Rian Ardianto"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <User size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh: rian.atlet@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <Mail size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Nomor Handphone (WhatsApp)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="contoh: 081234567890"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <Phone size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
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

              {/* Password strength indicator */}
              {password && (
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                    <div className={`h-1 flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-neutral-800'}`} />
                    <div className={`h-1 flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-neutral-800'}`} />
                    <div className={`h-1 flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-neutral-800'}`} />
                  </div>
                  <span className="text-neutral-400">Kekuatan: <strong className="text-neutral-200">{strength.label}</strong></span>
                </div>
              )}
            </div>

            {/* Password Confirmation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1">
                Ulangi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Ketik ulang kata sandi..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-750 focus:border-amber-500 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-700 bg-neutral-950 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-neutral-400 leading-tight">
                  Saya menyetujui <span className="text-amber-400 hover:underline">Syarat & Ketentuan</span> serta <span className="text-amber-400 hover:underline">Kebijakan Privasi</span> Tusko Store.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-black uppercase tracking-wider text-sm rounded-xl shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <span>Daftar Sekarang</span>
              )}
            </button>
          </form>

          {/* Login Prompt */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            <span>Sudah memiliki akun Tusko? </span>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-bold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Data Anda Terjamin Aman & Tidak Diperjualbelikan</span>
        </div>
      </div>

      {/* Footer minimal */}
      <div className="max-w-7xl mx-auto w-full px-4 py-4 text-center text-xs text-neutral-600 border-t border-neutral-900">
        <p>&copy; 2026 Tusko Performance Store. All rights reserved.</p>
      </div>
    </div>
  );
}
