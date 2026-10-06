import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Save,
  PlugZap,
  ShieldCheck,
  ServerCog,
  CheckCircle2,
  CloudDownload,
  Store,
  Truck,
  CreditCard,
  HardDrive,
  Gift,
  Mail,
  ToggleLeft,
  KeyRound,
  LayoutTemplate,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  RotateCcw,
  Search as SearchIcon,
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import ServerSideSelect from './molecules/ServerSideSelect';
import ToggleSwitch from './molecules/ToggleSwitch';
import ImageUploadField from './molecules/ImageUploadField';
import SearchBar from './molecules/SearchBar';
import RepeaterField from './molecules/RepeaterField';
import TagsInput from './molecules/TagsInput';
import StorefrontPreview from './organisms/StorefrontPreview';

// Code-split editor WYSIWYG (Tiptap) agar tak membebani bundle awal.
const RichTextEditor = lazy(() => import('./molecules/RichTextEditor'));
import FormTipsPanel from './organisms/FormTipsPanel';
import ConfirmationModal from './organisms/ConfirmationModal';
import { settingsService } from '../services/settingsService';
import { expeditionService } from '../services/expeditionService';
import { resolveBackendUrl } from '../services/apiClient';

const TESTABLE_GROUPS = ['shipping', 'payment', 'storage', 'notification'];

const GROUP_ICONS = {
  store: Store,
  shipping: Truck,
  payment: CreditCard,
  storage: HardDrive,
  loyalty: Gift,
  notification: Mail,
  feature_flags: ToggleLeft,
  security: ShieldCheck,
  auth: KeyRound,
  storefront: LayoutTemplate,
};

// Field khusus tiap provider logistik (T40 UI/UX).
const SHIPPING_GENERIC_KEYS = new Set([
  'shipping.base_url',
  'shipping.api_key',
  'shipping.origin',
  'shipping.origin_district_code',
]);
const SHIPPING_BITESHIP_PREFIX = 'shipping.biteship_';

const WIDE_TYPES = new Set(['text', 'image', 'richtext', 'repeater', 'tags']);

const fieldWrapClass = (field) => (WIDE_TYPES.has(field.type) ? 'sm:col-span-2' : '');

/**
 * SystemSettingsHub — Pengaturan Sistem Terpusat (T36).
 *
 * Fase 1 (UX): sidebar navigasi 2 tingkat (grup + section accordion), pencarian
 * lintas grup, layout grid hemat scroll, toggle untuk boolean, tooltip deskripsi,
 * sticky save bar + guard perubahan belum tersimpan.
 */
