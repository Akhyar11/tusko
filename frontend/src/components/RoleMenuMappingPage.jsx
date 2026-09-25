import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  ShieldCheck,
  LayoutGrid,
  CheckSquare,
  Square,
  Lock,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { roleService } from '../services/roleService';

/**
 * RoleMenuMappingPage — halaman terpisah matriks Role → Menu (T24.6).
 * Role-centric: pilih role, centang menu yang boleh diakses, simpan ke pivot `role_menus`.
 */
export default function RoleMenuMappingPage({
  initialRole = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [roleId, setRoleId] = useState(initialRole?.id ? String(initialRole.id) : '');
  const [roleMeta, setRoleMeta] = useState(initialRole || null);
  const [menus, setMenus] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRoleOptions = useCallback(async (query = '', page = 1) => {
    if (page > 1) return { options: [], hasMore: false };
    const res = await roleService.fetchRoles({ all: 1 });
    let options = (res.data || []).map((role) => ({ value: String(role.id), label: role.display_name || role.name }));
    const q = query.trim().toLowerCase();
    if (q) options = options.filter((opt) => opt.label.toLowerCase().includes(q));
    return { options, hasMore: false };
  }, []);

  const loadMatrix = useCallback(async (id) => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await roleService.getRoleMenus(id);
      setRoleMeta(data?.role || null);
      setMenus((data?.menus || []).filter((menu) => menu.environment === 'admin'));
      setSelectedIds((data?.menu_ids || []).map(Number));
    } catch (err) {
      setErrorMessage(err.message || 'Gagal memuat matriks menu role.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roleId) loadMatrix(roleId);
  }, [roleId, loadMatrix]);

  const sections = useMemo(() => {
    const grouped = new Map();
    menus.forEach((menu) => {
      const key = menu.section || 'Lainnya';
      if (!grouped.has(key)) grouped.set(key, { title: key, items: [] });
      grouped.get(key).items.push(menu);
    });
    return Array.from(grouped.values());
  }, [menus]);

  const isChecked = (id) => selectedIds.includes(Number(id));

  const toggleMenu = (id) => {
    const numeric = Number(id);
    setSelectedIds((prev) => (prev.includes(numeric) ? prev.filter((x) => x !== numeric) : [...prev, numeric]));
  };

  const toggleSection = (items) => {
    const ids = items.map((m) => Number(m.id));
    const allChecked = ids.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) => {
      if (allChecked) return prev.filter((id) => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const allChecked = menus.length > 0 && menus.every((m) => isChecked(m.id));

  const toggleAll = () => {
    setSelectedIds(allChecked ? [] : menus.map((m) => Number(m.id)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleId) {
      setErrorMessage('Pilih role terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await roleService.syncRoleMenus(roleId, selectedIds);
      onShowToast(`Akses menu role "${roleMeta?.display_name || roleId}" berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal menyimpan akses menu role.');
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
            Role &rarr; Menu Mapping
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('role-menu-form')?.requestSubmit()}
            title="Simpan Akses Menu"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="role-menu-form" onSubmit={handleSubmit} className="space-y-5">
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
                <ShieldCheck size={16} className="text-amber-500" />
                <span>1. Pilih Role</span>
              </h2>
              <div className="mt-4">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Role <span className="text-rose-500">*</span>
                </label>
                <ServerSideSelect
                  loadOptions={loadRoleOptions}
                  value={roleId}
                  onChange={(val) => setRoleId(val)}
                  placeholder="Pilih role yang akan diatur..."
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid size={16} className="text-amber-500" />
                  <span>2. Matriks Akses Menu (Admin)</span>
                </h2>
                {menus.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="text-[11px] font-sport font-bold uppercase text-amber-700 hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    {allChecked ? <Square size={13} /> : <CheckSquare size={13} />}
                    <span>{allChecked ? 'Kosongkan Semua' : 'Pilih Semua'}</span>
                  </button>
                )}
              </div>

              {!roleId ? (
                <p className="mt-4 text-xs text-neutral-500">Pilih role untuk menampilkan matriks menu.</p>
              ) : isLoading ? (
                <p className="mt-4 text-xs text-neutral-500">Memuat matriks menu...</p>
              ) : menus.length === 0 ? (
                <p className="mt-4 text-xs text-neutral-500">Tidak ada menu admin yang tersedia.</p>
              ) : (
                <div className="mt-4 space-y-5">
                  {sections.map((section) => {
                    const sectionChecked = section.items.every((m) => isChecked(m.id));
                    return (
                      <div key={section.title} className="border border-neutral-200 rounded-none">
                        <button
                          type="button"
                          onClick={() => toggleSection(section.items)}
                          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200 text-left cursor-pointer"
                        >
                          <span className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-800">
                            {section.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-neutral-500">
                            {sectionChecked ? 'SEMUA' : `${section.items.filter((m) => isChecked(m.id)).length}/${section.items.length}`}
                          </span>
                        </button>
                        <div className="divide-y divide-neutral-100">
                          {section.items.map((menu) => (
                            <label
                              key={menu.id}
                              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-neutral-50 transition-colors"
                            >
                              <Checkbox checked={isChecked(menu.id)} onChange={() => toggleMenu(menu.id)} />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-sport font-bold uppercase tracking-wide text-neutral-900">
                                  {menu.label}
                                </div>
                                <div className="text-[10px] font-mono text-neutral-500">{menu.path_prefix}</div>
                              </div>
                              {!menu.is_active && (
                                <span className="text-[9px] font-sport font-black uppercase text-neutral-400 border border-neutral-200 px-1.5 py-0.5">
                                  Nonaktif
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || !roleId}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : `Simpan Akses Menu (${selectedIds.length} dipilih)`}</span>
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
          title="Panduan Mapping"
          tips={[
            { icon: ShieldCheck, heading: 'Role-centric', text: 'Pilih satu role lalu centang menu admin yang boleh diakses role tersebut (user → role → menu).' },
            { icon: LayoutGrid, heading: 'Grup Section', text: 'Menu dikelompokkan per section. Klik judul section untuk memilih/melepas semua menu di dalamnya.' },
            { icon: Lock, heading: 'Anti-Lockout', text: 'Menu inti RBAC (Master Users, Master Role, Master Menu, Mapping) tidak dapat dicabut dari role admin.' },
            { icon: Info, heading: 'Storefront', text: 'Menu storefront bersifat publik (tanpa role), sehingga tidak termasuk dalam matriks ini.' }
          ]}
        />
      </div>
    </div>
  );
}
