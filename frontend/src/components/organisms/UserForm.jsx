import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Info
} from 'lucide-react';
import IconButton from '../atoms/IconButton';
import TextInput from '../molecules/TextInput';
import Checkbox from '../molecules/Checkbox';
import ServerSideSelect from '../molecules/ServerSideSelect';
import FormTipsPanel from './FormTipsPanel';
import { userService } from '../../services/userService';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  gender: '',
  birth_date: '',
  is_active: true
};

const genderOptions = [
  { value: 'male', label: 'Laki-laki' },
  { value: 'female', label: 'Perempuan' },
  { value: 'other', label: 'Lainnya' }
];

/**
 * Organism: UserForm — form kanonis Create/Edit pengguna (aturan 23/24/25).
 */
export default function UserForm({
  mode = 'create',
  initialUser = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState(() => ({
    name: initialUser?.name || '',
    email: initialUser?.email || '',
    phone: initialUser?.phone || '',
    password: '',
    gender: initialUser?.gender || '',
    birth_date: initialUser?.birth_date ? String(initialUser.birth_date).slice(0, 10) : '',
    is_active: initialUser?.is_active !== undefined ? Boolean(initialUser.is_active) : true
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage('Nama lengkap dan alamat email wajib diisi.');
      return;
    }
    if (mode === 'create' && formData.password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      gender: formData.gender || null,
      birth_date: formData.birth_date || null,
      is_active: Boolean(formData.is_active)
    };
    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (mode === 'edit' && initialUser) {
        await userService.updateUser(initialUser.id, payload);
        onShowToast(`Akun "${payload.name}" berhasil diperbarui.`);
      } else {
        await userService.createUser(payload);
        onShowToast(`Akun "${payload.name}" berhasil ditambahkan.`);
      }
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Master Users" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            {mode === 'edit' ? 'Ubah Akun Pengguna' : 'Tambah Akun Pengguna'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('user-form')?.requestSubmit()}
            title="Simpan Akun"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3"
                  aria-label="Tutup pesan error"
                >
                  ✕
                </button>
              </div>
            )}

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <UserRound size={16} className="text-amber-500" />
                <span>1. Identitas Akun</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.name}
                    onChange={(val) => setFormData((p) => ({ ...p, name: val }))}
                    placeholder="Budi Pratama"
                    weight="bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    type="email"
                    value={formData.email}
                    onChange={(val) => setFormData((p) => ({ ...p, email: val }))}
                    placeholder="nama@email.com"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nomor Telepon
                  </label>
                  <TextInput
                    value={formData.phone}
                    onChange={(val) => setFormData((p) => ({ ...p, phone: val }))}
                    placeholder="0812xxxxxxx"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    {mode === 'edit' ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'} {mode === 'create' && <span className="text-rose-500">*</span>}
                  </label>
                  <TextInput
                    type="password"
                    value={formData.password}
                    onChange={(val) => setFormData((p) => ({ ...p, password: val }))}
                    placeholder={mode === 'edit' ? 'Biarkan kosong bila tidak diubah' : 'Minimal 6 karakter'}
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Phone size={16} className="text-amber-500" />
                <span>2. Profil &amp; Status</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Jenis Kelamin
                  </label>
                  <ServerSideSelect
                    options={genderOptions}
                    value={formData.gender}
                    onChange={(val) => setFormData((p) => ({ ...p, gender: val }))}
                    placeholder="Pilih jenis kelamin..."
                    isClearable
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Tanggal Lahir
                  </label>
                  <TextInput
                    type="date"
                    value={formData.birth_date}
                    onChange={(val) => setFormData((p) => ({ ...p, birth_date: val }))}
                    weight="mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors mt-4">
                <Checkbox
                  checked={formData.is_active}
                  onChange={(val) => setFormData((p) => ({ ...p, is_active: val }))}
                />
                <div>
                  <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                    Akun Aktif Dapat Masuk Sistem
                  </span>
                  <span className="text-[11px] text-neutral-500 block mt-0.5">
                    Akun nonaktif ditolak saat login hingga diaktifkan kembali oleh admin.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Akun' : 'Simpan Akun')}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateBack}
                disabled={isSubmitting}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Akun Pengguna"
          tips={[
            { icon: Mail, heading: 'Email Unik', text: 'Email dipakai untuk login dan wajib unik di seluruh akun. Gunakan format email yang valid.' },
            { icon: ShieldCheck, heading: 'Akses Role', text: 'Assign role dilakukan lewat aksi "Assign Role" di daftar users (user → role → menu), terpisah dari form akun.' },
            { icon: UserRound, heading: 'Kata Sandi', text: 'Saat membuat akun, kata sandi minimal 6 karakter. Saat mengubah, biarkan kosong bila tidak ingin mengganti.' },
            { icon: Info, heading: 'Status Akun', text: 'Akun nonaktif tidak dapat login. Admin tidak dapat menonaktifkan/menghapus akunnya sendiri.' }
          ]}
        />
      </div>
    </div>
  );
}
