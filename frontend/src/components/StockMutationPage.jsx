import React, { useState, useMemo, useEffect } from 'react';
import {
  Boxes,
  ArrowLeft,
  Check,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Edit3,
  Save,
  X,
  Layers,
  ShoppingBag,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import Checkbox from './molecules/Checkbox';
import { formatRupiah } from '../utils/formatters';
import { vendorService } from '../services/vendorService';
import { inventoryService } from '../services/inventoryService';
import { productService } from '../services/productService';
import FormTipsPanel from './organisms/FormTipsPanel';

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
  const [freshProduct, setFreshProduct] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Variant Rows state: array of { id, is_variant, sku, name, current_stock, mutation_quantity, available_for_sale, initial_available }
  const [variantRows, setVariantRows] = useState([]);

  // Mode IN fields
  const [costPrice, setCostPrice] = useState(defaultProduct ? defaultProduct.cost_price || '' : '');
  const [supplier, setSupplier] = useState('');
  const [poNumber, setPoNumber] = useState(
    `PO/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [warehouseBin, setWarehouseBin] = useState(defaultProduct ? defaultProduct.warehouse_bin || '' : '');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [operator, setOperator] = useState('');
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

  // Fetch full details of selected product (including variants)
  useEffect(() => {
    if (!selectedProductId) return;
    let isCancelled = false;
    inventoryService.getItem(selectedProductId)
      .then((res) => {
        if (!isCancelled && res?.data) {
          setFreshProduct(res.data);
        }
      })
      .catch(() => {
        // fallback to inventory prop
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedProductId]);

  const activeProduct = useMemo(() => {
    if (freshProduct && freshProduct.id === Number(selectedProductId)) {
      return freshProduct;
    }
    return inventory.find((p) => p.id === Number(selectedProductId)) || inventory[0] || null;
  }, [freshProduct, inventory, selectedProductId]);

  // Sync variantRows when activeProduct changes
  useEffect(() => {
    if (!activeProduct) {
      setVariantRows([]);
      return;
    }

    if (Array.isArray(activeProduct.variants) && activeProduct.variants.length > 0) {
      const rows = activeProduct.variants.map((v) => {
        const stock = Number(v.stock ?? 0);
        const avail = v.available_for_sale_stock !== null && v.available_for_sale_stock !== undefined
          ? Number(v.available_for_sale_stock)
          : (v.effective_available_stock !== undefined ? Number(v.effective_available_stock) : stock);
        return {
          id: v.id,
          is_variant: true,
          sku: v.sku || activeProduct.sku,
          name: v.variant_name || v.name || `Varian #${v.id}`,
          current_stock: stock,
          mutation_quantity: '',
          available_for_sale: avail,
          initial_available: avail,
        };
      });
      setVariantRows(rows);
    } else {
      const stock = Number(activeProduct.stock ?? 0);
      const avail = activeProduct.available_for_sale_stock !== null && activeProduct.available_for_sale_stock !== undefined
        ? Number(activeProduct.available_for_sale_stock)
        : (activeProduct.effective_available_stock !== undefined ? Number(activeProduct.effective_available_stock) : stock);
      setVariantRows([
        {
          id: activeProduct.id,
          is_variant: false,
          sku: activeProduct.sku,
          name: `${activeProduct.name} (Produk Standar / Non-Varian)`,
          current_stock: stock,
          mutation_quantity: '',
          available_for_sale: avail,
          initial_available: avail,
        }
      ]);
    }
  }, [activeProduct]);

  // Handler for row mutation quantity change
  const handleRowQtyChange = (idx, val) => {
    setVariantRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[idx], mutation_quantity: val };
      const qtyNum = Number(val) || 0;

      let newPhys = row.current_stock;
      if (mode === 'in') {
        newPhys = row.current_stock + qtyNum;
      } else if (mode === 'out') {
        newPhys = Math.max(0, row.current_stock - qtyNum);
      } else {
        newPhys = adjustType === 'in' ? row.current_stock + qtyNum : (adjustType === 'out' ? Math.max(0, row.current_stock - qtyNum) : qtyNum);
      }

      // If physical stock is 0, available stock must be 0
      if (newPhys <= 0) {
        row.available_for_sale = 0;
      } else if (row.available_for_sale > newPhys) {
        // Cap available stock to new physical stock
        row.available_for_sale = newPhys;
      } else if (row.available_for_sale === 0 && row.initial_available === 0 && mode === 'in' && qtyNum > 0) {
        // Auto-suggest available stock when restocked from 0
        row.available_for_sale = newPhys;
      }

      updated[idx] = row;
      return updated;
    });
    setError('');
  };

  // Handler for row available for sale change
  const handleRowAvailableChange = (idx, val) => {
    setVariantRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[idx] };
      const valNum = val === '' ? '' : Math.max(0, Number(val) || 0);
      row.available_for_sale = valNum;
      updated[idx] = row;
      return updated;
    });
    setError('');
  };

  // Set all available stock to match each row's new physical stock
  const handleSyncAllAvailableToPhysical = () => {
    setVariantRows((prev) =>
      prev.map((r) => {
        const qtyNum = Number(r.mutation_quantity) || 0;
        let newPhys = r.current_stock;
        if (mode === 'in') newPhys += qtyNum;
        else if (mode === 'out') newPhys = Math.max(0, newPhys - qtyNum);
        else newPhys = adjustType === 'in' ? newPhys + qtyNum : (adjustType === 'out' ? Math.max(0, newPhys - qtyNum) : qtyNum);

        return {
          ...r,
          available_for_sale: Math.max(0, newPhys)
        };
      })
    );
  };

  const totalMutationQty = useMemo(() => {
    return variantRows.reduce((acc, r) => acc + (Number(r.mutation_quantity) || 0), 0);
  }, [variantRows]);

  const totalNewPhysicalStock = useMemo(() => {
    return variantRows.reduce((acc, r) => {
      const qtyNum = Number(r.mutation_quantity) || 0;
      let newPhys = r.current_stock;
      if (mode === 'in') newPhys += qtyNum;
      else if (mode === 'out') newPhys = Math.max(0, newPhys - qtyNum);
      else newPhys = adjustType === 'in' ? newPhys + qtyNum : (adjustType === 'out' ? Math.max(0, newPhys - qtyNum) : qtyNum);
      return acc + Math.max(0, newPhys);
    }, 0);
  }, [variantRows, mode, adjustType]);

  const totalAvailableForSale = useMemo(() => {
    return variantRows.reduce((acc, r) => acc + (Number(r.available_for_sale) || 0), 0);
  }, [variantRows]);

  const totalCost = mode === 'in' ? totalMutationQty * (Number(costPrice) || 0) : 0;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!activeProduct) {
      setError('Pilih produk terlebih dahulu.');
      return;
    }
    if (variantRows.length === 0) {
      setError('Tidak ada data varian / produk untuk dimutasi.');
      return;
    }

    // Validasi alokasi etalase dan kuantitas per baris
    for (const row of variantRows) {
      const qty = Number(row.mutation_quantity) || 0;
      let newPhys = row.current_stock;
      if (mode === 'in') newPhys += qty;
      else if (mode === 'out') newPhys = Math.max(0, newPhys - qty);
      else {
        newPhys = adjustType === 'in' ? newPhys + qty : (adjustType === 'out' ? Math.max(0, newPhys - qty) : qty);
      }

      const avail = Number(row.available_for_sale) || 0;

      if (newPhys <= 0 && avail > 0) {
        setError(`Alokasi etalase untuk "${row.name}" tidak dapat diisi (${avail} unit) karena stok fisik 0. Wajib memiliki stok fisik terlebih dahulu.`);
        return;
      }

      if (avail > newPhys) {
        setError(`Alokasi etalase untuk "${row.name}" (${avail} unit) melebihi estimasi stok fisik (${newPhys} unit).`);
        return;
      }

      if (mode === 'out' && qty > row.current_stock) {
        setError(`Pengurangan unit untuk "${row.name}" (${qty} unit) melebihi stok yang tersedia (${row.current_stock} unit).`);
        return;
      }
    }

    const hasMutation = totalMutationQty > 0;
    const hasAvailableStockChange = variantRows.some(
      (r) => Number(r.available_for_sale) !== Number(r.initial_available)
    );

    if (!hasMutation && !hasAvailableStockChange) {
      setError(
        mode === 'in'
          ? 'Masukkan jumlah unit restok pada minimal satu varian, atau sesuaikan alokasi stok etalase.'
          : 'Masukkan jumlah unit pengurangan stok atau sesuaikan alokasi etalase.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'in') {
        const itemsPayload = variantRows.map((r) => {
          const qty = Number(r.mutation_quantity) || 0;
          const newPhys = r.current_stock + qty;
          const avail = newPhys <= 0 ? 0 : Math.min(newPhys, Number(r.available_for_sale) || 0);
          return {
            product_variant_id: r.is_variant ? r.id : null,
            variant_id: r.is_variant ? r.id : null,
            quantity: qty,
            available_for_sale_stock: avail,
          };
        });

        await inventoryService.addStock(activeProduct.id, {
          items: itemsPayload,
          cost_price: Number(costPrice) || 0,
          supplier: supplier || null,
          po_number: poNumber.trim() || null,
          warehouse_bin: warehouseBin.trim() || null,
          notes: notes.trim() || null,
          operator: operator.trim() || null,
          sync_to_cashflow: syncToCashflow,
        });

        // Update kuota etalase via product catalog API
        if (activeProduct.has_variants) {
          await productService.updateAvailableStock(activeProduct.id, {
            variants: variantRows.map((r) => ({
              id: r.id,
              available_for_sale_stock: Number(r.available_for_sale) || 0,
            })),
          });
        } else {
          await productService.updateAvailableStock(activeProduct.id, {
            available_for_sale_stock: Number(variantRows[0]?.available_for_sale) || 0,
          });
        }

        onShowToast(`Stok restok & alokasi etalase untuk ${activeProduct.name} berhasil disimpan.`);
      } else if (mode === 'out') {
        const selectedReason = reductionReasons.find((r) => r.id === reasonId) || reductionReasons[0];
        for (const r of variantRows) {
          const qty = Number(r.mutation_quantity) || 0;
          if (qty > 0) {
            await inventoryService.reduceStock(activeProduct.id, {
              product_variant_id: r.is_variant ? r.id : null,
              quantity: qty,
              reason: reasonId,
              reference: reference.trim() || null,
              notes: notes.trim() || selectedReason.label,
              operator: operator.trim() || null,
            });
          }
        }

        // Update kuota etalase
        if (activeProduct.has_variants) {
          await productService.updateAvailableStock(activeProduct.id, {
            variants: variantRows.map((r) => ({
              id: r.id,
              available_for_sale_stock: Number(r.available_for_sale) || 0,
            })),
          });
        } else {
          await productService.updateAvailableStock(activeProduct.id, {
            available_for_sale_stock: Number(variantRows[0]?.available_for_sale) || 0,
          });
        }

        onShowToast(`Stok fisik ${activeProduct.name} berhasil dikurangi & kuota etalase disesuaikan.`);
      } else {
        // Mode adjust
        for (const r of variantRows) {
          const qty = Number(r.mutation_quantity) || 0;
          let delta = 0;
          if (adjustType === 'in') {
            delta = qty;
          } else if (adjustType === 'out') {
            delta = -qty;
          } else {
            delta = qty - r.current_stock;
          }

          if (delta > 0) {
            await inventoryService.addStock(activeProduct.id, {
              product_variant_id: r.is_variant ? r.id : null,
              quantity: delta,
              sync_to_cashflow: false,
              notes: notes.trim() || 'Penyesuaian stok manual (tambah)',
              operator: operator.trim() || null,
            });
          } else if (delta < 0) {
            await inventoryService.reduceStock(activeProduct.id, {
              product_variant_id: r.is_variant ? r.id : null,
              quantity: Math.abs(delta),
              reason: 'other',
              notes: notes.trim() || 'Penyesuaian stok manual (kurang)',
              operator: operator.trim() || null,
            });
          }
        }

        // Update kuota etalase
        if (activeProduct.has_variants) {
          await productService.updateAvailableStock(activeProduct.id, {
            variants: variantRows.map((r) => ({
              id: r.id,
              available_for_sale_stock: Number(r.available_for_sale) || 0,
            })),
          });
        } else {
          await productService.updateAvailableStock(activeProduct.id, {
            available_for_sale_stock: Number(variantRows[0]?.available_for_sale) || 0,
          });
        }

        onShowToast(`Penyesuaian stok & kuota etalase ${activeProduct.name} berhasil disimpan.`);
      }

      onSaveMutation({ kind: mode });
      onNavigateBack();
    } catch (err) {
      setError(err?.message || 'Gagal menyimpan mutasi stok. Silakan periksa kembali data Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card (Aturan 25: Kartu Header Kanonis) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Stok" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
              {meta.title}
            </h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('stock-form')?.requestSubmit()}
            title="Simpan Mutasi Stok"
            variant="primary"
          />
        </div>
      </div>

      {/* Form + Tips (3/4 form + 1/4 tips — Aturan 24) */}
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
                <button
                  type="button"
                  onClick={() => setError('')}
                  className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0 ml-3"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 1. Pilih Produk */}
            <div>
              <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                Pilih Produk Gudang <span className="text-rose-500">*</span>
              </label>
              <ServerSideSelect
                value={selectedProductId}
                onChange={(val) => handleProductChange(val)}
                options={inventory.map((item) => ({
                  value: item.id,
                  label: `[${item.sku}] ${item.name} — Stok Fisik: ${item.stock} unit | Etalase: ${item.effective_available_stock ?? item.stock} unit${item.stock <= 0 ? ' (HABIS)' : ''}`
                }))}
                placeholder="Pilih produk gudang..."
                required
              />
            </div>

            {/* 2. TABEL MATRIKS VARIAN & ALOKASI STOK ETALASE */}
            {activeProduct && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                    <Boxes size={16} className="text-amber-500" />
                    <span>
                      Rincian Stok Varian &amp; Alokasi Etalase ({variantRows.length} {activeProduct.has_variants ? 'Varian' : 'Item'})
                    </span>
                  </h2>
                  {variantRows.length > 0 && mode === 'in' && (
                    <button
                      type="button"
                      onClick={handleSyncAllAvailableToPhysical}
                      className="px-2.5 py-1 text-[11px] font-sport font-bold uppercase tracking-wider bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 rounded-none transition-colors cursor-pointer self-start sm:self-auto"
                      title="Alokasikan 100% estimasi stok fisik baru ke etalase untuk seluruh varian"
                    >
                      Maksimal Semua ke Etalase
                    </button>
                  )}
                </div>

                {/* Callout Informasi Available Stock for Sale */}
                <div className="p-3 bg-amber-50/60 border border-amber-200 text-xs flex items-start gap-2.5 text-neutral-800 rounded-none">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-neutral-700 leading-relaxed">
                    <strong className="text-neutral-950 font-sport uppercase">Mekanisme Available Stock for Sale:</strong>{' '}
                    Kolom <strong>Available Stock for Sale</strong> menentukan kuota unit varian yang dapat dibeli oleh customer di etalase toko online.
                    Syarat pengisian kuota etalase adalah varian <strong>wajib memiliki estimasi stok fisik &gt; 0</strong> dan nilainya <strong>tidak boleh melebihi stok fisik</strong>.
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto border border-neutral-300 rounded-none">
                  <table className="w-full text-left border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-neutral-950 text-white text-[11px] font-sport font-black uppercase tracking-wider">
                        <th className="py-2.5 px-3.5 border-b border-neutral-800">Variant Product</th>
                        <th className="py-2.5 px-3 border-b border-neutral-800 text-center w-28">Stok Fisik Saat Ini</th>
                        <th className="py-2.5 px-3 border-b border-neutral-800 text-center w-36">
                          {mode === 'in' ? 'Tambah Stok (+)' : mode === 'out' ? 'Kurangi Stok (-)' : 'Penyesuaian (+/-)'}
                        </th>
                        <th className="py-2.5 px-3 border-b border-neutral-800 text-center w-32">Stok Fisik Baru</th>
                        <th className="py-2.5 px-3.5 border-b border-neutral-800 w-56">
                          <div className="flex items-center gap-1.5">
                            <span>Available Stock for Sale</span>
                            <span className="text-[10px] text-amber-400 font-normal lowercase">(siap jual)</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 text-xs bg-white">
                      {variantRows.map((row, idx) => {
                        const qtyNum = Number(row.mutation_quantity) || 0;
                        let newPhys = row.current_stock;
                        if (mode === 'in') newPhys += qtyNum;
                        else if (mode === 'out') newPhys = Math.max(0, newPhys - qtyNum);
                        else newPhys = adjustType === 'in' ? newPhys + qtyNum : (adjustType === 'out' ? Math.max(0, newPhys - qtyNum) : qtyNum);

                        const hasPhysicalStock = newPhys > 0;
                        const isOverAllocated = Number(row.available_for_sale) > newPhys;

                        return (
                          <tr key={row.id || idx} className="hover:bg-neutral-50/70 transition-colors">
                            {/* 1. Variant Product Name & SKU */}
                            <td className="py-3 px-3.5 align-middle">
                              <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5 flex-wrap">
                                <span>{row.name}</span>
                                {row.is_variant ? (
                                  <span className="px-1.5 py-0.5 bg-neutral-900 text-amber-400 font-sport font-bold text-[10px] uppercase rounded-none">
                                    Varian
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-700 font-sport font-bold text-[10px] uppercase rounded-none">
                                    Standar
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-neutral-500 mt-0.5">
                                SKU: {row.sku}
                              </div>
                            </td>

                            {/* 2. Stok Fisik Saat Ini */}
                            <td className="py-3 px-3 align-middle text-center">
                              <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-1 rounded-none border border-neutral-200">
                                {row.current_stock} unit
                              </span>
                            </td>

                            {/* 3. Input Kuantitas Mutasi */}
                            <td className="py-3 px-3 align-middle text-center">
                              <TextInput
                                type="number"
                                min="0"
                                max={mode === 'out' ? String(row.current_stock) : undefined}
                                weight="mono"
                                value={row.mutation_quantity}
                                onChange={(val) => handleRowQtyChange(idx, val)}
                                placeholder="0"
                                className="!h-9 !py-1 text-center"
                              />
                            </td>

                            {/* 4. Estimasi Stok Fisik Baru */}
                            <td className="py-3 px-3 align-middle text-center">
                              {newPhys === row.current_stock ? (
                                <span className="font-mono text-neutral-600 font-bold">
                                  {newPhys} unit
                                </span>
                              ) : newPhys > row.current_stock ? (
                                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-300 rounded-none">
                                  {newPhys} unit (+{newPhys - row.current_stock})
                                </span>
                              ) : (
                                <span className="font-mono font-black text-rose-700 bg-rose-50 px-2 py-1 border border-rose-300 rounded-none">
                                  {newPhys} unit ({newPhys - row.current_stock})
                                </span>
                              )}
                            </td>

                            {/* 5. Available Stock for Sale (Stok Siap Jual) */}
                            <td className="py-3 px-3.5 align-middle">
                              {!hasPhysicalStock ? (
                                <div className="p-1.5 bg-neutral-100 border border-neutral-300 text-neutral-500 text-[11px] font-sport font-bold uppercase rounded-none flex items-center gap-1.5">
                                  <AlertCircle size={13} className="text-neutral-400 shrink-0" />
                                  <span>Stok 0 (Wajib Restok Fisik)</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <TextInput
                                      type="number"
                                      min="0"
                                      max={String(newPhys)}
                                      weight="mono"
                                      value={row.available_for_sale}
                                      onChange={(val) => handleRowAvailableChange(idx, val)}
                                      placeholder="0"
                                      className={`!h-9 !py-1 w-24 text-center ${
                                        isOverAllocated ? '!border-rose-500 !bg-rose-50' : ''
                                      }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRowAvailableChange(idx, newPhys)}
                                      title="Set kuota etalase sama dengan stok fisik baru"
                                      className="px-2 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 text-[10px] font-sport font-black uppercase tracking-wider rounded-none cursor-pointer shrink-0 transition-colors"
                                    >
                                      Maks
                                    </button>
                                    <span className="text-[11px] text-neutral-500 font-mono">
                                      / {newPhys} unit
                                    </span>
                                  </div>
                                  {isOverAllocated && (
                                    <div className="text-[10px] font-bold text-rose-600 font-sport uppercase">
                                      Maksimal {newPhys} unit!
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-neutral-100 border-t-2 border-neutral-300 text-xs font-bold text-neutral-900">
                        <td className="py-3 px-3.5 font-sport uppercase font-black">
                          Total Ringkasan Matriks
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {variantRows.reduce((a, b) => a + b.current_stock, 0)} unit
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-amber-700">
                          {totalMutationQty > 0 ? `+${totalMutationQty} unit` : '0 unit'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-700">
                          {totalNewPhysicalStock} unit
                        </td>
                        <td className="py-3 px-3.5 font-mono font-black text-neutral-950">
                          <span className="bg-amber-100 px-2 py-0.5 border border-amber-300">
                            {totalAvailableForSale} unit siap jual
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Mode IN: Informasi Pengadaan & Supplier */}
            {mode === 'in' && (
              <div className="space-y-4 pt-3 border-t border-neutral-200">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <ShoppingBag size={16} className="text-amber-500" />
                  <span>Informasi Pengadaan &amp; Biaya Masuk</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                      Harga Modal Beli / Unit (HPP)
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
                      loadOptions={(search, page) => vendorService.loadOptions(search, page)}
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

                <label className="flex items-start gap-2.5 cursor-pointer p-3.5 bg-neutral-50 border border-neutral-300 rounded-none">
                  <Checkbox
                    checked={syncToCashflow}
                    onChange={setSyncToCashflow}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-neutral-700">
                    <span className="font-bold text-neutral-900">Catat otomatis ke laporan keuangan</span> sebagai kas keluar
                    kategori &quot;Pengadaan Stok Produk&quot; sebesar{' '}
                    <strong className="text-neutral-950 font-mono">{formatRupiah(totalCost || 0)}</strong>{' '}
                    ({totalMutationQty} unit x {formatRupiah(Number(costPrice) || 0)}).
                  </span>
                </label>
              </div>
            )}

            {/* Mode OUT: Alasan Pengurangan */}
            {mode === 'out' && (
              <div className="space-y-4 pt-3 border-t border-neutral-200">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <MinusCircle size={16} className="text-rose-600" />
                  <span>Alasan Pengurangan &amp; Berita Acara</span>
                </h2>

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
                    Keterangan / Detail Kondisi Fisik
                  </label>
                  <TextInput
                    type="text"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Jelaskan alasan dan kondisi fisik..."
                  />
                </div>
              </div>
            )}

            {/* Mode ADJUST: Jenis Penyesuaian */}
            {mode === 'adjust' && (
              <div className="space-y-4 pt-3 border-t border-neutral-200">
                <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <Edit3 size={16} className="text-amber-500" />
                  <span>Jenis Penyesuaian Stok Manual</span>
                </h2>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Arah Penyesuaian
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'in', label: '+ Tambah Stok' },
                      { id: 'out', label: '- Kurangi Stok' },
                      { id: 'set', label: '= Set Nilai Aktual' }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAdjustType(opt.id)}
                        className={`py-2 text-[11px] font-sport font-black uppercase rounded-none border cursor-pointer transition-colors ${
                          adjustType === opt.id
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-300'
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
                    placeholder="Contoh: Koreksi hasil temuan audit opname gudang..."
                  />
                </div>
              </div>
            )}

            {/* Action Buttons (Submit & Cancel) */}
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none disabled:opacity-50"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Menyimpan Mutasi...' : 'Simpan Mutasi Stok & Alokasi Etalase'}</span>
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

        {/* 3. Panel Tips (1/4 Grid — Aturan 24) */}
        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Mutasi Stok"
          tips={[
            {
              icon: Boxes,
              heading: 'Matriks Varian Produk',
              text: 'Setiap baris mewakili satu varian produk atau item standar. Admin dapat menginput jumlah restok dan kuota siap jual untuk tiap varian secara terpisah.'
            },
            {
              icon: ShoppingBag,
              heading: 'Available Stock for Sale',
              text: 'Syarat kuota etalase: varian wajib memiliki estimasi stok fisik > 0. Kuota siap jual tidak boleh melebihi stok fisik gudang.'
            },
            {
              icon: PlusCircle,
              heading: 'Mode Restok Masuk',
              text: 'Menerima barang masuk dari vendor/pabrik, memperbarui HPP satuan, dan menambah stok fisik pada kartu inventaris.'
            },
            {
              icon: Check,
              heading: 'Sinkronisasi Buku Kas',
              text: 'Aktifkan pencatatan otomatis ke transaksi buku kas agar total biaya pengadaan langsung tercatat sebagai pengeluaran operasional.'
            }
          ]}
        />
      </div>
    </div>
  );
}
