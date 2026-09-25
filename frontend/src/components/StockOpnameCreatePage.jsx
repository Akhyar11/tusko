import React, { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  ClipboardCheck,
  Plus,
  Trash2,
  Warehouse,
  Package,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';
import { stockOpnameService } from '../services/stockOpnameService';

export default function StockOpnameCreatePage({
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', physical_stock: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadWarehouseOptions = useCallback(async (query = '', page = 1) => {
    if (page > 1) return { options: [], hasMore: false };
    const res = await warehouseService.fetchWarehouses({ all: 1, search: query });
    const options = (res.data || []).map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }));
    return { options, hasMore: false };
  }, []);

  const loadProductOptions = useCallback(async (query = '', page = 1) => {
    const res = await productService.fetchProducts({ search: query, page, per_page: 15, include_inactive: false });
    const options = (res.data || []).map((p) => ({
      value: String(p.id),
      label: p.sku ? `${p.name} (${p.sku})` : p.name
    }));
    const lastPage = res.meta?.last_page || 1;
    return { options, hasMore: page < lastPage };
  }, []);

  const updateItem = (index, patch) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { product_id: '', physical_stock: '' }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, idx) => idx !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!warehouseId) {
      setErrorMessage('Pilih gudang terlebih dahulu.');
      return;
    }
    const validItems = items.filter((item) => item.product_id && item.physical_stock !== '');
    if (validItems.length === 0) {
      setErrorMessage('Tambahkan minimal satu item dengan produk dan stok fisik.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await stockOpnameService.createOpname({
        warehouse_id: Number(warehouseId),
        notes: notes.trim() || null,
        items: validItems.map((item) => ({
          product_id: Number(item.product_id),
          physical_stock: Number(item.physical_stock)
        }))
      });
      onShowToast('Sesi opname berhasil dibuat.');
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
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Buat Sesi Opname
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('opname-form')?.requestSubmit()}
            title="Simpan Sesi Opname"
            variant="primary"
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
                    onChange={(val) => setWarehouseId(val)}
                    placeholder="Pilih gudang opname..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Catatan
                  </label>
                  <TextInput
                    value={notes}
                    onChange={setNotes}
                    placeholder="Catatan sesi opname (opsional)"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-amber-500" />
                  <span>2. Item &amp; Stok Fisik</span>
                </h2>
                <button
                  type="button"
                  onClick={addItem}
                  className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-950 bg-amber-400 hover:bg-amber-300 border border-amber-500 px-2.5 py-1 flex items-center gap-1.5 cursor-pointer rounded-none"
                >
                  <Plus size={13} />
                  <span>Tambah Item</span>
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-neutral-50 border border-neutral-200 p-3">
                    <div className="sm:col-span-7">
                      <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                        Produk
                      </label>
                      <ServerSideSelect
                        loadOptions={loadProductOptions}
                        value={item.product_id}
                        onChange={(val) => updateItem(index, { product_id: val })}
                        placeholder="Cari produk..."
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                        Stok Fisik
                      </label>
                      <TextInput
                        type="number"
                        min={0}
                        value={item.physical_stock}
                        onChange={(val) => updateItem(index, { physical_stock: val })}
                        placeholder="0"
                        weight="mono"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="w-10 h-[42px] flex items-center justify-center border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer rounded-none"
                        title="Hapus Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
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
            { icon: Warehouse, heading: 'Gudang', text: 'Pilih gudang yang dihitung. Snapshot stok sistem diambil dari saldo gudang tersebut.' },
            { icon: Package, heading: 'Item & Stok Fisik', text: 'Tambahkan produk lalu isi hasil hitung fisik. Selisih = fisik − sistem, dihitung otomatis.' },
            { icon: ClipboardCheck, heading: 'Alur', text: 'Setelah dibuat (draft), ajukan untuk persetujuan, lalu setujui agar stok & jurnal disesuaikan.' },
            { icon: Info, heading: 'Akurasi', text: 'Pastikan angka fisik benar; persetujuan langsung mengubah saldo stok otoritatif dan mencatat jurnal.' }
          ]}
        />
      </div>
    </div>
  );
}
