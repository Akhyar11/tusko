import React, { useState, useMemo } from 'react';
import {
  Boxes,
  ArrowLeft,
  Check,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import Checkbox from './molecules/Checkbox';
import { formatRupiah } from '../utils/formatters';
import FormTipsPanel from './organisms/FormTipsPanel';

const mockSuppliers = [
  'PT AeroTech Industri Garment (Bandung)',
  'Tusko Manufacturing Hub (Jakarta)',
  'NitroFoam Athletic Shoes Distributor (Surabaya)',
  'Apex Gear & Hardware Supplier (Tangerang)',
  'Distributor Utama Perlengkapan Olahraga Nasional'
];

const reductionReasons = [
  { id: 'damage', label: 'Barang Rusak / Afkir / Cacat Produksi', defaultDesc: 'Ditemukan cacat jahitan/material saat QC packing' },
  { id: 'sample', label: 'Sampel Display & Endorsement Promosi', defaultDesc: 'Pengambilan unit untuk display offline store / influencer endorsement' },
  { id: 'expired', label: 'Kedaluwarsa / Masa Simpan Habis', defaultDesc: 'Kemasan rusak dan melewati batas retensi gudang' },
  { id: 'loss', label: 'Selisih Fisik / Kehilangan Opname', defaultDesc: 'Selisih hitung fisik saat audit berkala gudang' },
  { id: 'manual_sale', label: 'Penjualan Offline / Luar Sistem Online', defaultDesc: 'Terjual pada event pameran olahraga / kasir direct' }
];

const MODE_META = {
  in: { title: 'Restok / Tambah Stok Masuk', desc: 'Penerimaan barang dari supplier & update safety stock gudang', icon: PlusCircle },
  out: { title: 'Kurangi / Penarikan Stok Fisik', desc: 'Pencatatan barang rusak, sampel promosi, dan selisih fisik', icon: MinusCircle },
  adjust: { title: 'Penyesuaian Manual Stok', desc: 'Koreksi cepat hasil audit fisik gudang (tambah, kurang, atau set aktual)', icon: Edit3 }
};

export default function StockMutationPage({
  mode = 'in',
  inventory = [],
  preselectedProductId = null,
  onSaveMutation = () => {},
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const meta = MODE_META[mode] || MODE_META.in;

  const defaultProduct = inventory.find((p) => p.id === preselectedProductId) || inventory[0];
  const [selectedProductId, setSelectedProductId] = useState(defaultProduct ? defaultProduct.id : '');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mode IN fields
  const [costPrice, setCostPrice] = useState(defaultProduct ? defaultProduct.cost_price || '' : '');
  const [supplier, setSupplier] = useState(mockSuppliers[0]);
  const [poNumber, setPoNumber] = useState(
    `PO/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [warehouseBin, setWarehouseBin] = useState(defaultProduct ? defaultProduct.warehouse_bin || '' : '');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [operator, setOperator] = useState('Budi Santoso (Kepala Gudang)');
  const [notes, setNotes] = useState('');
  const [syncToCashflow, setSyncToCashflow] = useState(true);

  // Mode OUT fields
  const [reasonId, setReasonId] = useState(reductionReasons[0].id);
  const [reference, setReference] = useState(
    `BA-DED/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [deductionDate, setDeductionDate] = useState(new Date().toISOString().slice(0, 10));

  // Mode ADJUST fields
  const [adjustType, setAdjustType] = useState('in');

  const currentProduct = useMemo(() => {
    return inventory.find((p) => p.id === Number(selectedProductId)) || inventory[0] || null;
  }, [inventory, selectedProductId]);

  const qtyNumber = Number(quantity) || 0;
  const totalCost = mode === 'in' ? qtyNumber * (Number(costPrice) || 0) : 0;
  const remainingAfter = currentProduct ? Math.max(0, (Number(currentProduct.stock) || 0) - qtyNumber) : 0;

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = inventory.find((p) => p.id === Number(productId));
    if (prod && mode === 'in') {
      setCostPrice(prod.cost_price || '');
      if (prod.warehouse_bin) setWarehouseBin(prod.warehouse_bin);
    }
    setError('');
  };

  const handleReasonChange = (newReasonId) => {
    setReasonId(newReasonId);
    const found = reductionReasons.find((r) => r.id === newReasonId);
    if (found) setNotes(found.defaultDesc);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!currentProduct) {
      setError('Pilih produk terlebih dahulu.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('Jumlah unit minimal 1 unit.');
      return;
    }

    const nowIso = new Date().toISOString();
    setIsSubmitting(true);
    try {
      if (mode === 'in') {
        const updatedStock = (Number(currentProduct.stock) || 0) + qtyNumber;
        onSaveMutation({
          kind: 'in',
          log: {
            id: Date.now(),
            product_id: currentProduct.id,
            sku: currentProduct.sku,
            product_name: currentProduct.name,
            type: 'in',
            quantity: qtyNumber,
            previous_stock: currentProduct.stock,
            current_stock: updatedStock,
            reference: poNumber.trim() || `PO-${Date.now()}`,
            notes: notes.trim() || `Restock barang masuk dari ${supplier}`,
            created_at: nowIso,
            operator: operator.trim() || 'Admin Gudang',
            warehouse_code: currentProduct.warehouse_code || 'WH-CGK-01'
          },
          updatedStock,
          costAmount: syncToCashflow ? totalCost : 0,
          costMeta: {
            category: 'restock',
            category_label: 'Restock Stok Produk',
            description: `Pengadaan restock: ${currentProduct.name} (${qtyNumber} unit)`
          }
        });
        onShowToast(`Stok ${currentProduct.name} berhasil ditambah (+${qtyNumber} unit).`);
      } else if (mode === 'out') {
        const maxAvailable = Number(currentProduct.stock) || 0;
        if (qtyNumber > maxAvailable) {
          setError(`Jumlah tidak boleh melebihi stok yang tersedia (${maxAvailable} unit).`);
          setIsSubmitting(false);
          return;
        }
        const selectedReason = reductionReasons.find((r) => r.id === reasonId) || reductionReasons[0];
        onSaveMutation({
          kind: 'out',
          log: {
            id: Date.now(),
            product_id: currentProduct.id,
            sku: currentProduct.sku,
            product_name: currentProduct.name,
            type: 'out',
            quantity: -qtyNumber,
            previous_stock: currentProduct.stock,
            current_stock: remainingAfter,
            reference: reference.trim() || `BA-${Date.now()}`,
            notes: notes.trim() || selectedReason.label,
            created_at: nowIso,
            operator: operator.trim() || 'Admin Gudang',
            warehouse_code: currentProduct.warehouse_code || 'WH-CGK-01'
          },
          updatedStock: remainingAfter
        });
        onShowToast(`Stok ${currentProduct.name} dikurangi (-${qtyNumber} unit).`);
      } else {
        const currentStock = Number(currentProduct.stock) || 0;
        let newStock = currentStock;
        let delta = 0;
        if (adjustType === 'in') {
          newStock = currentStock + qtyNumber;
          delta = qtyNumber;
        } else if (adjustType === 'out') {
          newStock = Math.max(0, currentStock - qtyNumber);
          delta = -(currentStock - newStock);
        } else {
          newStock = qtyNumber;
          delta = qtyNumber - currentStock;
        }
        onSaveMutation({
          kind: 'adjust',
          log: {
            id: Date.now(),
            product_id: currentProduct.id,
            sku: currentProduct.sku,
            product_name: currentProduct.name,
            type: 'adjustment',
            quantity: delta,
            previous_stock: currentStock,
            current_stock: newStock,
            reference: `ADJ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
            notes: notes.trim() || 'Penyesuaian stok manual',
            created_at: nowIso,
            operator: 'Admin Gudang',
            warehouse_code: currentProduct.warehouse_code || 'WH-CGK-01'
          },
          updatedStock: newStock
        });
        onShowToast(`Stok ${currentProduct.sku} diperbarui: ${currentStock} -> ${newStock} unit.`);
      }
      onNavigateBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Stok" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">{meta.title}</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => document.getElementById('stock-form')?.requestSubmit()} title="Simpan Mutasi Stok" variant="primary" />
        </div>
      </div>

      {/* Form + Tips (3/4 form + 1/4 tips) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Form Card */}
      <div className="bg-white border border-neutral-300 rounded-none shadow-xs p-6 sm:p-8 lg:col-span-3">
        <form id="stock-form" onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError('')} className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0 ml-3">
                ✕
              </button>
            </div>
          )}

          {/* Produk & Jumlah */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Pilih Produk <span className="text-rose-500">*</span>
              </label>
              <ServerSideSelect
                value={selectedProductId}
                onChange={(val) => handleProductChange(val)}
                options={inventory.map((item) => ({
                  value: item.id,
                  label: `[${item.sku}] ${item.name} — Stok: ${item.stock} unit${item.stock <= 0 ? ' (HABIS)' : ''}`
                }))}
                placeholder="Pilih produk gudang..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                {mode === 'adjust' && adjustType === 'set' ? 'Stok Aktual Baru' : 'Jumlah Unit'} <span className="text-rose-500">*</span>
              </label>
              <TextInput
                type="number"
                min="1"
                required
                weight="mono"
                value={quantity}
                onChange={setQuantity}
                placeholder={mode === 'out' && currentProduct ? `Maks ${currentProduct.stock} unit` : 'Contoh: 25'}
              />
            </div>
          </div>

          {/* Preview produk */}
          {currentProduct && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-xs flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-neutral-900 truncate">{currentProduct.name}</div>
                <div className="font-mono text-neutral-500 mt-0.5">
                  SKU: {currentProduct.sku} • Stok Saat Ini: {currentProduct.stock} unit
                </div>
              </div>
              {mode === 'out' && qtyNumber > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-neutral-500">Stok Sesudah</div>
                  <div className={`font-mono font-black ${remainingAfter === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {remainingAfter} unit
                  </div>
                </div>
              )}
              {mode === 'in' && totalCost > 0 && (
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-neutral-500">Total Pengadaan</div>
                  <div className="font-mono font-black text-amber-900">{formatRupiah(totalCost)}</div>
                </div>
              )}
            </div>
          )}

          {/* Mode IN: detail pengadaan */}
          {mode === 'in' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Harga Modal Beli / Unit
                  </label>
                  <TextInput
                    type="number"
                    min="0"
                    weight="mono"
                    value={costPrice}
                    onChange={setCostPrice}
                    placeholder="Contoh: 150000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Nama Supplier / Vendor
                  </label>
                  <ServerSideSelect
                    value={supplier}
                    onChange={(val) => setSupplier(val)}
                    options={mockSuppliers.map((s) => ({ value: s, label: s }))}
                    placeholder="Pilih supplier/vendor..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    No. PO / Surat Jalan
                  </label>
                  <TextInput
                    type="text"
                    weight="mono"
                    value={poNumber}
                    onChange={setPoNumber}
                    placeholder="PO/2026/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Lokasi Rak Penyimpanan
                  </label>
                  <TextInput
                    type="text"
                    value={warehouseBin}
                    onChange={setWarehouseBin}
                    placeholder="Gudang A - Rak B02"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Tanggal Kedatangan
                  </label>
                  <TextInput
                    type="date"
                    weight="mono"
                    value={arrivalDate}
                    onChange={setArrivalDate}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Petugas Penerima Gudang
                  </label>
                  <TextInput
                    type="text"
                    value={operator}
                    onChange={setOperator}
                    placeholder="Nama pemeriksa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Catatan Restock
                  </label>
                  <TextInput
                    type="text"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Batch baru, packaging aman, QC lolos"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                <Checkbox
                  checked={syncToCashflow}
                  onChange={setSyncToCashflow}
                  className="mt-0.5"
                />
                <span className="text-xs text-neutral-700">
                  <span className="font-bold text-neutral-900">Catat otomatis ke laporan keuangan</span> sebagai kas keluar
                  kategori &quot;Pengadaan Stok Produk&quot; sebesar {formatRupiah(totalCost || 0)}.
                </span>
              </label>
            </>
          )}

          {/* Mode OUT: alasan pengurangan */}
          {mode === 'out' && (
            <>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Alasan Pengurangan Stok
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {reductionReasons.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => handleReasonChange(reason.id)}
                      className={`p-2.5 rounded-none border text-left text-xs font-bold transition-all cursor-pointer ${
                        reasonId === reason.id
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    No. Berita Acara / Referensi
                  </label>
                  <TextInput
                    type="text"
                    weight="mono"
                    value={reference}
                    onChange={setReference}
                    placeholder="BA-DED/..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Petugas Penanggung Jawab
                  </label>
                  <TextInput
                    type="text"
                    value={operator}
                    onChange={setOperator}
                    placeholder="Nama pemeriksa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Tanggal Penarikan
                  </label>
                  <TextInput
                    type="date"
                    weight="mono"
                    value={deductionDate}
                    onChange={setDeductionDate}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Keterangan / Detail Kondisi
                </label>
                <TextInput
                  type="text"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Jelaskan alasan dan kondisi fisik..."
                />
              </div>
            </>
          )}

          {/* Mode ADJUST: jenis penyesuaian */}
          {mode === 'adjust' && (
            <>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Jenis Penyesuaian
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'in', label: '+ Tambah' },
                    { id: 'out', label: '- Kurang' },
                    { id: 'set', label: '= Set Aktual' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdjustType(opt.id)}
                      className={`py-2 text-[11px] font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                        adjustType === opt.id ? 'bg-neutral-950 text-white border-neutral-950' : 'bg-neutral-50 text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan Alasan Penyesuaian
                </label>
                <TextInput
                  type="text"
                  value={notes}
                  onChange={setNotes}
                  placeholder="Contoh: Hasil temuan audit fisik..."
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-neutral-200 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
            >
              <Save size={15} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi Stok'}</span>
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
        title="Panduan Mutasi Stok"
        tips={[
          { icon: Boxes, heading: 'Pilih Produk & Cek Stok', text: 'Pilih produk yang tepat lalu periksa stok saat ini pada panel pratinjau sebelum mengisi jumlah unit.' },
          { icon: PlusCircle, heading: 'Mode Stok Masuk', text: 'Gunakan mode masuk untuk penerimaan restok dari supplier beserta harga modal dan tanggal kedatangan.' },
          { icon: MinusCircle, heading: 'Mode Stok Keluar', text: 'Gunakan mode keluar untuk barang rusak, sampel promosi, atau selisih fisik; jumlah tidak boleh melebihi stok tersedia.' },
          { icon: Edit3, heading: 'Nomor PO & Berita Acara', text: 'Cantumkan nomor PO/surat jalan atau nomor berita acara agar setiap mutasi mudah ditelusuri saat audit.' },
          { icon: Check, heading: 'Sinkronisasi Kas', text: 'Aktifkan pencatatan otomatis ke laporan keuangan agar nilai pengadaan restok tercatat sebagai kas keluar.' }
        ]}
      />
      </div>
    </div>
  );
}
