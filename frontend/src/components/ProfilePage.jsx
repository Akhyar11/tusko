import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  KeyRound, 
  Camera, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Star, 
  Calendar, 
  Save, 
  Check, 
  Plus,
  Lock,
  Building,
  Home
} from 'lucide-react';
import { mockDemoUsers } from '../data/mockAuthData';

export default function ProfilePage({
  currentUser = null,
  onUpdateProfile = () => {},
  onBack = () => {}
}) {
  // Use currentUser or default to first mock user
  const user = currentUser || mockDemoUsers[0];

  const [activeTab, setActiveTab] = useState('biodata'); // 'biodata' | 'address' | 'security'

  // Biodata Form State
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [gender, setGender] = useState('Laki-laki');
  const [birthDate, setBirthDate] = useState('1996-08-17');
  const [avatar, setAvatar] = useState(user.avatar || '');

  // Address State
  const defaultAddr = user.defaultAddress || {};
  const [recipientName, setRecipientName] = useState(defaultAddr.recipient_name || user.name || '');
  const [recipientPhone, setRecipientPhone] = useState(defaultAddr.phone || user.phone || '');
  const [fullAddress, setFullAddress] = useState(defaultAddr.full_address || 'Jl. Kemang Raya No. 45');
  const [city, setCity] = useState(defaultAddr.city || 'Jakarta Selatan');
  const [province, setProvince] = useState(defaultAddr.province || 'DKI Jakarta');
  const [postalCode, setPostalCode] = useState(defaultAddr.postal_code || '12730');
  const [addressLabel, setAddressLabel] = useState('Rumah');

  // Security Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveBiodata = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const updated = {
        ...user,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar,
      };

      setIsLoading(false);
      setSuccessMessage('Biodata profil berhasil diperbarui!');
      onUpdateProfile(updated);

      setTimeout(() => setSuccessMessage(''), 3500);
    }, 600);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!recipientName.trim() || !fullAddress.trim() || !city.trim()) {
      setErrorMessage('Mohon lengkapi nama penerima, alamat lengkap, dan kota pengiriman.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const updated = {
        ...user,
        defaultAddress: {
          recipient_name: recipientName.trim(),
          phone: recipientPhone.trim(),
          full_address: fullAddress.trim(),
          city: city.trim(),
          province: province.trim(),
          postal_code: postalCode.trim(),
          label: addressLabel
        }
      };

      setIsLoading(false);
      setSuccessMessage('Alamat pengiriman utama berhasil disimpan!');
      onUpdateProfile(updated);

      setTimeout(() => setSuccessMessage(''), 3500);
    }, 600);
  };

  const handleSavePassword = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!oldPassword) {
      setErrorMessage('Kata sandi saat ini wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Kata sandi akun Anda berhasil diperbarui.');

      setTimeout(() => setSuccessMessage(''), 3500);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8">
      {/* Back Button & Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-neutral-600 hover:text-amber-600 transition-colors cursor-pointer group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>
        <span className="text-neutral-400">/</span>
        <span className="text-xs sm:text-sm font-semibold text-neutral-800">Pengaturan Profil & Akun</span>
      </div>

      {/* Header Profile Summary Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-6 shadow-xs mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* Avatar with upload trigger */}
          <div className="relative group shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-amber-500 text-neutral-950 font-black text-3xl flex items-center justify-center shadow-md">
                {name.charAt(0)}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                const sampleAvatars = [
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                ];
                const nextAvatar = sampleAvatars[(sampleAvatars.indexOf(avatar) + 1) % sampleAvatars.length];
                setAvatar(nextAvatar);
              }}
              title="Ganti Foto Profil Demo"
              className="absolute -bottom-2 -right-2 p-2 bg-amber-500 text-neutral-950 rounded-xl shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                {name}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                user.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {user.role === 'admin' ? '🛡️ Super Admin' : '⭐ Gold Member'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 mb-3">{email} &bull; {phone}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-lg">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>Poin Loyalitas: <strong>{user.points || 1250} Poin</strong></span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-100 px-3 py-1 rounded-lg">
                <Calendar size={14} className="text-neutral-500" />
                <span>Bergabung: <strong>{user.joinedDate || 'Januari 2025'}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-neutral-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('biodata')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === 'biodata'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Biodata Diri
        </button>

        <button
          onClick={() => setActiveTab('address')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === 'address'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Daftar Alamat Pengiriman
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors border-b-2 ${
            activeTab === 'security'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Keamanan & Kata Sandi
        </button>
      </div>

      {/* Alert Banners */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle size={18} className="shrink-0 text-rose-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab 1: Biodata Diri */}
      {activeTab === 'biodata' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">
            Informasi Pribadi & Kontak
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Kelola informasi profil Anda untuk mengontrol privasi dan kemudahan transaksi belanja.
          </p>

          <form onSubmit={handleSaveBiodata} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <User size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                  <Calendar size={16} className="absolute left-3.5 top-3 text-neutral-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Jenis Kelamin
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Alamat Email
                </label>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Terverifikasi
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <Mail size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Nomor Handphone (WhatsApp)
                </label>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Terverifikasi
                </span>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <Phone size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Simpan Perubahan Biodata</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Daftar Alamat Pengiriman */}
      {activeTab === 'address' && (
        <div className="space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">
                  Alamat Pengiriman Utama
                </h2>
                <p className="text-xs text-neutral-500">
                  Alamat ini otomatis dipilih saat Anda melakukan checkout pesanan barang.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                <Check size={12} /> Utama
              </span>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Label Alamat
                  </label>
                  <select
                    value={addressLabel}
                    onChange={(e) => setAddressLabel(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value="Rumah">Rumah</option>
                    <option value="Kantor">Kantor</option>
                    <option value="Apartemen">Apartemen</option>
                    <option value="Kos">Kos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Nama Penerima
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Nomor Telepon Penerima
                </label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                  Alamat Lengkap (Jalan, No Rumah, RT/RW, Kelurahan, Kecamatan)
                </label>
                <textarea
                  rows={3}
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black uppercase text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Simpan Alamat Pengiriman</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: Keamanan Akun */}
      {activeTab === 'security' && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 mb-1">
            Ubah Kata Sandi & Keamanan
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Gunakan kombinasi kata sandi yang kuat untuk menjaga keamanan akun dan transaksi belanja Anda.
          </p>

          <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Kata Sandi Saat Ini
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <KeyRound size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                Konfirmasi Kata Sandi Baru
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                />
                <KeyRound size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold uppercase text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                <span>Perbarui Kata Sandi</span>
              </button>
            </div>
          </form>

          {/* 2FA Section */}
          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Verifikasi 2 Langkah (2FA)</span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Kirimkan kode OTP verifikasi ke WhatsApp atau email saat login dari perangkat baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  twoFactorEnabled ? 'bg-amber-500' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
