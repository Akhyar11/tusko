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
      // Default to next logical status
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
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    { 
      id: 'processing', 
      label: 'Sedang Diproses', 
      desc: 'Pembayaran terverifikasi, penjual sedang packing.',
      icon: Package,
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    },
    { 
      id: 'shipped', 
      label: 'Sedang Dikirim', 
      desc: 'Paket diserahkan ke kurir & nomor resi terbit.',
      icon: Truck,
      color: 'text-purple-700',
      bg: 'bg-purple-50',
      border: 'border-purple-200'
    },
    { 
      id: 'completed', 
      label: 'Pesanan Selesai', 
      desc: 'Barang telah diterima oleh pembeli.',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200'
    },
    { 
      id: 'cancelled', 
      label: 'Batalkan Pesanan', 
      desc: 'Transaksi dibatalkan & stok dipulihkan.',
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200'
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
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Ubah Status Pesanan
              </h3>
              <p className="text-[11px] text-gray-500 font-mono">
                {invoice}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          
          {/* Order Quick Summary */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex justify-between items-center">
            <div>
              <span className="text-gray-400 block text-[10px]">Penerima & Alamat</span>
              <strong className="text-gray-800">
                {order.address?.recipient_name || order.recipient_name}
              </strong>
              <span className="text-gray-500 block text-[11px] truncate max-w-[200px]">
                {order.address?.city || order.city || 'Kota Tujuan'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-gray-400 block text-[10px]">Total Tagihan</span>
              <span className="text-emerald-700 font-black text-sm">
                {formatRupiah(order.totals?.grand_total ?? order.grand_total ?? 0)}
              </span>
            </div>
          </div>

          {/* Status Selection Cards */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 block">
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
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500 shadow-2xs'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${opt.bg} ${opt.color} ${opt.border} border shrink-0`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{opt.label}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 bg-gray-200 text-gray-700 text-[10px] rounded font-semibold">
                              Saat Ini
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 leading-tight">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-gray-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Conditional Field: Tracking Number when status is Shipped */}
          {targetStatus === 'shipped' && (
            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2 animate-in fade-in">
              <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Truck size={14} />
                <span>Nomor Resi Pengiriman (Airwaybill)*</span>
              </label>
              <input
                type="text"
                required
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder="Contoh: JT8829102910 / SOC9928172"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-purple-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase"
              />
              <p className="text-[10px] text-purple-700">
                Kurir: <strong>{order.expedition?.name || order.expedition_name}</strong> - {order.expedition?.service || order.expedition_service}
              </p>
            </div>
          )}

          {/* Conditional Field: Cancel Reason when status is Cancelled */}
          {targetStatus === 'cancelled' && (
            <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                <AlertTriangle size={14} />
                <span>Alasan Pembatalan Pesanan*</span>
              </div>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-800"
              >
                <option value="Stok produk habis">Stok produk habis di gudang</option>
                <option value="Permintaan pembeli">Permintaan pembatalan dari pembeli</option>
                <option value="Alamat tujuan tidak terjangkau">Alamat tujuan di luar jangkauan kurir</option>
                <option value="Pembayaran kedaluwarsa">Waktu pembayaran telah kedaluwarsa</option>
                <option value="Lainnya">Alasan lainnya</option>
              </select>

              <p className="text-[10px] text-red-700">
                ⚠️ Stok produk akan secara otomatis dipulihkan kembali ke inventaris.
              </p>
            </div>
          )}

          {/* Additional Notes Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">
              Catatan Internal (Opsional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk riwayat pesanan ini..."
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 placeholder:text-gray-400"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
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
