import React, { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft, Save, X, AlertCircle, ClipboardCheck, Warehouse, Package, Info, ListChecks
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { warehouseService } from '../services/warehouseService';
import { stockOpnameService } from '../services/stockOpnameService';

const itemKey = (item) => `${item.product_id}-${item.product_variant_id ?? 'base'}`;

export default function StockOpnameCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [physical, setPhysical] = useState({});
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadWarehouseOptions = useCallback(async (query = '', page = 1) => {
    if (page > 1) return { options: [], hasMore: false };
    const res = await warehouseService.fetchWarehouses({ all: 1, search: query });
    const options = (res.data || []).map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }));
    return { options, hasMore: false };
  }, []);

  const handleWarehouseChange = async (val) => {
    setWarehouseId(val || '');
    setErrorMessage('');
    setCandidates([]);
    setPhysical({});
    if (!val) return;

    setIsLoadingCandidates(true);
    try {
      const items = await stockOpnameService.getCandidates(val);
      setCandidates(items);
      const prefilled = {};
      items.forEach((it) => { prefilled[itemKey(it)] = String(it.system_stock); });
      setPhysical(prefilled);
    } catch (err) {
      setErrorMessage(err?.message || 'Gagal memuat item gudang.');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const setPhysicalValue = (key, value) => setPhysical((prev) => ({ ...prev, [key]: value }));

  const rows = useMemo(() => candidates.map((it) => {
    const key = itemKey(it);
    const physicalVal = physical[key] === '' || physical[key] === undefined ? null : Number(physical[key]);
    const diff = physicalVal === null ? null : physicalVal - it.system_stock;
    return { ...it, key, physicalVal, diff };
  }), [candidates, physical]);

  const countedCount = rows.filter((r) => r.physicalVal !== null).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseId) {
      setErrorMessage('Pilih gudang terlebih dahulu.');
      return;
    }
    if (candidates.length === 0) {
      setErrorMessage('Gudang ini belum memiliki stok produk/varian untuk diopname.');
      return;
    }
    const items = rows
      .filter((r) => r.physicalVal !== null && r.physicalVal >= 0)
      .map((r) => ({
        product_id: r.product_id,
        product_variant_id: r.product_variant_id,
        physical_stock: r.physicalVal,
      }));
    if (items.length === 0) {
      setErrorMessage('Isi minimal satu jumlah stok fisik.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await stockOpnameService.createOpname({
        warehouse_id: Number(warehouseId),
        notes: notes.trim() || null,
        items,
      });
      onShowToast('Sesi opname berhasil dibuat (draft).');
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal membuat sesi opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Stock Opname" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Buat Sesi Opname</h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('opname-form')?.requestSubmit()}
            title="Simpan Sesi Opname"
            variant="primary"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="opname-form" onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3" aria-label="Tutup pesan error">✕</button>
              </div>
            )}

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Warehouse size={16} className="text-amber-500" />
                <span>1. Gudang &amp; Catatan</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Gudang <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    loadOptions={loadWarehouseOptions}
                    value={warehouseId}
                    onChange={handleWarehouseChange}
                    placeholder="Pilih gudang opname..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Catatan</label>
                  <TextInput value={notes} onChange={setNotes} placeholder="Catatan sesi opname (opsional)" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-amber-500" />
                  <span>2. Item Gudang &amp; Stok Fisik</span>
                </h2>
                {candidates.length > 0 && (
                  <span className="text-[11px] font-mono font-bold text-neutral-500">{countedCount}/{candidates.length} terisi</span>
                )}
              </div>

              {!warehouseId ? (
                <div className="mt-4 p-6 border border-dashed border-neutral-300 rounded-none text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <Warehouse size={20} className="text-neutral-400" />
                  Pilih gudang untuk memuat daftar produk/varian yang tersedia.
                </div>
              ) : isLoadingCandidates ? (
                <div className="mt-4 p-6 text-center text-xs text-neutral-500">Memuat item gudang…</div>
              ) : candidates.length === 0 ? (
                <div className="mt-4 p-6 border border-dashed border-neutral-300 rounded-none text-center text-xs text-neutral-500 flex flex-col items-center gap-2">
                  <Package size={20} className="text-neutral-400" />
                  Gudang ini belum memiliki saldo stok. Opname hanya untuk item yang benar-benar ada di gudang.
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-neutral-950 text-white font-bold">
                        <th className="p-2 border border-neutral-800">Produk / Varian</th>
                        <th className="p-2 border border-neutral-800">SKU</th>
                        <th className="p-2 border border-neutral-800 text-right w-24">Stok Sistem</th>
                        <th className="p-2 border border-neutral-800 w-32">Stok Fisik</th>
                        <th className="p-2 border border-neutral-800 text-right w-24">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {rows.map((r) => (
                        <tr key={r.key} className="hover:bg-neutral-50">
                          <td className="p-2">
                            <div className="font-bold text-neutral-900">{r.name}</div>
                            {r.variant_name && <div className="text-[11px] text-neutral-500">{r.variant_name}</div>}
                          </td>
                          <td className="p-2 font-mono text-neutral-600">{r.sku || '-'}</td>
                          <td className="p-2 text-right font-mono font-bold text-neutral-800">{r.system_stock}</td>
                          <td className="p-2">
                            <TextInput
                              type="number"
                              min={0}
                              weight="mono"
                              value={physical[r.key] ?? ''}
                              onChange={(val) => setPhysicalValue(r.key, val)}
                              placeholder="0"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            {r.diff === null ? <span className="text-neutral-400">—</span> : (
                              <span className={r.diff === 0 ? 'text-neutral-500' : (r.diff > 0 ? 'text-emerald-600' : 'text-rose-600')}>
                                {r.diff > 0 ? `+${r.diff}` : r.diff}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || candidates.length === 0}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Sesi Opname'}</span>
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
          title="Panduan Opname"
          tips={[
            { icon: Warehouse, heading: 'Gudang', text: 'Pilih gudang yang dihitung. Daftar item diambil dari saldo stok gudang tersebut.' },
            { icon: ListChecks, heading: 'Hanya Item Tersedia', text: 'Hanya produk/varian yang benar-benar ada di gudang yang bisa diopname (anti-manipulasi stok).' },
            { icon: Package, heading: 'Stok Fisik', text: 'Isi hasil hitung fisik. Selisih = fisik − sistem dihitung otomatis (termasuk per varian).' },
            { icon: ClipboardCheck, heading: 'Alur', text: 'Simpan (draft) → Ajukan → Setujui. Persetujuan menyesuaikan stok otoritatif + jurnal.' },
          ]}
        />
      </div>
    </div>
  );
}
