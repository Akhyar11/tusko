import React, { useState } from 'react';
import { 
  ArrowRight, 
  Gift, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { authService } from '../services/authService';

export default function RegisterPage({
  onRegisterSuccess = () => {},
  onNavigateLogin = () => {},
  onBackToHome = () => {}
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [preference, setPreference] = useState('Pria');
  const [agreeAge, setAgreeAge] = useState(true);
  const [agreePromo, setAgreePromo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { text: '-', color: 'text-neutral-400', level: 0 };
    if (password.length < 6) {
      return { text: 'Lemah', color: 'text-red-600', level: 1 };
    } else if (password.length < 10) {
      return { text: 'Sedang', color: 'text-amber-600', level: 2 };
    } else {
      return { text: 'Sangat Kuat', color: 'text-emerald-600', level: 3 };
    }
  };

  const strength = getPasswordStrength();

  const handleAutofillDemo = () => {
    setName('Rian Hidayat');
    setEmail('rian.hidayat@gmail.com');
    setPhone('813-8822-1920');
    setPassword('TuskoSpeed2026!');
    setErrorMessage('');
  };

  const handleSocialRegister = async (socialName, socialEmail) => {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage(`🎉 Pendaftaran ${socialName} Berhasil via SSO!`);

    try {
      const res = await authService.register({
        name: socialName,
        email: socialEmail,
        password: 'TuskoSpeed2026!',
        phone: '0813-8822-1920',
      });
      setTimeout(() => {
        onRegisterSuccess(res.user);
      }, 500);
    } catch {
      const fallbackUser = {
        id: Date.now(),
        name: socialName,
        email: socialEmail,
        role: 'customer',
        phone: '0813-8822-1920',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        joinedDate: 'Maret 2026',
        membershipTier: 'New Member',
        points: 100,
        defaultAddress: {
          recipient_name: socialName,
          phone: '0813-8822-1920',
          full_address: 'Jl. Sudirman No. 88',
          city: 'Jakarta Selatan',
          province: 'DKI Jakarta',
          postal_code: '12190'
        }
      };
      setTimeout(() => {
        onRegisterSuccess(fallbackUser);
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Format alamat email resmi tidak valid.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Nomor handphone / WhatsApp wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (!agreeAge) {
      setErrorMessage('Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi Tusko.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = phone.startsWith('+62') ? phone : `+62${phone.replace(/^0/, '')}`;
      const result = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
        phone: formattedPhone,
        role: 'customer',
      });

      setSuccessMessage(`🎉 ${result.message || 'Akun Berhasil Dibuat!'} Voucher Diskon 15% telah ditambahkan.`);
      setTimeout(() => {
        onRegisterSuccess(result.user);
      }, 500);
    } catch (err) {
      if (err.errors) {
        const firstErr = Object.values(err.errors)[0];
        setErrorMessage(Array.isArray(firstErr) ? firstErr[0] : firstErr);
      } else {
        setErrorMessage(err.message || 'Gagal mendaftarkan akun. Silakan coba beberapa saat lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 text-black antialiased selection:bg-black selection:text-white min-h-screen flex flex-col justify-between">
      {/* 1. Top Announcement Bar */}
      <div className="bg-black text-white text-[11px] font-bold py-2 px-4 text-center tracking-wider uppercase">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <Gift className="text-amber-400 shrink-0" size={15} />
          <span>DAPATKAN VOUCHER DISKON 15% DENGAN MENDAFTAR MEMBER TUSKO CLUB HARI INI</span>
        </div>
      </div>

      {/* 2. Header Navigation */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <button 
            type="button" 
            onClick={onBackToHome}
            className="flex items-center gap-2 group shrink-0 cursor-pointer text-left"
          >
            <div className="w-9 sm:w-11 h-9 sm:h-10 bg-black text-white flex items-center justify-center font-sport font-black text-xl sm:text-2xl tracking-tighter -skew-x-6 group-hover:bg-neutral-800 transition-colors">
              T
            </div>
            <div className="leading-none">
              <span className="font-sport font-black text-xl sm:text-2xl tracking-tight uppercase text-black">
                TUSKO<span className="text-amber-500">.</span>
              </span>
              <span className="block text-[8px] sm:text-[9px] font-bold tracking-widest text-neutral-400 uppercase">
                Performance
              </span>
            </div>
          </button>

          {/* Link to Login */}
          <button 
            type="button"
            onClick={onNavigateLogin}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            <span>Sudah Member? Masuk</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* 3. Main Registration Container */}
      <main className="max-w-lg w-full mx-auto px-4 py-8 sm:py-12 flex-1">
        {/* Member Benefit Highlight Card */}
        <div className="bg-black text-white p-5 sm:p-6 mb-6 border border-neutral-800 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-lg shrink-0 -skew-x-6">
              ★
            </div>
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                PROGRAM KEANGGOTAAN RESMI
              </span>
              <h2 className="font-sport font-black text-base sm:text-lg uppercase tracking-tight text-white leading-tight">
                KEUNTUNGAN MEMBER TUSKO CLUB
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[11px] text-neutral-300 pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>Diskon 15% Pesanan 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>Poin Belanja Seumur Hidup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>Akses Awal Rilis Sepatu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>Gratis Ongkir &amp; Retur 14 Hari</span>
            </div>
          </div>
        </div>

        {/* Registration Form Box */}
        <div className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="font-sport font-black text-2xl sm:text-3xl uppercase italic tracking-tight text-black">
              BUAT AKUN BARU
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Lengkapi data diri Anda dalam waktu kurang dari 1 menit.
            </p>
          </div>

          {/* Quick SSO Buttons */}
          <div className="space-y-2.5 mb-5">
            <button 
              type="button"
              onClick={() => handleSocialRegister('Budi Pratama (Google)', 'budi.pratama@gmail.com')}
              className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.77 14.77 1 12 1 7.39 1 3.52 3.82 1.83 7.85l3.66 2.84C6.38 7.39 8.94 5 12 5z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.86c2.15-1.99 3.74-4.92 3.74-8.68z" />
                <path fill="#FBBC05" d="M5.49 14.69c-.24-.73-.38-1.5-.38-2.31 0-.81.14-1.58.38-2.31L1.83 7.23C.66 9.57 0 12.19 0 15c0 2.81.66 5.43 1.83 7.77l3.66-2.84z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.68-2.86c-1.08.73-2.46 1.16-4.25 1.16-3.06 0-5.62-2.39-6.51-5.69L1.83 15.54C3.52 19.57 7.39 23 12 23z" />
              </svg>
              <span>Daftar Cepat dengan Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSocialRegister('Budi Pratama (Apple)', 'budi.apple@icloud.com')}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.42-.58.68-1.1 1.75-.96 2.79 1.07.08 2.12-.59 2.74-1.34z" />
              </svg>
              <span>Daftar Cepat dengan Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              ATAU DAFTAR DENGAN EMAIL
            </span>
          </div>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label 
                htmlFor="reg-name" 
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                NAMA LENGKAP *
              </label>
              <input 
                type="text" 
                id="reg-name" 
                required 
                placeholder="Contoh: Budi Pratama" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 px-3.5 py-2.5 text-xs text-black font-medium focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label 
                htmlFor="reg-email" 
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                ALAMAT EMAIL RESMI *
              </label>
              <input 
                type="email" 
                id="reg-email" 
                required 
                placeholder="nama@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 px-3.5 py-2.5 text-xs text-black font-medium focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>

            {/* WhatsApp Phone Number */}
            <div>
              <label 
                htmlFor="reg-phone" 
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                NOMOR HANDPHONE / WHATSAPP *
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-100 text-neutral-600 font-bold text-xs">
                  +62
                </span>
                <input 
                  type="tel" 
                  id="reg-phone" 
                  required 
                  placeholder="812-3456-7890" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-3.5 py-2.5 text-xs text-black font-medium focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-neutral-400 mt-1">
                Digunakan untuk pengiriman notifikasi resi dan kode voucher.
              </p>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="reg-password" 
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                KATA SANDI *
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="reg-password" 
                  required 
                  placeholder="Minimal 8 karakter kombinasi huruf & angka" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-300 px-3.5 py-2.5 text-xs text-black font-medium focus:outline-none focus:border-black focus:bg-white transition-colors pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black text-base p-1 cursor-pointer"
                  title={showPassword ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="mt-2 flex items-center gap-1.5">
                <div 
                  className={`h-1 flex-1 transition-colors ${
                    strength.level >= 1 
                      ? strength.level === 1 
                        ? 'bg-red-500' 
                        : strength.level === 2 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                      : 'bg-neutral-200'
                  }`}
                />
                <div 
                  className={`h-1 flex-1 transition-colors ${
                    strength.level >= 2 
                      ? strength.level === 2 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                      : 'bg-neutral-200'
                  }`}
                />
                <div 
                  className={`h-1 flex-1 transition-colors ${
                    strength.level >= 3 ? 'bg-emerald-500' : 'bg-neutral-200'
                  }`}
                />
                <span className={`text-[10px] font-bold ml-1 ${strength.color}`}>
                  Kekuatan: {strength.text}
                </span>
              </div>
            </div>

            {/* Shopping Preferences */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                PREFERENSI KOLEKSI BELANJA
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Pria', 'Wanita', 'Semua'].map((pref) => (
                  <button 
                    key={pref}
                    type="button" 
                    onClick={() => setPreference(pref)}
                    className={`font-bold text-xs py-2 px-1 text-center transition-colors cursor-pointer ${
                      preference === pref 
                        ? 'border-2 border-black bg-black text-white' 
                        : 'border border-neutral-300 hover:border-black bg-white text-neutral-800'
                    }`}
                  >
                    {pref.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes Agreements */}
            <div className="space-y-2.5 pt-2 text-xs text-neutral-600">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={agreeAge} 
                  onChange={(e) => setAgreeAge(e.target.checked)}
                  required 
                  className="accent-black w-4 h-4 rounded-none cursor-pointer shrink-0 mt-0.5"
                />
                <span className="leading-relaxed text-[11px]">
                  Saya berusia di atas 17 tahun dan setuju dengan{' '}
                  <button 
                    type="button" 
                    onClick={() => alert('Syarat & Ketentuan Tusko Performance')}
                    className="underline text-black font-bold cursor-pointer"
                  >
                    Syarat &amp; Ketentuan
                  </button>{' '}
                  serta{' '}
                  <button 
                    type="button" 
                    onClick={() => alert('Kebijakan Privasi Tusko Performance')}
                    className="underline text-black font-bold cursor-pointer"
                  >
                    Kebijakan Privasi
                  </button>{' '}
                  Tusko.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={agreePromo} 
                  onChange={(e) => setAgreePromo(e.target.checked)}
                  className="accent-black w-4 h-4 rounded-none cursor-pointer shrink-0 mt-0.5"
                />
                <span className="leading-relaxed text-[11px]">
                  Kirimkan saya voucher diskon 15% dan info rilis produk terbaru via WhatsApp &amp; Email.
                </span>
              </label>
            </div>

            {/* Action Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 flex items-center justify-between transition-colors shadow-sm mt-3 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>MENDAFTARKAN AKUN...</span>
                  </span>
                  <span className="text-base">&rarr;</span>
                </>
              ) : (
                <>
                  <span>BUAT AKUN TUSKO CLUB</span>
                  <span className="text-base">&rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Auto-fill Demo Button */}
          <div className="mt-5 pt-4 border-t border-neutral-200 flex justify-between items-center">
            <button 
              type="button"
              onClick={handleAutofillDemo} 
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Isi Form Otomatis (Demo)</span>
            </button>
            <span className="text-[10px] text-neutral-400 font-mono">v1.0 Demo</span>
          </div>
        </div>

        {/* Login Link Box */}
        <div className="mt-6 text-center text-xs text-neutral-600 bg-white p-4 border border-neutral-300">
          Sudah memiliki akun terdaftar?{' '}
          <button 
            type="button"
            onClick={onNavigateLogin} 
            className="font-bold text-black underline uppercase ml-1 hover:text-neutral-700 cursor-pointer"
          >
            Masuk di Sini &rarr;
          </button>
        </div>
      </main>

      {/* 4. Minimal Footer */}
      <footer className="bg-white border-t border-neutral-200 py-6 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <div>&copy; 2026 PT Tusko Performance Indonesia. Seluruh hak cipta dilindungi.</div>
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={() => alert('Kebijakan Privasi PT Tusko Performance Indonesia')} 
              className="hover:underline text-neutral-500 hover:text-black cursor-pointer"
            >
              Kebijakan Privasi
            </button>
            <button 
              type="button" 
              onClick={() => alert('Syarat & Ketentuan Akun Member Tusko Club')} 
              className="hover:underline text-neutral-500 hover:text-black cursor-pointer"
            >
              Syarat Ketentuan
            </button>
            <button 
              type="button" 
              onClick={() => alert('Pusat Bantuan CS Tusko: support@tusko.id')} 
              className="hover:underline text-neutral-500 hover:text-black cursor-pointer"
            >
              Bantuan CS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
