import React, { useState, useEffect } from 'react';
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
  Home,
  Eye,
  EyeOff,
  Copy,
  Ticket,
  Tag,
  Laptop,
  Smartphone,
  Trash2,
  Edit3,
  X,
  Award,
  ExternalLink,
  Map,
  Navigation,
  LocateFixed
} from 'lucide-react';
import { mockDemoUsers } from '../data/mockAuthData';
import { authService } from '../services/authService';
import { formatRupiah } from '../utils/formatters';
import AddressFormPage from './AddressFormPage';

export default function ProfilePage({
  currentUser = null,
  onUpdateProfile = () => {},
  onBack = () => {}
}) {
  // Gunakan user yang sedang login atau fallback ke demo user
  const [userProfile, setUserProfile] = useState(currentUser || mockDemoUsers[0]);
  const user = userProfile;

  // Tab navigasi aktif: 'biodata' | 'address' | 'security' | 'vouchers'
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const savedTab = localStorage.getItem('tusko_profile_tab');
      if (savedTab && ['biodata', 'address', 'security', 'vouchers'].includes(savedTab)) {
        return savedTab;
      }
    } catch {
      // ignore
    }
    return 'biodata';
  });

  useEffect(() => {
    try {
      localStorage.setItem('tusko_profile_tab', activeTab);
    } catch {
      // ignore
    }
  }, [activeTab]);

  // State Biodata
  const [name, setName] = useState(user.name || 'Budi Pratama');
  const [email, setEmail] = useState(user.email || 'budi.pratama@gmail.com');
  const [phone, setPhone] = useState(user.phone || '0812-3456-7890');
  const [gender, setGender] = useState(user.gender || 'Laki-laki');
  const [birthDate, setBirthDate] = useState(user.birth_date || user.birthDate || '1996-08-17');
  const [avatar, setAvatar] = useState(
    user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
  );

  // State Daftar Alamat Pengiriman
  const [addresses, setAddresses] = useState(() => {
    const defAddr = user.defaultAddress || user.default_address || {};
    return [
      {
        id: 1,
        label: defAddr.label || 'Rumah',
        recipient_name: defAddr.recipient_name || user.name || 'Budi Pratama',
        phone: defAddr.phone || user.phone || '0812-3456-7890',
        full_address: defAddr.full_address || 'Jl. Kemang Raya No. 45, RT 02 / RW 04, Bangka, Mampang Prapatan',
        city: defAddr.city || 'Jakarta Selatan',
        province: defAddr.province || 'DKI Jakarta',
        postal_code: defAddr.postal_code || '12730',
        lat: -6.2615,
        lng: 106.8106,
        is_default: true,
      }
    ];
  });

  // State Kupon & Sesi Login
  const [vouchers, setVouchers] = useState([]);
  const [sessions, setSessions] = useState([]);

  // State Halaman Form Alamat Khusus
  const [isAddressFormPageOpen, setIsAddressFormPageOpen] = useState(false);
  const [selectedAddressToEdit, setSelectedAddressToEdit] = useState(null);

  // State Keamanan & Kata Sandi
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // State Feedback & Toast
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedVoucher, setCopiedVoucher] = useState(null);

  // Fungsi trigger toast melayang
  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Ambil data profil, alamat, voucher, dan sesi aktif dari backend saat komponen dimuat
  useEffect(() => {
    let isMounted = true;

    const fetchAllData = async () => {
      try {
        const [profile, addrs, vchs, sess] = await Promise.allSettled([
          authService.getProfile(),
          authService.getAddresses(),
          authService.getVouchers(),
          authService.getActiveSessions(),
        ]);

        if (!isMounted) return;

        if (profile.status === 'fulfilled' && profile.value) {
          const p = profile.value;
          setUserProfile(p);
          setName(p.name || '');
          setEmail(p.email || '');
          setPhone(p.phone || '');
          if (p.avatar) setAvatar(p.avatar);
          if (p.gender) setGender(p.gender);
          if (p.birth_date || p.birthDate) {
            setBirthDate(p.birth_date || p.birthDate);
          }
        }

        if (addrs.status === 'fulfilled' && Array.isArray(addrs.value) && addrs.value.length > 0) {
          setAddresses(addrs.value);
        }

        if (vchs.status === 'fulfilled' && Array.isArray(vchs.value) && vchs.value.length > 0) {
          setVouchers(vchs.value);
        }

        if (sess.status === 'fulfilled' && Array.isArray(sess.value) && sess.value.length > 0) {
          setSessions(sess.value);
        }
      } catch (err) {
        console.warn('Gagal memuat sinkronisasi backend profil:', err);
      }
    };

    fetchAllData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sinkronisasi data saat user prop dari parent berubah
  useEffect(() => {
    if (currentUser) {
      setUserProfile(currentUser);
      setName(currentUser.name || 'Budi Pratama');
      setEmail(currentUser.email || 'budi.pratama@gmail.com');
      setPhone(currentUser.phone || '0812-3456-7890');
      if (currentUser.avatar) setAvatar(currentUser.avatar);
      if (currentUser.gender) setGender(currentUser.gender);
      if (currentUser.birth_date || currentUser.birthDate) {
        setBirthDate(currentUser.birth_date || currentUser.birthDate);
      }
    }
  }, [currentUser]);

  // Handle Simpan Biodata Pribadi ke Backend API
  const handleSaveBiodata = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Nama lengkap wajib diisi.');
      showToast('Nama lengkap wajib diisi.', 'error');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Alamat email wajib diisi.');
      showToast('Alamat email wajib diisi.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        birthDate,
        avatar,
      };

      const result = await authService.updateProfile(updateData);
      const updated = {
        ...userProfile,
        ...updateData,
        ...(result.user || {})
      };

      setUserProfile(updated);
      setIsLoading(false);
      onUpdateProfile(updated);
      showToast('✓ Biodata profil berhasil diperbarui!');
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || 'Gagal memperbarui profil.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    }
  };

  // Handle Reset Form Biodata
  const handleResetBiodata = () => {
    setName(user.name || 'Budi Pratama');
    setEmail(user.email || 'budi.pratama@gmail.com');
    setPhone(user.phone || '0812-3456-7890');
    setGender('Laki-laki');
    setBirthDate('1996-08-17');
    showToast('Formulir telah dikembalikan ke data awal.');
  };

  // Handle Buka Halaman Tambah Alamat
  const openAddAddressModal = () => {
    setSelectedAddressToEdit(null);
    setIsAddressFormPageOpen(true);
  };

  // Handle Buka Halaman Edit Alamat
  const openEditAddressModal = (addr) => {
    setSelectedAddressToEdit(addr);
    setIsAddressFormPageOpen(true);
  };

  // Handle Simpan Alamat dari Halaman Baru (Terhubung riil ke API Backend)
  const handleSaveAddressFromPage = async (savedAddr) => {
    setIsLoading(true);
    try {
      if (selectedAddressToEdit && selectedAddressToEdit.id) {
        await authService.updateAddress(selectedAddressToEdit.id, savedAddr);
        showToast('✓ Alamat pengiriman berhasil diperbarui!');
      } else {
        await authService.createAddress(savedAddr);
        showToast('✓ Alamat pengiriman baru berhasil ditambahkan!');
      }

      // Muat ulang daftar alamat dan profil dari backend
      const updatedAddrs = await authService.getAddresses();
      if (Array.isArray(updatedAddrs) && updatedAddrs.length > 0) {
        setAddresses(updatedAddrs);
      }
      const refreshedUser = await authService.getProfile();
      if (refreshedUser) {
        setUserProfile(refreshedUser);
        onUpdateProfile(refreshedUser);
      }
    } catch (err) {
      console.error('Gagal menyimpan alamat:', err);
      showToast(err.message || 'Gagal menyimpan alamat ke server.', 'error');
    } finally {
      setIsLoading(false);
      setIsAddressFormPageOpen(false);
      setSelectedAddressToEdit(null);
      setActiveTab('address');
    }
  };

  // Handle Jadikan Alamat Utama ke Backend API
  const handleSetDefaultAddress = async (id) => {
    try {
      await authService.setDefaultAddress(id);
      const updatedAddrs = await authService.getAddresses();
      if (Array.isArray(updatedAddrs) && updatedAddrs.length > 0) {
        setAddresses(updatedAddrs);
      }
      const refreshedUser = await authService.getProfile();
      if (refreshedUser) {
        setUserProfile(refreshedUser);
        onUpdateProfile(refreshedUser);
      }
      showToast('✓ Alamat pengiriman utama berhasil diubah.');
    } catch (err) {
      showToast(err.message || 'Gagal mengubah alamat utama.', 'error');
    }
  };

  // Handle Hapus Alamat dari Backend API
  const handleDeleteAddress = async (id) => {
    if (addresses.length <= 1) {
      showToast('Anda wajib memiliki minimal satu alamat tersimpan.', 'error');
      return;
    }
    try {
      await authService.deleteAddress(id);
      const updatedAddrs = await authService.getAddresses();
      setAddresses(updatedAddrs);
      const refreshedUser = await authService.getProfile();
      if (refreshedUser) {
        setUserProfile(refreshedUser);
        onUpdateProfile(refreshedUser);
      }
      showToast('Alamat pengiriman telah dihapus.');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus alamat.', 'error');
    }
  };

  // Handle Pemutusan Sesi Perangkat
  const handleRevokeSession = async (id) => {
    try {
      await authService.revokeSession(id);
      const updatedSessions = await authService.getActiveSessions();
      setSessions(updatedSessions);
      showToast('Sesi perangkat berhasil dihentikan.');
    } catch (err) {
      showToast(err.message || 'Gagal menghentikan sesi.', 'error');
    }
  };

  // Handle Pemutusan Semua Sesi Perangkat Lain
  const handleRevokeOtherSessions = async () => {
    try {
      await authService.revokeOtherSessions();
      const updatedSessions = await authService.getActiveSessions();
      setSessions(updatedSessions);
      showToast('Semua sesi perangkat lain berhasil diputus.');
    } catch (err) {
      showToast(err.message || 'Gagal memutus sesi lain.', 'error');
    }
  };

  // Handle Simpan Ubah Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!oldPassword) {
      showToast('Kata sandi saat ini wajib diisi.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi baru tidak cocok.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      await authService.updatePassword({
        oldPassword,
        newPassword,
        confirmPassword
      });

      setIsLoading(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('✓ Kata sandi akun Anda berhasil diperbarui!');
    } catch (err) {
      setIsLoading(false);
      const msg = err.message || 'Gagal mengubah kata sandi.';
      showToast(msg, 'error');
    }
  };

  // Handle Salin Voucher
  const handleCopyVoucher = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedVoucher(code);
      showToast(`✓ Kode kupon "${code}" berhasil disalin ke clipboard!`);
      setTimeout(() => setCopiedVoucher(null), 3000);
    } catch {
      showToast(`Kode kupon: ${code}`);
    }
  };

  // Simulasi ganti avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setAvatar(evt.target.result);
          showToast('✓ Foto avatar profil berhasil diperbarui!');
        }
      };
      reader.readAsDataURL(file);
    } else {
      // Rotasi contoh foto profil
      const sampleAvatars = [
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
      ];
      const nextIdx = (sampleAvatars.indexOf(avatar) + 1) % sampleAvatars.length;
      setAvatar(sampleAvatars[nextIdx]);
      showToast('✓ Foto avatar sampel diganti!');
    }
  };

  // Tampilkan halaman khusus tambah/ubah alamat jika sedang dibuka
  if (isAddressFormPageOpen) {
    return (
      <AddressFormPage
        addressToEdit={selectedAddressToEdit}
        defaultRecipientName={name}
        defaultPhone={phone}
        onSaveAddress={handleSaveAddressFromPage}
        onCancel={() => {
          setIsAddressFormPageOpen(false);
          setSelectedAddressToEdit(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-black antialiased selection:bg-black selection:text-white pb-16">
      
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 shadow-2xl flex items-center gap-2.5 text-xs font-bold border ${
            toastType === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-black text-white border-neutral-700'
          }`}>
            {toastType === 'error' ? (
              <AlertCircle size={16} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* 1. MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Breadcrumbs & Back */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
            <button 
              onClick={onBack}
              className="hover:text-black flex items-center gap-1 font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda</span>
            </button>
            <span>/</span>
            <span className="text-black font-bold">Akun Member &amp; Profil</span>
          </div>

          <button
            onClick={onBack}
            className="sm:hidden px-3 py-1 bg-white border border-neutral-300 text-xs font-bold uppercase rounded-none hover:bg-neutral-100"
          >
            Toko
          </button>
        </div>

        {/* 2. ATHLETIC MEMBER BANNER & SUMMARY CARD */}
        <div className="bg-black text-white p-4 sm:p-8 border border-neutral-800 mb-6 sm:mb-8 relative overflow-hidden shadow-xl">
          {/* Background Graphic Accents */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute -right-8 -bottom-10 text-neutral-800 font-sport font-black text-9xl italic select-none pointer-events-none opacity-20">
            TUSKO
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            
            {/* Left: User Avatar & Identity */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <div className="relative group shrink-0">
                <img 
                  src={avatar} 
                  alt={name}
                  className="w-16 h-16 sm:w-20 md:w-24 sm:h-20 md:h-24 object-cover border-2 border-amber-400 shadow-xl"
                />
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-black/90 hover:bg-amber-500 hover:text-black text-white p-1 sm:p-1.5 border border-neutral-700 cursor-pointer transition-colors shadow-md" 
                  title="Ganti Foto Profil"
                >
                  <Camera size={12} className="sm:w-3.5 sm:h-3.5" />
                </label>
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <h1 className="font-sport font-black text-lg sm:text-2xl md:text-3xl tracking-tight uppercase truncate max-w-full">
                    {name}
                  </h1>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 text-[9px] sm:text-[10px] font-sport font-black uppercase tracking-wider border inline-flex items-center gap-1 shrink-0 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                      <Award size={11} className="text-indigo-400" />
                      Super Admin
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400 font-mono mb-1.5 truncate max-w-[260px] sm:max-w-none">
                  ID: #TSK-{user.id || 10842} &bull; {email}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-neutral-300">
                  <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                  <span className="whitespace-nowrap">
                    Poin Loyalitas: <strong className="text-amber-400 font-sport font-black text-xs sm:text-sm whitespace-nowrap">{(userProfile.points ?? userProfile?.stats?.points) ?? 1250} PTS</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Tier Progress Meter */}
            <div className="bg-neutral-900/90 border border-neutral-800 p-3.5 sm:p-5 w-full md:w-80 shrink-0">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-neutral-400 uppercase tracking-wider text-[10px]">Tier Member</span>
                <span className="text-white font-sport font-black tracking-wide uppercase text-xs">
                  {userProfile.membership_tier || userProfile?.stats?.membership_tier || 'Member'}
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2 mb-2 overflow-hidden">
                <div 
                  className="bg-amber-400 h-2 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, ((((userProfile.points ?? userProfile?.stats?.points) || 1250) % 2000) / 2000) * 100))}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-neutral-400 font-mono">
                <span>{(userProfile.points ?? userProfile?.stats?.points) ?? 1250} PTS</span>
                <span>Target: 2.000 PTS</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Tingkatkan terus aktivitas belanja Anda untuk membuka voucher eksklusif dan diskon member.
              </p>
            </div>

          </div>

          {/* Bottom Metrik Grid (Data Riil Backend API) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-neutral-800/80 text-xs">
            <div className="bg-neutral-900/50 p-2 sm:p-2.5 border border-neutral-800/60">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Total Belanja</span>
              <span className="font-sport font-black text-xs sm:text-base text-white truncate block">
                {userProfile?.stats?.total_spent !== undefined ? formatRupiah(userProfile.stats.total_spent) : 'Rp 0'}
              </span>
            </div>
            <div className="bg-neutral-900/50 p-2 sm:p-2.5 border border-neutral-800/60">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Pesanan Selesai</span>
              <span className="font-sport font-black text-xs sm:text-base text-white truncate block">
                {userProfile?.stats?.completed_orders_count !== undefined ? `${userProfile.stats.completed_orders_count} Order` : '0 Order'}
              </span>
            </div>
            <div className="bg-neutral-900/50 p-2 sm:p-2.5 border border-neutral-800/60">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Voucher Aktif</span>
              <span className="font-sport font-black text-xs sm:text-base text-amber-400 truncate block">
                {vouchers.length || userProfile?.stats?.active_vouchers_count || 0} Kupon
              </span>
            </div>
            <div className="bg-neutral-900/50 p-2 sm:p-2.5 border border-neutral-800/60">
              <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-bold block mb-0.5">Alamat Tersimpan</span>
              <span className="font-sport font-black text-xs sm:text-base text-white truncate block">
                {addresses.length} Lokasi
              </span>
            </div>
          </div>
        </div>

        {/* 3. TABS NAVIGATION */}
        <div className="flex border-b border-neutral-200 mb-8 overflow-x-auto no-scrollbar gap-1">
          <button 
            onClick={() => setActiveTab('biodata')}
            className={`px-4 sm:px-6 py-3 font-sport font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'biodata'
                ? 'border-black text-black bg-white shadow-xs'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <User size={15} />
            <span>Biodata Pribadi</span>
          </button>

          <button 
            onClick={() => setActiveTab('address')}
            className={`px-4 sm:px-6 py-3 font-sport font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'address'
                ? 'border-black text-black bg-white shadow-xs'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <MapPin size={15} />
            <span>Buku Alamat ({addresses.length})</span>
          </button>

          <button 
            onClick={() => setActiveTab('security')}
            className={`px-4 sm:px-6 py-3 font-sport font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-black text-black bg-white shadow-xs'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <KeyRound size={15} />
            <span>Keamanan &amp; Kata Sandi</span>
          </button>

          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 sm:px-6 py-3 font-sport font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'vouchers'
                ? 'border-black text-black bg-white shadow-xs'
                : 'border-transparent text-neutral-500 hover:text-black hover:border-neutral-300'
            }`}
          >
            <Ticket size={15} />
            <span>Voucher Diskon ({vouchers.length || userProfile?.stats?.active_vouchers_count || 0})</span>
          </button>
        </div>

        {/* TAB 1: BIODATA PRIBADI */}
        {activeTab === 'biodata' && (
          <div className="bg-white border border-neutral-200 p-4 sm:p-8 shadow-xs">
            <div className="max-w-3xl">
              <div className="border-b border-neutral-200 pb-4 mb-6">
                <h2 className="font-sport font-black text-lg sm:text-xl uppercase tracking-tight text-black">
                  Informasi Data Diri &amp; Kontak
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Perbarui informasi pribadi dan data kontak akun Anda.
                </p>
              </div>

              <form onSubmit={handleSaveBiodata} className="space-y-6">
                
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-300 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-black font-semibold"
                      placeholder="Masukkan nama lengkap..."
                      required
                    />
                    <User size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                  </div>
                </div>

                {/* Email Resmi & Nomor WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Alamat Email <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        <Check size={10} /> Terverifikasi
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-black font-semibold"
                        required
                      />
                      <Mail size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Nomor WhatsApp (+62)
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200">
                        <Check size={10} /> Terhubung
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-black font-semibold"
                        placeholder="0812-xxxx-xxxx"
                      />
                      <Phone size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                    </div>
                  </div>
                </div>

                {/* Gender & Tanggal Lahir */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                      Jenis Kelamin
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setGender('Laki-laki')}
                        className={`py-3 border text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer ${
                          gender === 'Laki-laki'
                            ? 'bg-black text-white border-black'
                            : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        Laki-laki
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('Perempuan')}
                        className={`py-3 border text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer ${
                          gender === 'Perempuan'
                            ? 'bg-black text-white border-black'
                            : 'bg-neutral-50 border-neutral-300 text-neutral-700 hover:border-neutral-400'
                        }`}
                      >
                        Perempuan
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-300 px-4 py-3 pl-10 text-sm focus:outline-none focus:border-black font-semibold"
                      />
                      <Calendar size={16} className="absolute left-3.5 top-3.5 text-neutral-400" />
                    </div>
                  </div>
                </div>

                {/* Tombol Simpan & Reset */}
                <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-3.5 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-400"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>Simpan Perubahan Data</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleResetBiodata}
                    className="px-5 py-3.5 bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-800 font-sport font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Reset Form
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* TAB 2: BUKU ALAMAT PENGIRIMAN */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 p-4 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4 mb-6">
                <div>
                  <h2 className="font-sport font-black text-lg sm:text-xl uppercase tracking-tight text-black">
                    Buku Alamat Pengiriman
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Kelola alamat tujuan pengiriman barang untuk kemudahan proses *checkout*.
                  </p>
                </div>

                <button 
                  onClick={openAddAddressModal}
                  className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
                >
                  <Plus size={16} />
                  <span>Tambah Alamat Baru</span>
                </button>
              </div>

              {/* Grid Daftar Kartu Alamat */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {addresses.map((addr) => (
                  <div 
                    key={addr.id}
                    className={`border p-5 relative transition-all ${
                      addr.is_default 
                        ? 'border-amber-500 bg-amber-50/20 shadow-xs' 
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-sport font-black text-sm uppercase tracking-wide text-black flex items-center gap-1.5">
                          {addr.label === 'Rumah' ? <Home size={15} /> : <Building size={15} />}
                          {addr.label}
                        </span>
                        {addr.is_default && (
                          <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2 py-0.5 tracking-wider">
                            Utama
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => openEditAddressModal(addr)}
                          className="p-1.5 text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Ubah Alamat"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Alamat"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-neutral-700 space-y-1 mb-4 leading-relaxed">
                      <div className="font-bold text-black text-sm">{addr.recipient_name}</div>
                      <div className="text-neutral-500 font-mono text-[11px]">{addr.phone}</div>
                      <div className="pt-1">{addr.full_address}</div>
                      <div className="text-neutral-500 font-semibold">
                        {addr.city}, {addr.province} {addr.postal_code}
                      </div>
                      {addr.lat && addr.lng && (
                        <div className="pt-1.5 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            <MapPin size={10} className="text-emerald-600" />
                            Pinpoint Maps: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-200/80 flex items-center justify-between">
                      {!addr.is_default ? (
                        <button 
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-bold text-neutral-600 hover:text-black uppercase tracking-wider cursor-pointer underline"
                        >
                          Jadikan Alamat Utama
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 size={13} /> Alamat Pengiriman Default
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KEAMANAN & KATA SANDI */}
        {activeTab === 'security' && (
          <div className="bg-white border border-neutral-200 p-4 sm:p-8 shadow-xs">
            <div className="max-w-3xl">
              <div className="border-b border-neutral-200 pb-4 mb-6">
                <h2 className="font-sport font-black text-lg sm:text-xl uppercase tracking-tight text-black">
                  Keamanan Akun &amp; Kata Sandi
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Jaga keamanan akun Anda dengan kata sandi yang kuat dan verifikasi dua langkah.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-5 max-w-lg mb-10">
                
                {/* Kata Sandi Lama */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showOldPassword ? "text" : "password"}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Kata sandi saat ini..."
                      className="w-full bg-neutral-50 border border-neutral-300 pl-9 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-black font-semibold"
                      required
                    />
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer p-1"
                    >
                      {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      className="w-full bg-neutral-50 border border-neutral-300 pl-9 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-black font-semibold"
                      required
                      minLength={6}
                    />
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer p-1"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">Gunakan kombinasi huruf besar, kecil, angka, dan simbol.</p>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                    Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi..."
                      className="w-full bg-neutral-50 border border-neutral-300 pl-9 pr-9 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:border-black font-semibold"
                      required
                    />
                    <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-6 py-3.5 bg-black hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-neutral-400"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Perbarui Kata Sandi</span>
                </button>

              </form>

              {/* 2FA Section */}
              <div className="pt-8 border-t border-neutral-200">
                <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 border border-neutral-200">
                  <div className="space-y-1">
                    <div className="font-sport font-black text-sm uppercase tracking-wide text-black flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-500" />
                      <span>Autentikasi Dua Faktor (2FA)</span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Wajibkan kode verifikasi OTP WhatsApp setiap kali masuk dari browser atau perangkat yang tidak dikenal.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorEnabled(!twoFactorEnabled);
                      showToast(
                        !twoFactorEnabled 
                          ? '✓ 2FA WhatsApp diaktifkan!' 
                          : '2FA dinonaktifkan.'
                      );
                    }}
                    className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer transition-colors duration-200 ease-in-out border-2 border-transparent ${
                      twoFactorEnabled ? 'bg-amber-500' : 'bg-neutral-300'
                    }`}
                  >
                    <span 
                      className={`inline-block h-5 w-5 bg-white transform transition-transform duration-200 ease-in-out ${
                        twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sesi Login Aktif (Sinkronisasi Backend Sanctum) */}
              <div className="pt-8 mt-8 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-sport font-bold text-sm uppercase tracking-wider text-black">
                    Sesi Login Aktif ({sessions.length || 1})
                  </h3>
                  {sessions.length > 1 && (
                    <button
                      type="button"
                      onClick={handleRevokeOtherSessions}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-800 uppercase tracking-wider cursor-pointer"
                    >
                      Putus Sesi Perangkat Lain
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {(sessions.length > 0 ? sessions : [
                    {
                      id: 1,
                      name: 'Chrome di Desktop',
                      device: 'Chrome Browser (Perangkat Ini)',
                      is_current: true,
                      last_used_at: 'Aktif saat ini',
                      created_at: 'Sesi aktif'
                    }
                  ]).map((sess) => {
                    const isMobile = String(sess.device || sess.name || '').toLowerCase().includes('iphone') || 
                                     String(sess.device || sess.name || '').toLowerCase().includes('android') ||
                                     String(sess.device || sess.name || '').toLowerCase().includes('mobile');
                    return (
                      <div key={sess.id} className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {isMobile ? (
                            <Smartphone size={18} className="text-neutral-700 shrink-0" />
                          ) : (
                            <Laptop size={18} className="text-neutral-700 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-black flex items-center gap-2">
                              <span className="truncate">{sess.device || sess.name || 'Web Browser'}</span>
                              {sess.is_current && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase shrink-0">
                                  Perangkat Ini
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500">
                              {sess.last_used_at || 'Aktif Sekarang'} {sess.created_at ? `• Dibuat: ${sess.created_at}` : ''}
                            </div>
                          </div>
                        </div>
                        {!sess.is_current && (
                          <button 
                            type="button"
                            onClick={() => handleRevokeSession(sess.id)}
                            className="text-neutral-500 hover:text-rose-600 font-bold text-[11px] uppercase tracking-wider cursor-pointer shrink-0 ml-2"
                          >
                            Keluar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: KUPON DISKON & VOUCHER MEMBER */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200 p-4 sm:p-8 shadow-xs">
              <div className="border-b border-neutral-200 pb-4 mb-6">
                <h2 className="font-sport font-black text-lg sm:text-xl uppercase tracking-tight text-black">
                  Kupon Diskon &amp; Voucher Eksklusif
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Gunakan kode voucher saat proses pembayaran untuk menikmati potongan harga dan gratis ongkos kirim.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {(vouchers.length > 0 ? vouchers : [
                  {
                    id: 1,
                    code: 'TUSKOVIBES150',
                    title: 'POTONGAN RP 150.000',
                    description: 'Min. belanja Rp 750.000 untuk seluruh koleksi sepatu performa dan jersey atlet.',
                    badge: 'DISKON SPESIAL',
                    expires_at: '2026-12-31'
                  },
                  {
                    id: 2,
                    code: 'TUSKOKILAT',
                    title: 'GRATIS ONGKIR KILAT',
                    description: 'Bebas ongkos kirim s/d Rp 40.000 tanpa minimum pembelanjaan ke seluruh kota besar Indonesia.',
                    badge: 'BEBAS ONGKIR',
                    expires_at: '2026-12-31'
                  },
                  {
                    id: 3,
                    code: 'DOUBLEPTS2026',
                    title: 'DOUBLE PTS REWARD',
                    description: 'Dapatkan 2x lipat poin loyalitas Tusko Club pada setiap transaksi lini sepatu running HyperPace.',
                    badge: 'DOUBLE POIN',
                    expires_at: '2026-12-31'
                  }
                ]).map((vch, index) => {
                  const isBlackTheme = index % 3 === 0;
                  const isAmberTheme = index % 3 === 2;

                  return (
                    <div 
                      key={vch.id || vch.code}
                      className={`border p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group shadow-md transition-transform hover:-translate-y-1 ${
                        isBlackTheme 
                          ? 'border-neutral-800 bg-neutral-950 text-white' 
                          : isAmberTheme 
                          ? 'border-amber-300 bg-amber-500/10 text-neutral-900' 
                          : 'border-neutral-200 bg-neutral-50 text-neutral-900'
                      }`}
                    >
                      <div className={`absolute right-2 -bottom-2 font-sport font-black text-6xl select-none pointer-events-none tracking-tighter ${
                        isBlackTheme ? 'text-white/5' : isAmberTheme ? 'text-amber-500/10' : 'text-black/5'
                      }`}>
                        {String(vch.code || '').slice(0, 4)}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[9px] font-sport font-black uppercase px-2 py-0.5 tracking-wider ${
                            isBlackTheme ? 'bg-amber-400 text-black' : isAmberTheme ? 'bg-amber-500 text-black' : 'bg-neutral-900 text-white'
                          }`}>
                            {vch.badge || 'VOUCHER KHUSUS'}
                          </span>
                          <span className={`text-[10px] font-mono ${isBlackTheme ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {vch.expires_at ? `s/d ${vch.expires_at}` : 'Berlaku Selamanya'}
                          </span>
                        </div>
                        <h3 className={`font-sport font-black text-xl sm:text-2xl uppercase tracking-tight mb-1 ${
                          isBlackTheme ? 'text-white' : 'text-black'
                        }`}>
                          {vch.title}
                        </h3>
                        <p className={`text-xs leading-relaxed mb-4 ${
                          isBlackTheme ? 'text-neutral-400' : 'text-neutral-600'
                        }`}>
                          {vch.description}
                        </p>
                      </div>

                      <div className={`pt-3.5 border-t flex items-center justify-between gap-3 relative z-10 ${
                        isBlackTheme ? 'border-neutral-800' : isAmberTheme ? 'border-amber-300/60' : 'border-neutral-200'
                      }`}>
                        <div className="min-w-0 flex-1">
                          <span className={`text-[9px] uppercase font-bold tracking-wider block ${
                            isBlackTheme ? 'text-neutral-400' : 'text-neutral-500'
                          }`}>
                            Kode Kupon
                          </span>
                          <span className={`font-mono font-bold text-xs sm:text-sm tracking-wide truncate block ${
                            isBlackTheme ? 'text-amber-400' : 'text-black'
                          }`}>
                            {vch.code}
                          </span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleCopyVoucher(vch.code)}
                          className={`shrink-0 px-3 py-1.5 font-sport font-black text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                            copiedVoucher === vch.code
                              ? 'bg-emerald-500 text-black'
                              : isBlackTheme
                              ? 'bg-white text-black hover:bg-neutral-200'
                              : 'bg-black text-white hover:bg-neutral-800'
                          }`}
                        >
                          {copiedVoucher === vch.code ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedVoucher === vch.code ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
