import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Building2,
  Calendar,
  Warehouse,
  Boxes,
  Save,
  X,
  FileText
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideSelect from './molecules/ServerSideSelect';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import { procurementService } from '../services/procurementService';
import { vendorService } from '../services/vendorService';
import { productService } from '../services/productService';
import { warehouseService } from '../services/warehouseService';
import FormTipsPanel from './organisms/FormTipsPanel';
import { formatRupiah } from '../utils/formatters';

export default function PurchaseOrderCreatePage({
  initialVendor = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    vendor_id: initialVendor?.id ? String(initialVendor.id) : '',
    warehouse_id: '',
    warehouse_name: '',
    expected_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: 'Pengadaan batch baru perlengkapan atletik.',
    orderProducts: [
      {
        id: 'prod_1',
        product_id: '',
        product_name: '',
        quick_qty: '',
        variants: []
      }
    ]
  });

  // Load vendors, warehouses, and products on mount
  useEffect(() => {
    vendorService.fetchVendors().then(res => {
      if (res?.data && res.data.length > 0) {
        setVendors(res.data);
        if (!formData.vendor_id) {
          setFormData(prev => ({
            ...prev,
            vendor_id: String(res.data[0].id)
          }));
        }
      }
    }).catch(() => {});

    warehouseService.fetchWarehouses({ is_active: 1, all: true }).then(res => {
      const list = res?.data || [];
      if (list.length > 0) {
        setWarehouses(list);
        const primary = list.find(w => w.is_primary) || list[0];
        setFormData(prev => ({
          ...prev,
          warehouse_id: String(primary.id),
          warehouse_name: `${primary.name} (${primary.code})`
        }));
      }
    }).catch(() => {});

    productService.fetchProducts({ per_page: 200, include_inactive: 1 }).then(res => {
      if (res?.data) {
        setAllProducts(res.data);
      }
    }).catch(() => {});
  }, []);

  // Filter products by vendor_id (products with no vendor_id are general and available for any vendor)
  useEffect(() => {
    if (!formData.vendor_id || allProducts.length === 0) {
      setVendorProducts(allProducts);
      return;
    }
    const filtered = allProducts.filter(p => !p.vendor_id || String(p.vendor_id) === String(formData.vendor_id));
    setVendorProducts(filtered.length > 0 ? filtered : allProducts);
  }, [formData.vendor_id, allProducts]);

  // Handle Product Addition
  const handleAddProduct = () => {
    setFormData(prev => ({
      ...prev,
      orderProducts: [
        ...prev.orderProducts,
        {
          id: `prod_${Date.now()}_${prev.orderProducts.length + 1}`,
          product_id: '',
          product_name: '',
          quick_qty: '',
          variants: []
        }
      ]
    }));
  };

  // Handle Product Removal
  const handleRemoveProduct = (prodIdx) => {
    if (formData.orderProducts.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      orderProducts: prev.orderProducts.filter((_, i) => i !== prodIdx)
    }));
  };

  // Handle Product Selection - Extracts ALL variants immediately
  const handleProductSelect = (prodIdx, productId) => {
    const product = vendorProducts.find(p => String(p.id) === String(productId));
    if (!product) {
      setFormData(prev => {
        const updated = [...prev.orderProducts];
        updated[prodIdx] = {
          id: updated[prodIdx].id,
          product_id: '',
          product_name: '',
          quick_qty: '',
          variants: []
        };
        return { ...prev, orderProducts: updated };
      });
      return;
    }

    const rawVariants = Array.isArray(product.variants) ? product.variants : [];
    const defaultCostPrice = Number(product.cost_price) || Number(product.price) || 0;

    let variantsList = [];
    if (rawVariants.length > 0) {
      variantsList = rawVariants.map((v, vIdx) => {
        const vName = v.name || [v.color, v.size].filter(Boolean).join(' / ') || `Varian ${vIdx + 1}`;
        const vSku = v.sku || (product.sku ? `${product.sku}-V${vIdx + 1}` : `TSK-SKU-${product.id}-V${vIdx + 1}`);
        const vPrice = Number(v.price) || defaultCostPrice;
        return {
          variant_id: v.id || `v_${vIdx + 1}`,
          variant_name: vName,
          sku: vSku,
          ordered_quantity: 10,
          unit_price: vPrice
        };
      });
    } else {
      variantsList = [
        {
          variant_id: 'self',
          variant_name: 'Unit Standar (Tanpa Varian)',
          sku: product.sku || `TSK-SKU-${String(product.id).padStart(5, '0')}`,
          ordered_quantity: 10,
          unit_price: defaultCostPrice
        }
      ];
    }

    setFormData(prev => {
      const updated = [...prev.orderProducts];
      updated[prodIdx] = {
        ...updated[prodIdx],
        product_id: product.id,
        product_name: product.name,
        quick_qty: '',
        variants: variantsList
      };
      return { ...prev, orderProducts: updated };
    });
  };

  // Handle Variant Field Change (Quantity or HPP)
  const handleVariantChange = (prodIdx, varIdx, field, val) => {
    setFormData(prev => {
      const updatedProducts = [...prev.orderProducts];
      const targetProduct = { ...updatedProducts[prodIdx] };
      const updatedVariants = [...targetProduct.variants];
      updatedVariants[varIdx] = {
        ...updatedVariants[varIdx],
        [field]: val
      };
      targetProduct.variants = updatedVariants;
      updatedProducts[prodIdx] = targetProduct;
      return { ...prev, orderProducts: updatedProducts };
    });
  };

  // Quick Apply Qty to All Variants of a Product
  const handleApplyQuickQty = (prodIdx) => {
    const targetProduct = formData.orderProducts[prodIdx];
    const qtyToApply = Number(targetProduct.quick_qty);
    if (isNaN(qtyToApply) || qtyToApply < 0) return;

    setFormData(prev => {
      const updatedProducts = [...prev.orderProducts];
      const p = { ...updatedProducts[prodIdx] };
      p.variants = p.variants.map(v => ({
        ...v,
        ordered_quantity: qtyToApply
      }));
      updatedProducts[prodIdx] = p;
      return { ...prev, orderProducts: updatedProducts };
    });
  };

  // Calculate Aggregates
  const allVariants = formData.orderProducts.flatMap(p =>
    (p.variants || []).map(v => ({
      ...v,
      product_id: p.product_id,
      product_name: p.product_name
    }))
  );

  const totalOrderedUnits = allVariants.reduce((sum, v) => sum + (Number(v.ordered_quantity) || 0), 0);
  const totalAmount = allVariants.reduce((sum, v) => sum + ((Number(v.ordered_quantity) || 0) * (Number(v.unit_price) || 0)), 0);

  const handleSubmit = async (e, targetStatus = 'approved') => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.vendor_id) {
      setErrorMessage('Pilih rekanan vendor terlebih dahulu.');
      return;
    }

    if (!formData.warehouse_id) {
      setErrorMessage('Pilih gudang tujuan penerimaan terlebih dahulu.');
      return;
    }

    if (formData.orderProducts.some(p => !p.product_id)) {
      setErrorMessage('Setiap blok pemesanan wajib memilih produk vendor.');
      return;
    }

    const validItemsToOrder = allVariants.filter(v => Number(v.ordered_quantity) > 0);

    if (validItemsToOrder.length === 0) {
      setErrorMessage('Minimal salah satu varian/produk harus memiliki Qty dipesan lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const vendor = vendors.find(v => String(v.id) === String(formData.vendor_id)) || vendors[0];
      const selectedWh = warehouses.find(w => String(w.id) === String(formData.warehouse_id)) || warehouses[0];
      const warehouseId = selectedWh ? selectedWh.id : (Number(formData.warehouse_id) || 1);
      const warehouseName = selectedWh ? `${selectedWh.name} (${selectedWh.code})` : (formData.warehouse_name || 'Gudang Utama');

      const poRecord = {
        vendor_id: vendor ? vendor.id : 1,
        vendor_name: vendor ? (vendor.company_name || vendor.name) : 'Supplier Partner',
        warehouse_id: warehouseId,
        warehouse_name: warehouseName,
        status: targetStatus,
        expected_delivery_date: formData.expected_delivery_date,
        total_amount: totalAmount,
        notes: formData.notes || 'Pengadaan batch baru perlengkapan atletik.',
        items: validItemsToOrder.map((it, idx) => ({
          id: Date.now() + idx,
          product_id: it.product_id || null,
          product_name: it.product_name || 'Produk Tusko Performance',
          variant_id: it.variant_id !== 'self' ? (it.variant_id || null) : null,
          variant_name: it.variant_name || '-',
          sku: it.sku || `TSK-GEN-${Date.now().toString().slice(-4)}`,
          ordered_quantity: Number(it.ordered_quantity),
          received_quantity: 0,
          unit_price: Number(it.unit_price) || 0,
          subtotal: Number(it.ordered_quantity) * (Number(it.unit_price) || 0)
        }))
      };

      const created = await procurementService.createPurchaseOrder(poRecord);
      onShowToast(
        targetStatus === 'draft'
          ? `Draft Purchase Order ${created.po_number} berhasil disimpan.`
          : `Purchase Order ${created.po_number} berhasil diterbitkan dan diotorisasi.`
      );
      onNavigateBack();
    } catch (err) {
      setErrorMessage(err.message || 'Gagal menerbitkan Purchase Order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} tooltip="Kembali ke Antrean PO" variant="outline" />
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Penerbitan Purchase Order Baru</h1>
          </div>
        </div>
        {/* Header Action Buttons (Icon-Only with Tooltip) */}
        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} tooltip="Batal" variant="secondary" />
          <IconButton icon={Save} onClick={() => handleSubmit(null, 'approved')} tooltip="Terbitkan & Otorisasi Langsung" variant="primary" />
        </div>
      </div>

      {/* Konten Form + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Form Card */}
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs lg:col-span-3">
          <form id="po-form" onSubmit={(e) => handleSubmit(e, 'approved')} className="space-y-6">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button type="button" onClick={() => setErrorMessage('')} className="cursor-pointer text-rose-600 hover:text-rose-800 shrink-0 ml-3">
                  ✕
                </button>
              </div>
            )}

            {/* Section 1: Informasi Vendor & Pengiriman */}
            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Building2 size={16} className="text-amber-500" />
                <span>1. Vendor &amp; Jadwal Pengiriman</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Pilih Rekanan Vendor <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    value={formData.vendor_id}
                    onChange={(val) => setFormData({ ...formData, vendor_id: val })}
                    options={vendors.map(v => ({
                      value: v.id,
                      label: `${v.company_name || v.name} (${v.code || 'VND'})`
                    }))}
                    placeholder="Pilih vendor pengadaan..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Perkiraan Tgl Kirim Tiba <span className="text-rose-500">*</span>
                  </label>
                  <TextInput
                    type="date"
                    required
                    weight="mono"
                    value={formData.expected_delivery_date}
                    onChange={(val) => setFormData({ ...formData, expected_delivery_date: val })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Gudang Tujuan Penerimaan <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    value={formData.warehouse_id}
                    onChange={(val) => {
                      const wh = warehouses.find(w => String(w.id) === String(val));
                      setFormData(prev => ({
                        ...prev,
                        warehouse_id: val,
                        warehouse_name: wh ? `${wh.name} (${wh.code})` : ''
                      }));
                    }}
                    options={warehouses.map((w) => ({
                      value: String(w.id),
                      label: `${w.name} (${w.code}) - ${w.city || 'Pusat'}${w.is_primary ? ' [Central Hub]' : ''}`
                    }))}
                    placeholder="Pilih gudang tujuan penerimaan..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Daftar Item & Matriks Varian Pemesanan Stok */}
            <div className="space-y-6">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Boxes size={16} className="text-amber-500" />
                <span>2. Daftar Item &amp; Matriks Varian Pemesanan Stok</span>
              </h2>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-amber-400 text-xs font-sport font-black uppercase tracking-wider rounded-none border border-black cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus size={14} />
                  <span>Tambah Produk</span>
                </button>
              </div>

              <div className="space-y-6">
                {formData.orderProducts.map((orderProd, pIdx) => {
                  const variants = orderProd.variants || [];
                  const prodTotalQty = variants.reduce((s, v) => s + (Number(v.ordered_quantity) || 0), 0);
                  const prodTotalSubtotal = variants.reduce((s, v) => s + ((Number(v.ordered_quantity) || 0) * (Number(v.unit_price) || 0)), 0);

                  return (
                    <div key={orderProd.id || pIdx} className="bg-neutral-50 border border-neutral-300 rounded-none shadow-2xs">
                      {/* Product Header Bar */}
                      <div className="p-5 sm:p-6 bg-white border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-neutral-950 text-amber-400 font-sport font-black text-xs flex items-center justify-center shrink-0">
                            #{pIdx + 1}
                          </div>
                          <div>
                            <span className="font-sport font-black text-xs uppercase tracking-wider text-neutral-950">
                              {orderProd.product_name ? orderProd.product_name : `Pilih Produk #${pIdx + 1}`}
                            </span>
                            {variants.length > 0 && (
                              <span className="ml-2 text-[11px] font-mono font-bold text-neutral-500">
                                ({variants.length} Varian Tersedia)
                              </span>
                            )}
                          </div>
                        </div>

                        {formData.orderProducts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(pIdx)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-sport font-bold uppercase flex items-center gap-1.5 cursor-pointer self-end sm:self-auto transition-colors"
                          >
                            <Trash2 size={13} />
                            <span>Hapus Produk</span>
                          </button>
                        )}
                      </div>

                      {/* Product Selector */}
                      <div className="p-5 sm:p-6 border-b border-neutral-200 bg-neutral-50/50 relative z-20">
                        <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                          Pilih Produk Vendor <span className="text-rose-500">*</span>
                        </label>
                        <ServerSideSelect
                          value={orderProd.product_id || ''}
                          onChange={(val) => handleProductSelect(pIdx, val)}
                          options={vendorProducts.map(p => {
                            const varCount = Array.isArray(p.variants) ? p.variants.length : 0;
                            return {
                              value: p.id,
                              label: `${p.name}${p.sku ? ` [${p.sku}]` : ''}${varCount > 0 ? ` (${varCount} Varian)` : ' (Unit Utama)'}`
                            };
                          })}
                          placeholder="Pilih produk vendor yang akan dipesan..."
                          required
                        />
                      </div>

                      {/* Variants Table / Matrix */}
                      {orderProd.product_id ? (
                        <div className="p-5 sm:p-6 space-y-5">
                          {/* Quick Fill Toolbar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 border border-neutral-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900">
                                Matriks Varian Produk
                              </span>
                              <span className="text-[11px] font-mono text-neutral-500">
                                ({variants.length} varian ditemukan)
                              </span>
                            </div>

                            {variants.length > 1 && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-sport font-bold uppercase text-neutral-600 whitespace-nowrap">
                                  Isi Cepat Semua Qty:
                                </span>
                                <div className="w-24">
                                  <TextInput
                                    type="number"
                                    min="0"
                                    weight="mono"
                                    placeholder="Qty"
                                    value={orderProd.quick_qty || ''}
                                    onChange={(val) => {
                                      const updated = [...formData.orderProducts];
                                      updated[pIdx] = { ...updated[pIdx], quick_qty: val };
                                      setFormData({ ...formData, orderProducts: updated });
                                    }}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleApplyQuickQty(pIdx)}
                                  className="px-3 h-[42px] bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider rounded-none border border-neutral-300 cursor-pointer transition-colors shrink-0"
                                >
                                  Terapkan
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Table of Variants */}
                          <div className="overflow-x-auto border border-neutral-200 bg-white">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-sport font-black uppercase tracking-wider text-neutral-700">
                                  <th className="py-2.5 px-3 w-[22%] min-w-[130px]">Varian Produk</th>
                                  <th className="py-2.5 px-3 w-[22%] min-w-[120px]">Kode SKU</th>
                                  <th className="py-2.5 px-3 w-[16%] min-w-[85px]">Qty Dipesan <span className="text-rose-500">*</span></th>
                                  <th className="py-2.5 px-3 w-[20%] min-w-[115px]">HPP Pokok (Rp) <span className="text-rose-500">*</span></th>
                                  <th className="py-2.5 px-3 w-[20%] min-w-[115px] text-right">Subtotal Nilai</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200 text-xs">
                                {variants.map((v, vIdx) => {
                                  const rowSubtotal = (Number(v.ordered_quantity) || 0) * (Number(v.unit_price) || 0);

                                  return (
                                    <tr key={v.variant_id || vIdx} className="hover:bg-neutral-50/80 transition-colors">
                                      <td className="py-2 px-2.5">
                                        <div className="font-sport font-black text-xs text-neutral-950 uppercase leading-snug">
                                          {v.variant_name}
                                        </div>
                                        {v.variant_id === 'self' && (
                                          <span className="text-[10px] font-mono text-neutral-400">Produk Standar (Tanpa Varian)</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-2.5">
                                        <TextInput
                                          type="text"
                                          value={v.sku || ''}
                                          disabled
                                          weight="mono"
                                          placeholder="—"
                                        />
                                      </td>
                                      <td className="py-2 px-2.5">
                                        <TextInput
                                          type="number"
                                          required
                                          min="0"
                                          weight="mono"
                                          value={v.ordered_quantity}
                                          onChange={(val) => handleVariantChange(pIdx, vIdx, 'ordered_quantity', val)}
                                        />
                                      </td>
                                      <td className="py-2 px-2.5">
                                        <TextInput
                                          type="number"
                                          required
                                          min="0"
                                          weight="mono"
                                          value={v.unit_price}
                                          onChange={(val) => handleVariantChange(pIdx, vIdx, 'unit_price', val)}
                                        />
                                      </td>
                                      <td className="py-2 px-2.5 text-right">
                                        <div className="h-[42px] px-2.5 flex items-center justify-end bg-neutral-50 border border-neutral-200 font-mono font-black text-xs text-neutral-900">
                                          {formatRupiah(rowSubtotal)}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Product Subtotal Summary Bar */}
                          <div className="p-3.5 bg-neutral-100 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-neutral-500 font-sport font-bold uppercase">
                                Rekap Produk Ini:
                              </span>
                              <span className="font-mono font-bold text-neutral-900">
                                {prodTotalQty} Unit Dipesan
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-neutral-500 font-sport font-bold uppercase">
                                Subtotal Produk:
                              </span>
                              <span className="font-mono font-black text-sm text-neutral-950">
                                {formatRupiah(prodTotalSubtotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center text-xs text-neutral-400 font-sport uppercase tracking-wider">
                          Pilih produk di atas untuk memuat daftar varian dan mengisi kuantitas pemesanan
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Catatan & Total */}
            <div className="pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
              <div>
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                  Catatan / Instruksi Pengiriman Vendor
                </label>
                <TextArea
                  rows={3}
                  value={formData.notes}
                  onChange={(val) => setFormData({ ...formData, notes: val })}
                  placeholder="Instruksi packing, nomor kontak ekspedisi rekanan, dan standar mutu penerimaan..."
                />
              </div>

              <div className="bg-neutral-950 text-white p-5 border border-black rounded-none shadow-sm space-y-2">
                <div className="flex justify-between items-center text-neutral-400 text-xs font-sport uppercase">
                  <span>Total Varian Terpilih</span>
                  <span className="font-mono font-bold text-white">
                    {allVariants.filter(v => Number(v.ordered_quantity) > 0).length} Varian ({totalOrderedUnits} Unit)
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-neutral-800 pt-2">
                  <span className="text-xs font-sport font-bold uppercase tracking-wider text-amber-400">Total Komitmen Belanja Modal</span>
                  <span className="text-xl font-sport font-black text-white font-mono">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'approved')}
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Memproses...' : 'Terbitkan & Otorisasi Langsung'}</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'draft')}
                disabled={isSubmitting}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2"
              >
                <FileText size={15} />
                <span>Simpan sebagai Draft PO</span>
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
          title="Panduan PO"
          tips={[
            { icon: Building2, heading: 'Pilih Supplier Dulu', text: 'Tentukan vendor rekanan terlebih dahulu agar daftar produk otomatis difilter sesuai katalog supplier.' },
            { icon: Boxes, heading: 'Matriks Varian Otomatis', text: 'Semua varian produk langsung muncul serempak. Anda dapat mengisi kuantitas tiap varian atau memakai fitur isi cepat.' },
            { icon: Warehouse, heading: 'Gudang Tujuan', text: 'Pastikan gudang penerima benar supaya stok masuk tercatat di lokasi penyimpanan yang tepat.' },
            { icon: Calendar, heading: 'Tanggal Tiba', text: 'Isi perkiraan tanggal kirim tiba secara realistis untuk acuan jadwal penerimaan barang.' },
            { icon: FileText, heading: 'Draft vs Otorisasi', text: 'Simpan sebagai Draft jika PO butuh peninjauan. Pilih Terbitkan & Otorisasi jika pesanan sudah disetujui dikirim ke supplier.' },
            { icon: Check, heading: 'Cek Total Komitmen', text: 'Periksa panel total belanja modal di bawah form sebelum menerbitkan agar anggaran tetap terkendali.' },
          ]}
        />
      </div>
    </div>
  );
}
