import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Info, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { mockDemoUsers } from '../data/mockAuthData';
import { authService } from '../services/authService';

export default function LoginPage({
  onLoginSuccess = () => {},
  onNavigateRegister = () => {},
  onBackToHome = () => {},
}) {
  const [email, setEmail] = useState('budi.pratama@gmail.com');
  const [password, setPassword] = useState('TuskoSport2026!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleQuickFill = (userType) => {
    if (userType === 'customer') {
      setEmail('budi.pratama@gmail.com');
      setPassword('TuskoSport2026!');
      setErrorMessage('');
    } else if (userType === 'admin') {
      setEmail('admin@tusko.com');
      setPassword('admin123');
      setErrorMessage('');
    }
  };

  const handleSocialLogin = async (socialEmail, provider) => {
    setIsLoading(true);
    setErrorMessage('');
    setEmail(socialEmail);
    setSuccessMessage(`✓ Berhasil terautentikasi melalui ${provider}! Mengalihkan...`);

    try {
      const pwd = socialEmail.includes('apple') ? 'password123' : 'TuskoSport2026!';
      const res = await authService.login(socialEmail, pwd);
      setTimeout(() => {
        onLoginSuccess(res.user);
      }, 500);
    } catch {
      const matchedUser = mockDemoUsers.find(
        (u) => u.email.toLowerCase() === socialEmail.toLowerCase()
      ) || mockDemoUsers[0];
      setTimeout(() => {
        onLoginSuccess({
          ...matchedUser,
          email: socialEmail
        });
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Alamat email atau nomor WhatsApp wajib diisi.');
      return;
    }

    if (!password) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login(email, password);
      const isAdmin = result.user?.role === 'admin';
      setSuccessMessage(`✓ ${result.message || 'Login Berhasil!'} Selamat datang kembali, ${result.user?.name}${isAdmin ? ' (Mengalihkan ke /admin/dashboard...)' : ''}`);
      setTimeout(() => {
        onLoginSuccess(result.user);
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || 'Email atau kata sandi yang Anda masukkan tidak valid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 text-black antialiased selection:bg-black selection:text-white min-h-screen flex flex-col justify-between">
      {/* 1. Top Announcement Bar */}
      <div className="bg-black text-white text-[11px] font-bold py-2 px-4 text-center tracking-wider uppercase">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <ShieldCheck className="text-amber-400 shrink-0" size={15} />
          <span>LOGIN RESMI MEMBER TUSKO CLUB &bull; DISKON 15% UNTUK AKUN BARU</span>
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

          {/* Back to Store Link */}
          <button 
            type="button"
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-black uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Toko</span>
          </button>
        </div>
      </header>

      {/* 3. Main Login Form Container */}
      <main className="max-w-md w-full mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white border border-neutral-300 p-6 sm:p-8 shadow-sm">
          {/* Heading & Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 mb-2.5 -skew-x-6">
              <span className="text-amber-400 font-black">★</span> TUSKO CLUB MEMBER
            </span>
            <h1 className="font-sport font-black text-2xl sm:text-3xl uppercase italic tracking-tight text-black">
              MASUK KE AKUN ANDA
            </h1>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Nikmati akses instan ke riwayat transaksi, poin loyalitas, serta promo khusus member.
            </p>
          </div>

          {/* Social Logins (Google & Apple SSO) */}
          <div className="space-y-2.5 mb-5">
            <button 
              type="button"
              onClick={() => handleSocialLogin('budi.pratama@gmail.com', 'Google SSO')}
              className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.54 0 2.93.56 4.02 1.48l3.01-3.01C17.21 1.77 14.77 1 12 1 7.39 1 3.52 3.82 1.83 7.85l3.66 2.84C6.38 7.39 8.94 5 12 5z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.68 2.86c2.15-1.99 3.74-4.92 3.74-8.68z" />
                <path fill="#FBBC05" d="M5.49 14.69c-.24-.73-.38-1.5-.38-2.31 0-.81.14-1.58.38-2.31L1.83 7.23C.66 9.57 0 12.19 0 15c0 2.81.66 5.43 1.83 7.77l3.66-2.84z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.68-2.86c-1.08.73-2.46 1.16-4.25 1.16-3.06 0-5.62-2.39-6.51-5.69L1.83 15.54C3.52 19.57 7.39 23 12 23z" />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleSocialLogin('budi.apple@icloud.com', 'Apple ID')}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs py-2.5 px-4 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.42-.58.68-1.1 1.75-.96 2.79 1.07.08 2.12-.59 2.74-1.34z" />
              </svg>
              <span>Masuk dengan Apple</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              ATAU DENGAN EMAIL
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

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="login-email" 
                className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1"
              >
                ALAMAT EMAIL / NO. WHATSAPP *
              </label>
              <input 
                type="text" 
                id="login-email" 
                required 
                placeholder="nama@email.com atau 0812xxxx" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 px-3.5 py-2.5 text-xs text-black font-medium focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label 
                  htmlFor="login-password" 
                  className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
                >
                  KATA SANDI *
                </label>
                <button 
                  type="button" 
                  onClick={() => alert('Tautan pemulihan kata sandi telah dikirimkan ke email terdaftar Anda.')}
                  className="text-[11px] font-bold text-neutral-500 hover:text-black underline cursor-pointer"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="login-password" 
                  required 
                  placeholder="••••••••" 
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
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 select-none">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-black w-4 h-4 rounded-none cursor-pointer"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-sport font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 px-6 flex items-center justify-between transition-colors shadow-sm mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>MEMVERIFIKASI...</span>
                  </span>
                  <span className="text-base">&rarr;</span>
                </>
              ) : (
                <>
                  <span>MASUK SEKARANG</span>
                  <span className="text-base">&rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Helper Badge */}
          <div className="mt-5 p-3 bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Info size={14} className="text-amber-600 shrink-0" />
              <span>Mode Uji Coba Prototipe:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
              Klik tombol <em>Masuk Sekarang</em> di atas untuk simulasi login instan dengan akun demo member.
            </p>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/60">
              <button 
                type="button" 
                onClick={() => handleQuickFill('customer')} 
                className="px-2 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-[10px] uppercase rounded-none cursor-pointer"
              >
                Isi Akun Pembeli (Budi)
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickFill('admin')} 
                className="px-2 py-1 bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-bold text-[10px] uppercase rounded-none cursor-pointer"
              >
                Isi Akun Admin (Akhyar)
              </button>
            </div>
          </div>
        </div>

        {/* Registration CTA Box */}
        <div className="mt-6 bg-black text-white p-5 sm:p-6 border border-neutral-800 text-center space-y-3">
          <div className="w-8 h-8 bg-amber-500 text-black flex items-center justify-center font-sport font-black text-base mx-auto -skew-x-6">
            ★
          </div>
          <div>
            <h3 className="font-sport font-black text-base uppercase tracking-wide text-white">
              BELUM MEMILIKI AKUN?
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Gabung Tusko Club gratis. Dapatkan <span className="text-amber-400 font-bold">voucher diskon 15%</span> untuk pesanan perdana Anda.
            </p>
          </div>
          <button 
            type="button"
            onClick={onNavigateRegister}
            className="inline-block w-full sm:w-auto bg-white hover:bg-neutral-200 text-black font-sport font-bold text-xs uppercase tracking-wider py-3 px-6 transition-colors cursor-pointer"
          >
            DAFTAR MEMBER GRATIS &rarr;
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
              Syarat Ketentuan Akun
            </button>
            <button 
              type="button" 
              onClick={() => alert('Pusat Bantuan Tusko Support: support@tusko.id')} 
              className="hover:underline text-neutral-500 hover:text-black cursor-pointer"
            >
              Bantuan
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
