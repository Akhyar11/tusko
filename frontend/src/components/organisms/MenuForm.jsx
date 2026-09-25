import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Settings,
  Route,
  LayoutGrid,
  ShieldCheck,
  Info
} from 'lucide-react';
import IconButton from '../atoms/IconButton';
import TextInput from '../molecules/TextInput';
import Checkbox from '../molecules/Checkbox';
import ServerSideSelect from '../molecules/ServerSideSelect';
import FormTipsPanel from './FormTipsPanel';
import { menuService } from '../../services/menuService';

const EMPTY_FORM = {
  environment: 'admin',
  label: '',
  sublabel: '',
  section: '',
  path_prefix: '/admin/',
  view_key: '',
  icon: '',
  feature_flag: '',
  sort_order: 10,
  is_active: true,
  role_ids: []
};

const environmentOptions = [
  { value: 'admin', label: 'Admin ERP (butuh role)' },
  { value: 'storefront', label: 'Storefront Publik' }
];

/**
 * Organism: MenuForm — form kanonis Create/Edit menu (aturan 23/24/25).
 * Dipakai oleh MenuCreatePage & MenuEditPage agar bebas duplikasi.
 */
export default function MenuForm({
  mode = 'create',
  initialMenu = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [formData, setFormData] = useState(() => {
    if (!initialMenu) return { ...EMPTY_FORM };
    return {
      environment: initialMenu.environment || 'admin',
      label: initialMenu.label || '',
      sublabel: initialMenu.sublabel || '',
      section: initialMenu.section || '',
      path_prefix: initialMenu.path_prefix || '',
      view_key: initialMenu.view_key || '',
      icon: initialMenu.icon || '',
      feature_flag: initialMenu.feature_flag || '',
      sort_order: initialMenu.sort_order ?? 10,
      is_active: initialMenu.is_active !== undefined ? Boolean(initialMenu.is_active) : true,
      role_ids: Array.isArray(initialMenu.role_ids) ? initialMenu.role_ids.map(String) : []
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRoleOptions = useCallback(async (query = '', page = 1) => {
    if (page > 1) return { options: [], hasMore: false };
    const roles = await menuService.fetchRoleOptions();
    let options = roles.map((role) => ({ value: String(role.id), label: role.display_name || role.name }));
    const q = query.trim().toLowerCase();
    if (q) options = options.filter((opt) => opt.label.toLowerCase().includes(q));
    return { options, hasMore: false };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.label.trim()) {
      setErrorMessage('Label menu wajib diisi.');
      return;
    }
    if (!formData.path_prefix.trim().startsWith('/')) {
      setErrorMessage('Path prefix wajib diawali dengan tanda "/".');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const payload = {
      environment: formData.environment,
      label: formData.label.trim(),
      sublabel: formData.sublabel.trim() || null,
      section: formData.section.trim() || null,
      path_prefix: formData.path_prefix.trim(),
      view_key: formData.view_key.trim() || null,
      icon: formData.icon.trim() || null,
      feature_flag: formData.feature_flag.trim() || null,
      sort_order: Number(formData.sort_order) || 0,
      is_active: Boolean(formData.is_active),
      role_ids: formData.environment === 'admin' ? formData.role_ids.map(Number) : []
    };

    try {
      if (mode === 'edit' && initialMenu) {
        await menuService.updateMenu(initialMenu.id, payload);
        onShowToast(`Menu "${payload.label}" berhasil diperbarui.`);
      } else {
        await menuService.createMenu(payload);
        onShowToast(`Menu "${payload.label}" berhasil ditambahkan.`);
      }
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal menyimpan data menu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdminEnv = formData.environment === 'admin';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton
            icon={ArrowLeft}
            onClick={onNavigateBack}
            title="Kembali ke Master Menu"
            variant="outline"
          />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            {mode === 'edit' ? 'Ubah Menu Navigasi' : 'Tambah Menu Navigasi'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('menu-form')?.requestSubmit()}
            title="Simpan Menu"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="menu-form" onSubmit={handleSubmit} className="space-y-5">
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
                <LayoutGrid size={16} className="text-amber-500" />
                <span>1. Identitas &amp; Pengelompokan Menu</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Environment <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    options={environmentOptions}
                    value={formData.environment}
                    onChange={(val) => setFormData((p) => ({ ...p, environment: val }))}
                    placeholder="Pilih environment menu..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Section / Grup <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    value={formData.section}
                    onChange={(val) => setFormData((p) => ({ ...p, section: val }))}
                    placeholder="Keuangan & Sistem"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Label Menu <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.label}
                    onChange={(val) => setFormData((p) => ({ ...p, label: val }))}
                    placeholder="Kelola Menu & Akses"
                    weight="bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Sublabel
                  </label>
                  <TextInput
                    value={formData.sublabel}
                    onChange={(val) => setFormData((p) => ({ ...p, sublabel: val }))}
                    placeholder="Navigasi DB & akses per-role"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Route size={16} className="text-amber-500" />
                <span>2. Rute &amp; Identitas Tampilan</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Path Prefix <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    required
                    value={formData.path_prefix}
                    onChange={(val) => setFormData((p) => ({ ...p, path_prefix: val }))}
                    placeholder="/admin/menus"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    View Key
                  </label>
                  <TextInput
                    value={formData.view_key}
                    onChange={(val) => setFormData((p) => ({ ...p, view_key: val }))}
                    placeholder="menus-admin"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Ikon (Lucide)
                  </label>
                  <TextInput
                    value={formData.icon}
                    onChange={(val) => setFormData((p) => ({ ...p, icon: val }))}
                    placeholder="Menu / Settings / Package"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Feature Flag
                  </label>
                  <TextInput
                    value={formData.feature_flag}
                    onChange={(val) => setFormData((p) => ({ ...p, feature_flag: val }))}
                    placeholder="feature_flags.orders_menu"
                    weight="mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Urutan Tampil (Sort Order)
                  </label>
                  <TextInput
                    type="number"
                    min={0}
                    value={formData.sort_order}
                    onChange={(val) => setFormData((p) => ({ ...p, sort_order: val }))}
                    placeholder="10"
                    weight="mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <ShieldCheck size={16} className="text-amber-500" />
                <span>3. Akses Role &amp; Status</span>
              </h2>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Role yang Diberi Akses
                  </label>
                  <ServerSideSelect
                    isMulti
                    isClearable
                    loadOptions={loadRoleOptions}
                    value={formData.role_ids}
                    onChange={(vals) => setFormData((p) => ({ ...p, role_ids: vals.map(String) }))}
                    placeholder={isAdminEnv ? 'Pilih role pemilik menu...' : 'Storefront publik (tanpa role)'}
                    disabled={!isAdminEnv}
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 rounded-none hover:bg-neutral-100 transition-colors">
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(val) => setFormData((p) => ({ ...p, is_active: val }))}
                  />
                  <div>
                    <span className="font-sport font-bold uppercase text-xs text-neutral-900 block leading-tight">
                      Menu Aktif Tampil di Navigasi
                    </span>
                    <span className="text-[11px] text-neutral-500 block mt-0.5">
                      Menu nonaktif tidak akan muncul pada sidebar/nav dan tidak memberi akses halaman.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : (mode === 'edit' ? 'Perbarui Menu' : 'Simpan Menu')}</span>
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
          title="Panduan Master Menu"
          tips={[
            { icon: LayoutGrid, heading: 'Environment', text: 'Pilih Admin ERP untuk halaman admin (butuh role), atau Storefront Publik untuk navigasi toko tanpa login.' },
            { icon: Route, heading: 'Path Prefix', text: 'Gunakan awalan path halaman, mis. /admin/product. Akses ke sub-path seperti /admin/product/create otomatis ikut diizinkan.' },
            { icon: ShieldCheck, heading: 'Akses Role', text: 'Menu admin hanya muncul untuk role yang dicentang. Assign seluruh menu ke role admin sebagai superuser.' },
            { icon: Settings, heading: 'View Key', text: 'Cocokkan view key dengan kunci halaman di App.jsx (mis. products-admin) agar penyorotan menu aktif tepat.' },
            { icon: Info, heading: 'Feature Flag', text: 'Isi kunci feature flag (mis. feature_flags.orders_menu) bila menu ingin dapat disembunyikan dari Pengaturan Sistem.' }
          ]}
        />
      </div>
    </div>
  );
}
