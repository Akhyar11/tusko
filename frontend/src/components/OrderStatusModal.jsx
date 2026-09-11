import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Save,
  Check
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function OrderStatusModal({
  isOpen = false,
  onClose = () => {},
  order = null,
  onUpdateStatus = () => {}
}) {
  const [targetStatus, setTargetStatus] = useState('processing');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('Stok produk habis');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      if (order.status === 'pending') {
        setTargetStatus('processing');
      } else if (order.status === 'processing') {
        setTargetStatus('shipped');
      } else if (order.status === 'shipped') {
        setTargetStatus('completed');
      } else {
        setTargetStatus(order.status);
      }

      setTrackingNumber(order.expedition?.tracking_number || order.tracking_number || '');
      setNotes('');
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const invoice = order.order_number || order.invoice_number;
  const currentStatus = order.status;

  const statusOptions = [
    { 
      id: 'pending', 
      label: 'Menunggu Pembayaran', 
      desc: 'Pesanan dibuat, belum lunas.',
      icon: Clock,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
      border: 'border-amber-300'
    },
    { 
      id: 'processing', 
      label: 'Sedang Diproses Gudang', 
      desc: 'Pembayaran terverifikasi, staf gudang menyiapkan barang.',
      icon: Package,
      color: 'text-blue-900',
      bg: 'bg-blue-50',
      border: 'border-blue-300'
    },
    { 
      id: 'shipped', 
      label: 'Sedang Dikirim Kurir', 
      desc: 'Paket diserahkan ke kurir KiriminAja & resi aktif.',
      icon: Truck,
      color: 'text-purple-900',
      bg: 'bg-purple-50',
      border: 'border-purple-300'
    },
    { 
      id: 'completed', 
      label: 'Pesanan Selesai', 
      desc: 'Barang telah diterima oleh pembeli.',
      icon: CheckCircle2,
      color: 'text-emerald-900',
      bg: 'bg-emerald-50',
      border: 'border-emerald-300'
    },
    { 
      id: 'cancelled', 
      label: 'Batalkan Pesanan', 
      desc: 'Transaksi dibatalkan & stok reservasi dipulihkan.',
      icon: XCircle,
      color: 'text-red-900',
      bg: 'bg-red-50',
      border: 'border-red-300'
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      status: targetStatus,
      tracking_number: targetStatus === 'shipped' ? trackingNumber : (order.tracking_number || null),
      cancel_reason: targetStatus === 'cancelled' ? cancelReason : null,
      notes: notes.trim() || null
    };

    setTimeout(() => {
      onUpdateStatus(order.id, targetStatus, payload);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-none max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-none bg-neutral-900 text-amber-400 flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-sport font-black text-sm sm:text-base uppercase text-neutral-950">
                Ubah Status Operasional Pesanan
              </h3>
              <p className="text-[11px] text-neutral-500 font-mono">
                {invoice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-neutral-400 hover:text-black cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          
          {/* Order Quick Summary */}
          <div className="p-3 bg-neutral-50 rounded-none border border-neutral-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Penerima & Alamat</span>
              <strong className="text-neutral-950 font-bold">
                {order.address?.recipient_name || order.recipient_name}
              </strong>
              <span className="text-neutral-600 block text-[11px] truncate max-w-[200px]">
                {order.address?.city || order.city || 'Kota Tujuan'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-neutral-500 block text-[10px] uppercase font-mono">Total Tagihan</span>
              <span className="text-neutral-950 font-sport font-black text-sm">
                {formatRupiah(order.totals?.grand_total ?? order.grand_total ?? 0)}
              </span>
            </div>
          </div>

          {/* Status Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-sport font-black uppercase tracking-wider text-neutral-800 block">
              Pilih Status Baru:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = targetStatus === opt.id;
                const isCurrent = currentStatus === opt.id;

                return (
                  <label
                    key={opt.id}
                    onClick={() => setTargetStatus(opt.id)}
                    className={`flex items-center justify-between p-3 rounded-none border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-black bg-neutral-100 ring-1 ring-black shadow-2xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-none flex items-center justify-center ${opt.bg} ${opt.color} ${opt.border} border shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-950">{opt.label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 bg-neutral-200 text-neutral-700 text-[10px] rounded-none font-semibold uppercase font-mono">
                              Saat Ini
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-none border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-black bg-black text-white' : 'border-neutral-400'
                    }`}>
                      {isSelected && <Check size={11} className="text-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Conditional Field: Tracking Number when status is Shipped */}
          {targetStatus === 'shipped' && (
            <div className="p-3.5 bg-neutral-100 rounded-none border border-neutral-300 space-y-2 animate-in fade-in">
              <label className="text-xs font-sport font-black uppercase text-neutral-900 flex items-center gap-1.5">
                <Truck size={14} className="text-amber-600" />
                <span>Nomor Resi Pengiriman (Airwaybill)*</span>
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Contoh: KRA-JNT-8829102910"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-neutral-400 rounded-none focus:outline-none focus:border-black uppercase"
              />
              <p className="text-[10px] text-neutral-600">
                Ekspedisi: <strong>{order.expedition?.name || order.expedition_name || 'J&T Express (KiriminAja)'}</strong>
              </p>
            </div>
          )}

          {/* Conditional Field: Cancel Reason when status is Cancelled */}
          {targetStatus === 'cancelled' && (
            <div className="p-3.5 bg-red-50 rounded-none border border-red-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                <AlertTriangle size={14} />
                <span>Alasan Pembatalan Pesanan*</span>
              </div>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-none focus:outline-none focus:border-black text-neutral-900"
              >
                <option value="Stok produk habis">Stok produk habis di gudang</option>
                <option value="Permintaan pembeli">Permintaan pembatalan dari pembeli</option>
                <option value="Alamat tujuan tidak terjangkau">Alamat tujuan di luar jangkauan kurir</option>
                <option value="Pembayaran kedaluwarsa">Waktu pembayaran telah kedaluwarsa</option>
                <option value="Lainnya">Alasan lainnya</option>
              </select>

              <p className="text-[10px] text-red-700">
                &bull; Stok produk akan secara otomatis dipulihkan kembali ke inventaris gudang.
              </p>
            </div>
          )}

          {/* Additional Notes Field */}
          <div className="space-y-1">
            <label className="text-xs font-sport font-black uppercase text-neutral-700 block">
              Catatan Internal (Opsional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan internal fulfillment..."
              className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black placeholder:text-neutral-400"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-sport font-black uppercase text-neutral-700 hover:bg-neutral-100 rounded-none transition-colors cursor-pointer border border-neutral-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-sport font-black uppercase tracking-wider text-black bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-none shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
