import React, { useState } from 'react';
import {
  Boxes,
  PlusCircle,
  Truck,
  Building,
  DollarSign,
  Calendar,
  FileText,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

const mockSuppliers = [
  'PT AeroTech Industri Garment (Bandung)',
  'Tusko Manufacturing Hub (Jakarta)',
  'NitroFoam Athletic Shoes Distributor (Surabaya)',
  'Apex Gear & Hardware Supplier (Tangerang)',
  'Distributor Utama Perlengkapan Olahraga Nasional'
];

export default function AddStockModal({
  isOpen = false,
  onClose = () => {},
  inventory = [],
  preselectedProductId = null,
  onSaveRestock = () => {}
}) {
  const defaultProduct = inventory.find((p) => p.id === preselectedProductId) || inventory[0];
  
  const [selectedProductId, setSelectedProductId] = useState(defaultProduct ? defaultProduct.id : '');
  const [quantity, setQuantity] = useState('');
  const [costPrice, setCostPrice] = useState(defaultProduct ? defaultProduct.cost_price || '' : '');
  const [supplier, setSupplier] = useState(mockSuppliers[0]);
  const [poNumber, setPoNumber] = useState(
    `PO/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [warehouseBin, setWarehouseBin] = useState(defaultProduct ? defaultProduct.warehouse_bin || 'Gudang A - Rak B01' : 'Gudang A - Rak B01');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [operator, setOperator] = useState('Budi Santoso (Kepala Gudang)');
  const [notes, setNotes] = useState('');
  const [syncToCashflow, setSyncToCashflow] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const currentSelectedProduct = inventory.find((p) => p.id === Number(selectedProductId)) || inventory[0];

  const handleProductChange = (productId) => {
    setSelectedProductId(productId);
    const prod = inventory.find((p) => p.id === Number(productId));
    if (prod) {
      setCostPrice(prod.cost_price || '');
      if (prod.warehouse_bin) setWarehouseBin(prod.warehouse_bin);
    }
  };

  const totalCost = (Number(quantity) || 0) * (Number(costPrice) || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentSelectedProduct || !quantity || Number(quantity) <= 0) return;

    const restockData = {
      product: currentSelectedProduct,
      quantity: Number(quantity),
      costPrice: Number(costPrice) || currentSelectedProduct.cost_price || 0,
      totalCost,
      supplier,
      poNumber: poNumber.trim() || `PO-${Date.now()}`,
      warehouseBin,
      arrivalDate,
      operator,
      notes: notes.trim() || `Restock barang masuk dari ${supplier}`,
      syncToCashflow
    };

    onSaveRestock(restockData);
    setSuccessMessage(`Berhasil menambahkan +${quantity} unit stok untuk ${currentSelectedProduct.sku}!`);

    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="text-amber-400" size={20} />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Tambah Stok Masuk (Restock Supplier)</h3>
              <p className="text-[11px] text-neutral-400">Penerimaan barang dari supplier & update safety stock gudang</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block font-bold text-gray-700 mb-1.5">Pilih Produk Yang Di-restock</label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-900 text-xs sm:text-sm"
              required
            >
              {inventory.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.sku}] {item.name} — Stok Saat Ini: {item.stock} unit
                </option>
              ))}
            </select>
          </div>

          {/* Current Product Preview Card */}
          {currentSelectedProduct && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <img
                src={currentSelectedProduct.image_url}
                alt={currentSelectedProduct.name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0 bg-white"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 line-clamp-1">{currentSelectedProduct.name}</div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono mt-0.5">
                  <span>SKU: {currentSelectedProduct.sku}</span>
                  <span>•</span>
                  <span>Stok: {currentSelectedProduct.stock} unit</span>
                  <span>•</span>
                  <span className="text-amber-700 font-bold">Min: {currentSelectedProduct.stock_minimum} unit</span>
                </div>
              </div>
            </div>
          )}

          {/* Quantity & Cost Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">
                Jumlah Masuk (Unit) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Contoh: 25"
                  required
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-900"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">unit</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Harga Modal Beli / Unit</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-gray-400 text-xs">Rp</span>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-bold text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Total Pembelian Summary Box */}
          {totalCost > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-semibold text-amber-900">
              <span className="flex items-center gap-1.5">
                <DollarSign size={15} className="text-amber-600" />
                Total Nilai Pengadaan Barang:
              </span>
              <span className="font-black text-sm text-amber-950">{formatRupiah(totalCost)}</span>
            </div>
          )}

          {/* Supplier & PO Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Nama Supplier / Vendor</label>
              <select
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 font-medium text-gray-800 text-xs"
              >
                {mockSuppliers.map((s, idx) => (
                  <option key={idx} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">No. Purchase Order / Surat Jalan</label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO/2026/..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 font-mono text-xs"
              />
            </div>
          </div>

          {/* Lokasi Gudang & Tanggal Masuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Lokasi Rak Penyimpanan</label>
              <input
                type="text"
                value={warehouseBin}
                onChange={(e) => setWarehouseBin(e.target.value)}
                placeholder="Gudang A - Rak B02"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Tanggal Kedatangan Barang</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 text-xs"
              />
            </div>
          </div>

          {/* Petugas Penerima & Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Petugas Penerima Gudang</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nama pemeriksa"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1.5">Catatan Restock</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Batch baru, packaging aman, QC lolos"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-amber-500 text-gray-900 text-xs"
              />
            </div>
          </div>

          {/* Sync to Cashflow Checkbox */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToCashflow}
                onChange={(e) => setSyncToCashflow(e.target.checked)}
                className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
              />
              <div>
                <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                  <CreditCard size={14} className="text-neutral-700" />
                  <span>Catat Otomatis ke Laporan Transaksi Keuangan</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Mencatat kas keluar (expense) kategori "Pengadaan Stok Produk" sebesar {formatRupiah(totalCost || 0)} ke buku kas toko.
                </p>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle size={15} />
              <span>Simpan & Tambah Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