export default function SystemSettingsHub({ onShowToast = () => {}, onBack = () => {}, onOpenExpeditions = () => {} }) {
  const [groupsData, setGroupsData] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [draft, setDraft] = useState({});
  const [baseline, setBaseline] = useState({});
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const [pendingNav, setPendingNav] = useState(null);
  const [isSyncingCouriers, setIsSyncingCouriers] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const toastRef = useRef(onShowToast);
  useEffect(() => {
    toastRef.current = onShowToast;
  }, [onShowToast]);

  const active = useMemo(
    () => groupsData.find((g) => g.group === activeGroup) || null,
    [groupsData, activeGroup]
  );

  // Muat seluruh grup (nilai + metadata field + sections) sekali.
  useEffect(() => {
    let mounted = true;
    settingsService.listGroups()
      .then((res) => {
        if (!mounted) return;
        const list = res?.groups || [];
        setGroupsData(list);
        if (list.length > 0) {
          setActiveGroup(list[0].group);
          setDraft({ ...list[0].values });
          setBaseline({ ...list[0].values });
        }
      })
      .catch((err) => toastRef.current(err?.message || 'Gagal memuat pengaturan.', { type: 'error' }))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline]
  );

  const setValue = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  // Fallback kompatibilitas: bila backend belum menyertakan `fields` di respons
  // index, ambil metadata field grup aktif lewat endpoint detail.
  useEffect(() => {
    if (!activeGroup) return undefined;
    const current = groupsData.find((g) => g.group === activeGroup);
    if (current && Array.isArray(current.fields) && current.fields.length > 0) return undefined;

    let mounted = true;
    settingsService.getGroup(activeGroup)
      .then((res) => {
        if (!mounted) return;
        setGroupsData((prev) => prev.map((g) => (g.group === activeGroup
          ? { ...g, fields: res?.fields || [], sections: res?.sections || g.sections || [], values: res?.values || g.values }
          : g)));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [activeGroup, groupsData]);

  const switchGroup = (group, focusKey = null) => {
    const target = groupsData.find((g) => g.group === group);
    setActiveGroup(group);
    setDraft({ ...(target?.values || {}) });
    setBaseline({ ...(target?.values || {}) });
    setSearch('');
    if (focusKey) {
      setCollapsed({});
      setTimeout(() => {
        document.getElementById(`field-${focusKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }
  };

  const handleSelectGroup = (group) => {
    if (group === activeGroup) return;
    if (dirty) {
      setPendingNav({ group });
      return;
    }
    switchGroup(group);
  };

  const handleSave = async () => {
    if (!activeGroup) return;
    setSaving(true);
    try {
      const payload = { ...draft };
      (active?.fields || []).forEach((field) => {
        if (field.is_secret && (payload[field.key] === '' || payload[field.key] === '********' || payload[field.key] === undefined)) {
          delete payload[field.key];
        }
      });

      const res = await settingsService.updateGroup(activeGroup, payload);
      const savedValues = res?.values || draft;
      setDraft({ ...savedValues });
      setBaseline({ ...savedValues });
      setGroupsData((prev) => prev.map((g) => (g.group === activeGroup ? { ...g, values: savedValues } : g)));
      onShowToast('Pengaturan berhasil disimpan.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal menyimpan pengaturan.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraft({ ...baseline });
    onShowToast('Perubahan dikembalikan ke pengaturan tersimpan.');
  };

  const handleTest = async () => {
    if (!activeGroup) return;
    setTesting(true);
    try {
      const res = await settingsService.testConnection(activeGroup, draft);
      onShowToast(res?.message || 'Uji koneksi selesai.');
    } catch (err) {
      onShowToast(err?.message || 'Uji koneksi gagal.', { type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  // Filter field sesuai provider logistik terpilih.
  const providerVisibleFields = useMemo(() => {
    const fields = active?.fields || [];
    if (activeGroup !== 'shipping') return fields;
    const provider = draft['shipping.provider'];
    return fields.filter((field) => {
      const isBiteshipField = field.key.startsWith(SHIPPING_BITESHIP_PREFIX);
      return provider === 'biteship' ? !SHIPPING_GENERIC_KEYS.has(field.key) : !isBiteshipField;
    });
  }, [active, activeGroup, draft]);

  // Section -> field (setelah filter provider + pencarian).
  const sections = useMemo(() => {
    const byKey = new Map(providerVisibleFields.map((f) => [f.key, f]));
    const q = search.trim().toLowerCase();
    const source = (active?.sections && active.sections.length > 0)
      ? active.sections
      : [{ title: active?.label || 'Pengaturan', keys: (active?.fields || []).map((f) => f.key) }];
    return source
      .map((section) => {
        const keys = section.keys.filter((k) => byKey.has(k));
        return { title: section.title, fields: keys.map((k) => byKey.get(k)) };
      })
      .filter((section) => section.fields.length > 0)
      .map((section) => ({
        ...section,
        fields: section.fields.filter((f) =>
          q === '' || f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.fields.length > 0);
  }, [active, providerVisibleFields, search]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === '') return [];
    const out = [];
    groupsData.forEach((g) => {
      (g.fields || []).forEach((f) => {
        if (f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q)) {
          out.push({ ...f, group: g.group, groupLabel: g.label });
        }
      });
    });
    return out;
  }, [groupsData, search]);

  const renderField = (field) => {
    const value = draft[field.key];

    if (field.type === 'boolean') {
      return (
        <div className="flex items-center justify-between gap-4 p-3 bg-neutral-50 border border-neutral-200 rounded-none">
          <span className="text-xs text-neutral-700">{field.label}</span>
          <ToggleSwitch
            checked={Boolean(value)}
            onChange={(checked) => setValue(field.key, checked)}
            ariaLabel={field.label}
          />
        </div>
      );
    }

    if (Array.isArray(field.options) && field.options.length > 0) {
      return (
        <ServerSideSelect
          value={value ?? ''}
          onChange={(val) => setValue(field.key, val)}
          options={field.options.map((opt) => ({ value: opt, label: opt }))}
          placeholder={`Pilih ${field.label.toLowerCase()}...`}
        />
      );
    }

    if (field.type === 'image') {
      return (
        <ImageUploadField
          value={value ?? ''}
          onChange={(url) => setValue(field.key, url)}
          placeholder={`Unggah ${field.label.toLowerCase()}...`}
        />
      );
    }

    if (field.type === 'text') {
      return (
        <TextArea rows={3} value={value ?? ''} onChange={(val) => setValue(field.key, val)} placeholder={field.label} />
      );
    }

    if (field.type === 'richtext') {
      return (
        <Suspense
          fallback={(
            <div className="border border-neutral-300 rounded-none bg-neutral-50 h-[200px] flex items-center justify-center text-[11px] text-neutral-500">
              Memuat editor...
            </div>
          )}
        >
          <RichTextEditor
            key={`${activeGroup}-${field.key}`}
            value={value ?? ''}
            onChange={(html) => setValue(field.key, html)}
            placeholder={`Tulis ${field.label.toLowerCase()}...`}
          />
        </Suspense>
      );
    }

    if (field.type === 'repeater') {
      return (
        <RepeaterField
          value={value ?? ''}
          onChange={(json) => setValue(field.key, json)}
          itemFields={field.item_fields || []}
          addLabel={`Tambah ${field.label}`}
        />
      );
    }

    if (field.type === 'tags') {
      return (
        <TagsInput
          value={value ?? ''}
          onChange={(val) => setValue(field.key, val)}
          placeholder="Ketik nilai lalu tekan Enter..."
        />
      );
    }

    if (field.type === 'secret') {
      return (
        <TextInput
          type="password"
          weight="mono"
          value={value === '********' ? '' : (value ?? '')}
          onChange={(val) => setValue(field.key, val)}
          placeholder={value === '********' ? '•••••••• (tersimpan)' : `Masukkan ${field.label}`}
        />
      );
    }

    const inputType = field.type === 'integer' ? 'number' : (['email', 'url'].includes(field.type) ? field.type : 'text');

    return (
      <TextInput
        type={inputType}
        weight={field.type === 'integer' ? 'mono' : 'medium'}
        value={value ?? ''}
        onChange={(val) => setValue(field.key, val)}
        placeholder={field.label}
      />
    );
  };

  const renderFieldBlock = (field) => (
    <div key={field.key} id={`field-${field.key}`} className={fieldWrapClass(field)}>
      {field.type !== 'boolean' && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
            {field.label}
            {field.is_secret && (
              <span className="ml-2 text-[10px] text-neutral-400 font-normal normal-case">(rahasia)</span>
            )}
          </label>
          {field.description && (
            <span title={field.description} className="text-neutral-400 hover:text-neutral-600 cursor-help inline-flex">
              <Info size={13} />
            </span>
          )}
        </div>
      )}
      {renderField(field)}
      {field.type === 'boolean' && field.description && (
        <p className="text-[10.5px] text-neutral-500 mt-1">{field.description}</p>
      )}
    </div>
  );

  const activeValues = draft;
  const totalFields = active?.fields?.length || 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header form kanonis (Aturan 25) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onBack} title="Kembali ke Dashboard" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              Pengaturan Sistem
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {TESTABLE_GROUPS.includes(activeGroup) && (
            <IconButton icon={PlugZap} onClick={handleTest} title="Uji Koneksi" variant="secondary" disabled={testing} />
          )}
          <IconButton icon={Save} onClick={handleSave} title="Simpan Pengaturan" variant="primary" disabled={saving || !dirty} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Sidebar navigasi (sticky) */}
        <aside className="lg:col-span-1 lg:sticky lg:top-6 space-y-4 self-start">
          <SearchBar
            value={search}
            onChange={setSearch}
            onReset={() => setSearch('')}
            placeholder="Cari pengaturan..."
          />

          <nav className="bg-white border border-neutral-300 rounded-none shadow-2xs p-2 space-y-1">
            {groupsData.map((g) => {
              const Icon = GROUP_ICONS[g.group] || ServerCog;
              const isActive = g.group === activeGroup;
              return (
                <button
                  key={g.group}
                  type="button"
                  onClick={() => handleSelectGroup(g.group)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none border text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white text-neutral-800 border-transparent hover:bg-neutral-100'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-amber-400 shrink-0' : 'text-neutral-500 shrink-0'} />
                  <span className="flex-1 text-xs font-sport font-black uppercase tracking-wider truncate">{g.label}</span>
                  <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {(g.fields || []).length}
                  </span>
                </button>
              );
            })}
          </nav>

          <FormTipsPanel
            title="Panduan Pengaturan"
            tips={[
              { icon: ShieldCheck, heading: 'Nilai Rahasia', text: 'Kredensial disimpan terenkripsi & hanya tampil bertopeng. Isi ulang hanya bila ingin mengganti.' },
              { icon: SearchIcon, heading: 'Cari Cepat', text: 'Ketik nama pengaturan di kotak cari untuk melompat lintas bagian.' },
              { icon: PlugZap, heading: 'Uji Koneksi', text: 'Pastikan kredensial pengiriman/pembayaran/storage valid sebelum menyimpan.' },
              { icon: CheckCircle2, heading: 'Tanpa Deploy', text: 'Perubahan langsung dipakai modul terkait.' },
            ]}
          />
        </aside>

        {/* Konten */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs">
              <p className="text-xs text-neutral-500">Memuat pengaturan...</p>
            </div>
          ) : search.trim() !== '' ? (
            <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-3">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider border-b border-neutral-200 pb-3">
                Hasil Pencarian ({searchResults.length})
              </h2>
              {searchResults.length === 0 ? (
                <p className="text-xs text-neutral-500">Tidak ada pengaturan yang cocok.</p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {searchResults.map((f) => (
                    <button
                      key={f.group + f.key}
                      type="button"
                      onClick={() => switchGroup(f.group, f.key)}
                      className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:bg-neutral-50 cursor-pointer px-1"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-neutral-900 truncate">{f.label}</span>
                        <span className="block text-[10.5px] text-neutral-500 truncate">{f.groupLabel} • {f.key}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : active ? (
            <>
              <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs">
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <ServerCog size={16} className="text-amber-500" />
                  <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider">{active.label}</h2>
                  <span className="text-[10px] font-mono text-neutral-400 normal-case">{totalFields} field</span>
                  {activeGroup === 'storefront' && (
                    <button
                      type="button"
                      onClick={() => setPreviewOpen((o) => !o)}
                      className={`ml-auto px-2.5 py-1.5 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        previewOpen ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {previewOpen ? <EyeOff size={13} /> : <Eye size={13} />}
                      <span>{previewOpen ? 'Sembunyikan' : 'Pratinjau'}</span>
                    </button>
                  )}
                </div>
                {active.description && <p className="text-[11px] text-neutral-500 mt-2">{active.description}</p>}
              </div>

              {activeGroup === 'storefront' && previewOpen && (
                <StorefrontPreview values={draft} />
              )}

              {sections.map((section) => {
                const isCollapsed = Boolean(collapsed[section.title]);
                return (
                  <div key={section.title} className="bg-white border border-neutral-300 rounded-none shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setCollapsed((prev) => ({ ...prev, [section.title]: !prev[section.title] }))}
                      className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-2 text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                        <ChevronDown size={15} className={`text-neutral-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        {section.title}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">{section.fields.length}</span>
                    </button>
                    {!isCollapsed && (
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {section.fields.map((field) => renderFieldBlock(field))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ekstra grup Pengiriman */}
              {activeGroup === 'shipping' && (
                <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-3">
                  {activeValues['shipping.provider'] === 'biteship' && (
                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                      <p className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-800 mb-1">
                        URL Webhook Biteship
                      </p>
                      <code className="block text-[11px] font-mono text-neutral-700 break-all select-all">
                        {resolveBackendUrl('/api/webhooks/biteship')}
                      </code>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Daftarkan URL ini di dashboard Biteship → Integrations → Webhook (order.status/order.waybill_id/order.price).
                      </p>
                    </div>
                  )}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none flex items-center justify-between gap-3">
                    <div className="text-[11px] text-neutral-600">
                      Sinkronkan daftar kurir &amp; layanan dari provider aktif ke master ekspedisi.
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <IconButton
                        icon={CloudDownload}
                        onClick={async () => {
                          setIsSyncingCouriers(true);
                          try {
                            const result = await expeditionService.syncExpeditions();
                            onShowToast(`Sinkronisasi selesai: ${result?.couriers ?? 0} kurir, ${result?.services ?? 0} layanan.`);
                          } catch (err) {
                            onShowToast(err?.message || 'Gagal sinkronisasi kurir.', { type: 'error' });
                          } finally {
                            setIsSyncingCouriers(false);
                          }
                        }}
                        title="Sinkron Kurir Sekarang"
                        variant="primary"
                        disabled={isSyncingCouriers}
                      />
                      <button
                        type="button"
                        onClick={onOpenExpeditions}
                        className="px-3 py-1.5 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 cursor-pointer shrink-0"
                      >
                        Buka Sinkron Kurir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Sticky save bar */}
          <div className="sticky bottom-0 z-20 bg-white border border-neutral-300 rounded-none shadow-2xs p-3.5 flex items-center justify-between gap-3">
            <span className={`text-[11px] font-sport font-black uppercase tracking-wider ${dirty ? 'text-amber-600' : 'text-neutral-400'}`}>
              {dirty ? '● Ada perubahan belum disimpan' : 'Semua perubahan tersimpan'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={!dirty || saving}
                className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !dirty}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Guard perubahan belum tersimpan */}
      <ConfirmationModal
        isOpen={pendingNav !== null}
        onClose={() => setPendingNav(null)}
        onConfirm={() => {
          const target = pendingNav?.group;
          setPendingNav(null);
          if (target) switchGroup(target);
        }}
        title="Perubahan Belum Disimpan"
        subtitle="Pindah bagian akan membuang perubahan yang belum disimpan."
        message="Anda memiliki perubahan yang belum disimpan pada bagian ini. Tetap pindah tanpa menyimpan?"
        confirmText="Ya, Pindah"
        cancelText="Tetap di Sini"
        variant="warning"
      />
    </div>
  );
}
