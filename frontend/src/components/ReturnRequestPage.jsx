import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  RotateCcw,
  Package,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import Checkbox from './molecules/Checkbox';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import FormTipsPanel from './organisms/FormTipsPanel';
import { returnService } from '../services/returnService';
import { formatRupiah } from '../utils/formatters';

/**
 * ReturnRequestPage — halaman pelanggan mengajukan retur (T29.4).
 * `context` = { order } dari detail pesanan.
 */
export default function ReturnRequestPage({
  context = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const order = context?.order;
  const orderItems = order?.items || [];

  const [selected, setSelected] = useState({});
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const refundPreview = useMemo(() => {
    return orderItems
      .filter((item) => selected[item.id])
      .reduce((sum, item) => {
        const qty = Number(quantities[item.id] || 1);
        return sum + (Number(item.product_price || item.price || 0) * qty);
      }, 0);
  }, [selected, quantities, orderItems]);

  const toggle = (id, maxQty) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
    setQuantities((prev) => ({ ...prev, [id]: prev[id] || maxQty }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!order?.id) {
      setErrorMessage('Konteks pesanan tidak ditemukan. Buka retur dari halaman pesanan Anda.');
      return;
    }

    const items = orderItems
      .filter((item) => selected[item.id])
      .map((item) => ({
        order_item_id: item.id,
        quantity: Math.min(Math.max(1, Number(quantities[item.id] || 1)), Number(item.quantity || 1))
      }));

    if (items.length === 0) {
      setErrorMessage('Pilih minimal satu item untuk diretur.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Alasan retur wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await returnService.createReturn({
        order_id: order.id,
        reason: reason.trim(),
        notes: notes.trim() || null,
        items
      });
      onShowToast('Pengajuan retur berhasil dikirim.');
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal mengajukan retur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Pesanan" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Ajukan Retur
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('return-request-form')?.requestSubmit()}
            title="Kirim Pengajuan Retur"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="return-request-form" onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3" aria-label="Tutup pesan error">✕</button>
              </div>
            )}

            {order && (
              <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-none space-y-1">
                <div className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-500">Pesanan</div>
                <div className="font-mono text-sm text-neutral-950">{order.order_number}</div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Package size={16} className="text-amber-500" />
                <span>Pilih Item yang Diretur</span>
              </h2>

              <div className="space-y-3 mt-4">
                {orderItems.length === 0 ? (
                  <p className="text-xs text-neutral-500">Pesanan ini tidak memiliki item.</p>
                ) : orderItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center border border-neutral-200 p-3 bg-neutral-50">
                    <label className="sm:col-span-7 flex items-center gap-3 cursor-pointer">
                      <Checkbox checked={Boolean(selected[item.id])} onChange={() => toggle(item.id, item.quantity || 1)} />
                      <div className="min-w-0">
                        <div className="font-sport font-bold text-xs text-neutral-950 uppercase truncate">{item.product_name || item.name}</div>
                        <div className="text-[11px] text-neutral-500">
                          {item.quantity} unit × {formatRupiah(item.product_price || item.price || 0)}
                        </div>
                      </div>
                    </label>
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Qty Retur</label>
                      <TextInput
                        type="number"
                        min={1}
                        max={item.quantity || 1}
                        value={quantities[item.id] ?? (item.quantity || 1)}
                        onChange={(val) => setQuantities((prev) => ({ ...prev, [item.id]: val }))}
                        disabled={!selected[item.id]}
                        weight="mono"
                      />
                    </div>
                    <div className="sm:col-span-2 text-right font-mono text-xs text-neutral-700">
                      maks {item.quantity} unit
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <RotateCcw size={16} className="text-amber-500" />
                <span>Alasan Retur</span>
              </h2>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Alasan <span className="text-rose-500">*</span>
                  </label>
                  <TextInput value={reason} onChange={setReason} placeholder="Contoh: Ukuran tidak sesuai" />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Catatan Tambahan</label>
                  <TextArea rows={3} value={notes} onChange={setNotes} placeholder="Detail kondisi barang, dsb. (opsional)" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-950 text-white p-4 rounded-none flex items-center justify-between">
              <span className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-300">Estimasi Refund</span>
              <span className="font-mono font-black text-amber-400">{formatRupiah(refundPreview)}</span>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Retur'}</span>
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
          className="lg:col-span-1 lg:sticky lg:top-6"
          title="Panduan Retur"
          tips={[
            { icon: Package, heading: 'Pilih Item', text: 'Centang item yang ingin diretur dan tentukan kuantitasnya (maksimal sesuai jumlah yang dipesan).' },
            { icon: RotateCcw, heading: 'Alur', text: 'Setelah diajukan, retur ditinjau admin. Jika disetujui, refund diproses dan stok/poin disesuaikan.' },
            { icon: Info, heading: 'Refund', text: 'Nominal refund dihitung dari harga produk × kuantitas retur.' }
          ]}
        />
      </div>
    </div>
  );
}
