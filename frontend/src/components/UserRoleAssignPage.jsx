import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { userService } from '../services/userService';

/**
 * UserRoleAssignPage — halaman terpisah assign role ke user (T38.2/T38.4).
 * Multi-role via pivot `user_roles` (user -> role -> menu).
 */
export default function UserRoleAssignPage({
  user = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [roleIds, setRoleIds] = useState(
    Array.isArray(user?.role_ids) ? user.role_ids.map(String) : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadRoleOptions = useCallback(async (query = '', page = 1) => {
    if (page > 1) return { options: [], hasMore: false };
    const roles = await userService.fetchRoleOptions();
    let options = roles.map((role) => ({ value: String(role.id), label: role.display_name || role.name }));
    const q = query.trim().toLowerCase();
    if (q) options = options.filter((opt) => opt.label.toLowerCase().includes(q));
    return { options, hasMore: false };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (roleIds.length === 0) {
      setErrorMessage('Minimal satu role wajib dipilih untuk akun ini.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await userService.assignRoles(user.id, roleIds.map(Number));
      onShowToast(`Akses role akun "${user.name}" berhasil diperbarui.`);
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal memperbarui akses role.');
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
            Assign Role Pengguna
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('user-role-form')?.requestSubmit()}
            title="Simpan Akses Role"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="user-role-form" onSubmit={handleSubmit} className="space-y-5">
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

            <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-none">
              <div className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-500">Akun</div>
              <div className="font-sport font-black text-sm text-neutral-950 uppercase mt-0.5">{user?.name || '-'}</div>
              <div className="text-xs text-neutral-600 font-mono">{user?.email || '-'}</div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <KeyRound size={16} className="text-amber-500" />
                <span>Role Akses (user_roles)</span>
              </h2>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Pilih Role <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    isMulti
                    isClearable
                    loadOptions={loadRoleOptions}
                    value={roleIds}
                    onChange={(vals) => setRoleIds(vals.map(String))}
                    placeholder="Pilih satu atau lebih role..."
                  />
                </div>

                <p className="text-[11px] text-neutral-500">
                  Role menentukan menu &amp; halaman admin yang dapat diakses akun ini. Jika role <strong>admin</strong> dipilih,
                  role utama akun otomatis menjadi Admin.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Akses Role'}</span>
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
          title="Panduan Assign Role"
          tips={[
            { icon: ShieldCheck, heading: 'Model Akses', text: 'Akses mengikuti alur user → role → menu. Role menentukan menu/halaman yang tampil dan diizinkan.' },
            { icon: KeyRound, heading: 'Multi Role', text: 'Satu akun boleh memiliki beberapa role; gabungan menunya yang berlaku.' },
            { icon: Info, heading: 'Anti-Lockout', text: 'Admin tidak dapat mencabut akses admin dari akunnya sendiri untuk mencegah terkunci dari panel.' }
          ]}
        />
      </div>
    </div>
  );
}
