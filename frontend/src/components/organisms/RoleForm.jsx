import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Lock,
  Info
} from 'lucide-react';
import IconButton from '../atoms/IconButton';
import TextInput from '../molecules/TextInput';
import TextArea from '../molecules/TextArea';
import FormTipsPanel from './FormTipsPanel';
import { roleService } from '../../services/roleService';

/**
 * Organism: RoleForm — form kanonis Create/Edit Master Role (aturan 23/24/25).
 */
export default function RoleForm({
  mode = 'create',
  initialRole = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const isSystem = Boolean(initialRole?.is_system);
  const [formData, setFormData] = useState({
    name: initialRole?.name || '',
    display_name: initialRole?.display_name || '',
    description: initialRole?.description || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.display_name.trim()) {
      setErrorMessage('Nama role dan nama tampilan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      display_name: formData.display_name.trim(),
      description: formData.description.trim() || null
    };

    try {
      if (mode === 'edit' && initialRole) {
        await roleService.updateRole(initialRole.id, payload);
        onShowToast(`Role "${payload.display_name}" berhasil diperbarui.`);
      } else {
        await roleService.createRole(payload);
        onShowToast(`Role "${payload.display_name}" berhasil ditambahkan.`);
      }
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal menyimpan data role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Master Role" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            {mode === 'edit' ? 'Ubah Role' : 'Tambah Role Baru'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('role-form')?.requestSubmit()}
            title="Simpan Role"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="role-form" onSubmit={handleSubmit} className="space-y-5">
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

            {isSystem && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-none flex items-start gap-2">
                <Lock size={15} className="shrink-0 mt-0.5 text-amber-600" />
                <div className="text-[11px] leading-relaxed">
                  Ini <strong>role sistem</strong>: nama role (key) terkunci dan role tidak dapat dihapus.
                  Anda masih dapat mengubah nama tampilan dan deskripsi.
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <ShieldCheck size={16} className="text-amber-500" />
                <span>Identitas Role</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Role (key) <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    disabled={isSystem}
                    value={formData.name}
                    onChange={(val) => setFormData((p) => ({ ...p, name: val }))}
                    placeholder="warehouse_staff"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Tampilan <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.display_name}
                    onChange={(val) => setFormData((p) => ({ ...p, display_name: val }))}
                    placeholder="Staf Gudang"
                    weight="bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <KeyRound size={16} className="text-amber-500" />
                <span>Deskripsi Peran</span>
              </h2>
              <div className="mt-4">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Deskripsi
                </label>
                <TextArea
                  rows={3}
                  value={formData.description}
                  onChange={(val) => setFormData((p) => ({ ...p, description: val }))}
                  placeholder="Pengelolaan stok, penerimaan barang, dan pemrosesan kiriman."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Role' : 'Simpan Role')}</span>
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
          title="Panduan Role"
          tips={[
            { icon: KeyRound, heading: 'Nama Role (key)', text: 'Gunakan huruf kecil, angka, dan garis bawah (contoh: warehouse_staff). Key dipakai sistem untuk mencocokkan akses.' },
            { icon: ShieldCheck, heading: 'Nama Tampilan', text: 'Nama ramah pengguna yang tampil di UI (contoh: Staf Gudang).' },
            { icon: Lock, heading: 'Role Sistem', text: 'Role bawaan (admin/customer/warehouse_staff/finance_officer) terkunci key-nya dan tidak dapat dihapus.' },
            { icon: Info, heading: 'Akses Menu', text: 'Setelah role dibuat, atur menu yang boleh diakses role ini (Role → Menu Mapping).' }
          ]}
        />
      </div>
    </div>
  );
}
