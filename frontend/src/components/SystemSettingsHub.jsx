import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Save,
  PlugZap,
  ShieldCheck,
  SlidersHorizontal,
  ServerCog,
  CheckCircle2
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { settingsService } from '../services/settingsService';

const TESTABLE_GROUPS = ['shipping', 'payment', 'storage', 'notification'];

/**
 * SystemSettingsHub — Pengaturan Sistem Terpusat (T36.9).
 * Satu entitas, navigasi SECTION vertikal (bukan tab), form kanonis 3/4 + panel tips.
 */
export default function SystemSettingsHub({ onShowToast = () => {}, onBack = () => {} }) {
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeLabel, setActiveLabel] = useState('');
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let active = true;

    settingsService.listGroups()
      .then((res) => {
        if (!active) return;
        const list = res?.groups || [];
        setGroups(list);
        if (list.length > 0) {
          setActiveGroup(list[0].group);
          setActiveLabel(list[0].label);
        }
      })
      .catch((err) => onShowToast(err?.message || 'Gagal memuat pengaturan.', { type: 'error' }))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [onShowToast]);

  useEffect(() => {
    if (!activeGroup) return undefined;

    let active = true;
    setLoading(true);

    setActiveLabel(groups.find((g) => g.group === activeGroup)?.label || activeGroup);

    settingsService.getGroup(activeGroup)
      .then((res) => {
        if (!active) return;
        setFields(res?.fields || []);
        setValues(res?.values || {});
      })
      .catch((err) => onShowToast(err?.message || 'Gagal memuat grup pengaturan.', { type: 'error' }))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [activeGroup, groups, onShowToast]);

  const setValue = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!activeGroup) return;
    setSaving(true);
    try {
      const res = await settingsService.updateGroup(activeGroup, values);
      setValues(res?.values || values);
      onShowToast('Pengaturan berhasil disimpan.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal menyimpan pengaturan.', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!activeGroup) return;
    setTesting(true);
    try {
      const res = await settingsService.testConnection(activeGroup);
      onShowToast(res?.message || 'Uji koneksi selesai.');
    } catch (err) {
      onShowToast(err?.message || 'Uji koneksi gagal.', { type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  const renderField = (field) => {
    const value = values[field.key];

    if (field.type === 'boolean') {
      return (
        <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none">
          <Checkbox checked={Boolean(value)} onChange={(checked) => setValue(field.key, checked)} />
          <span className="text-xs text-neutral-700">{field.label}</span>
        </label>
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

    if (field.type === 'text') {
      return (
        <TextArea rows={3} value={value ?? ''} onChange={(val) => setValue(field.key, val)} placeholder={field.label} />
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
          <IconButton icon={Save} onClick={handleSave} title="Simpan Pengaturan" variant="primary" disabled={saving} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* Navigasi SECTION (vertikal, bukan tab) */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal size={16} className="text-amber-500" />
              <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">Pilih Bagian Pengaturan</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.group}
                  type="button"
                  onClick={() => setActiveGroup(group.group)}
                  className={`px-3 py-1.5 text-[11px] font-sport font-black uppercase tracking-wider rounded-none border transition-colors cursor-pointer ${
                    activeGroup === group.group
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form section aktif */}
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <ServerCog size={16} className="text-amber-500" />
              <span>{activeLabel}</span>
            </h2>

            {loading ? (
              <p className="text-xs text-neutral-500">Memuat pengaturan...</p>
            ) : fields.length === 0 ? (
              <p className="text-xs text-neutral-500">Tidak ada field pada grup ini.</p>
            ) : (
              <div className="space-y-5">
                {fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      {field.label}
                      {field.is_secret && (
                        <span className="ml-2 text-[10px] text-neutral-400 font-normal normal-case">(rahasia)</span>
                      )}
                    </label>
                    {renderField(field)}
                    <p className="text-[11px] text-neutral-500 mt-1">{field.description}</p>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
            >
              <Save size={15} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Pengaturan Sistem"
          tips={[
            { icon: ShieldCheck, heading: 'Nilai Rahasia', text: 'Kredensial rahasia (API key/server key) disimpan terenkripsi dan hanya ditampilkan bertopeng.' },
            { icon: SlidersHorizontal, heading: 'Pilih Bagian', text: 'Pilih bagian pengaturan di panel atas untuk berpindah konfigurasi tanpa berpindah halaman.' },
            { icon: PlugZap, heading: 'Uji Koneksi', text: 'Gunakan tombol uji koneksi untuk memastikan kredensial pengiriman/pembayaran/storage valid.' },
            { icon: CheckCircle2, heading: 'Tanpa Deploy', text: 'Perubahan langsung dipakai modul terkait (ongkir, pembayaran, storage) tanpa deploy ulang.' },
          ]}
        />
      </div>
    </div>
  );
}
