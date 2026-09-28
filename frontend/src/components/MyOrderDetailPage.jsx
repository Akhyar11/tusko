import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Receipt,
  Clock,
  CreditCard,
  Ban,
  CircleCheck,
  Truck,
  Navigation,
  Loader2,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ConfirmationModal from './ConfirmationModal';
import PaymentInstructionModal from './PaymentInstructionModal';
import { formatRupiah } from '../utils/formatters';
import { orderService } from '../services/orderService';
import { checkoutService } from '../services/checkoutService';
import { openSnapPayment } from '../utils/snapLoader';
import { orderStatusMeta, orderDeadline, isOrderPayable, canCancelOrder, canCompleteOrder } from './MyOrdersPage';

function formatDateTime(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

function formatCountdown(ms) {
  if (ms === null || ms === undefined) return '-';
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function MyOrderDetailPage({
  orderRef = null,
  initialOrder = null,
  autoPay = false,
  onBack = () => {},
  onShowToast = () => {},
}) {
  const [order, setOrder] = useState(initialOrder || null);
  const [isLoading, setIsLoading] = useState(!initialOrder);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [isPaying, setIsPaying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  const ref = orderRef || initialOrder?.order_number || initialOrder?.id || null;

  const load = useCallback(async () => {
    if (!ref) return;
    try {
      const data = await orderService.getOrder(ref);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(err?.message || 'Gagal memuat detail pesanan.');
    } finally {
      setIsLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    load();
  }, [load]);

  // Tick countdown tiap detik.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh saat status masih pending (menangkap auto-cancel & pembayaran).
  useEffect(() => {
    if (!order || !['pending', 'confirmed', 'processing'].includes(order.status)) return undefined;
    const timer = setInterval(() => { load().catch(() => {}); }, 30000);
    return () => clearInterval(timer);
  }, [order?.status, load]);

  const statusMeta = orderStatusMeta(order?.status);
  const StatusIcon = statusMeta.Icon;

  const payable = isOrderPayable(order);
  const deadline = orderDeadline(order);
  const remainingMs = deadline ? deadline.getTime() - now : null;
  const expiredByTime = remainingMs !== null && remainingMs <= 0;
  const isCancelled = ['cancelled', 'failed'].includes(order?.status);
  const canCancel = canCancelOrder(order);
  const canComplete = canCompleteOrder(order);
  const isManual = order?.payment_method === 'manual_transfer';

  const instructionData = useMemo(() => (order ? {
    invoiceNumber: order.order_number,
    vaNumber: order.va_number,
    billerCode: order.midtrans_biller_code,
    billKey: order.midtrans_bill_key,
    qrString: order.midtrans_qr_string,
    qrUrl: order.midtrans_qr_url,
    paymentChannel: order.payment_channel,
    paymentStatus: order.payment_status,
    paymentExpiresAt: order.payment_expires_at,
    totalAmount: order.totals?.grand_total ?? 0,
    paymentMethod: { id: order.payment_channel, name: order.payment_channel || 'Virtual Account', type: 'midtrans' },
  } : null), [order]);

  const handlePay = useCallback(async () => {
    if (!order || isPaying) return;

    if (isManual) {
      setIsInstructionOpen(true);
      return;
    }

    setIsPaying(true);
    try {
      const snap = await checkoutService.getSnapToken(order.order_number);
      if (!snap?.snap_token) {
        throw new Error('Snap token tidak tersedia. Periksa konfigurasi Midtrans.');
      }

      await openSnapPayment({
        clientKey: snap.client_key,
        snapJsUrl: snap.snap_js_url,
        token: snap.snap_token,
        onSuccess: async () => {
          await checkoutService.syncPayment(order.order_number).catch(() => {});
          await load();
          onShowToast('Pembayaran berhasil!');
        },
        onPending: async () => {
          await load();
          onShowToast('Pembayaran menunggu penyelesaian.');
        },
        onError: () => onShowToast('Pembayaran gagal. Silakan coba lagi.', { type: 'error' }),
        onClose: () => {},
      });
    } catch (err) {
      onShowToast(err?.message || 'Gagal memulai pembayaran.', { type: 'error' });
    } finally {
      setIsPaying(false);
    }
  }, [order, isPaying, isManual, load, onShowToast]);

  // autoPay dari daftar: hanya untuk transfer manual (buka instruksi otomatis).
  useEffect(() => {
    if (autoPay && isManual && payable) {
      setIsInstructionOpen(true);
    }
  }, [autoPay, isManual, payable]);

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await orderService.cancelOrder(order.order_number, 'Dibatalkan oleh pembeli');
      onShowToast('Pesanan dibatalkan & stok dikembalikan.');
      setIsCancelModalOpen(false);
      await load();
    } catch (err) {
      onShowToast(err?.message || 'Gagal membatalkan pesanan.', { type: 'error' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    setIsCompleting(true);
    try {
      await orderService.completeOrder(order.order_number);
      onShowToast('Pesanan ditandai selesai. Terima kasih!');
      await load();
    } catch (err) {
      onShowToast(err?.message || 'Gagal menyelesaikan pesanan.', { type: 'error' });
    } finally {
      setIsCompleting(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white border border-neutral-300 p-5 sm:p-6 space-y-3">
          <div className="h-6 w-56 bg-neutral-100 animate-pulse" />
          <div className="h-4 w-40 bg-neutral-100 animate-pulse" />
        </div>
        <div className="bg-white border border-neutral-300 p-5 sm:p-6 space-y-3">
          <div className="h-4 w-32 bg-neutral-100 animate-pulse" />
          <div className="h-24 w-full bg-neutral-100 animate-pulse" />
        </div>
        <p className="text-center text-xs font-sport font-black uppercase tracking-wider text-neutral-400">Memuat detail pesanan…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        <div className="bg-white border border-neutral-300 p-6 text-center">
          <AlertCircle size={40} className="mx-auto text-rose-500 mb-3" />
          <p className="text-sm text-rose-600 font-medium">{error || 'Pesanan tidak ditemukan.'}</p>
          <button type="button" onClick={onBack} className="mt-4 px-4 py-2 bg-neutral-950 text-white text-[11px] font-sport font-black uppercase tracking-wider rounded-none cursor-pointer">Kembali</button>
        </div>
      </div>
    );
  }

  const items = order.items || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton icon={ArrowLeft} variant="outline" tooltip="Kembali ke Pesanan Saya" onClick={onBack} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black font-sport uppercase tracking-tight text-neutral-950 truncate">{order.order_number}</h1>
              <span className={`inline-flex items-center gap-1 text-[10px] font-sport font-black uppercase tracking-wider px-2 py-0.5 border rounded-none ${statusMeta.cls}`}>
                <StatusIcon size={11} />
                {statusMeta.label}
              </span>
              <span className={`text-[10px] font-sport font-black uppercase tracking-wider px-2 py-0.5 border rounded-none ${
                order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-700 border-rose-300'
              }`}>
                {order.payment_status === 'paid' ? 'Sudah Dibayar' : 'Belum Dibayar'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{formatDateTime(order.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {payable && (
            <IconButton
              icon={isPaying ? Loader2 : CreditCard}
              variant="primary"
              tooltip="Bayar Sekarang"
              onClick={handlePay}
              disabled={isPaying}
            />
          )}
          {order.expedition?.tracking_number && (
            <IconButton icon={Navigation} variant="secondary" tooltip={`Lacak: ${order.expedition.tracking_number}`} onClick={() => onShowToast(`Nomor resi: ${order.expedition.tracking_number}`)} />
          )}
          {canComplete && (
            <IconButton icon={CircleCheck} variant="secondary" tooltip="Pesanan Diterima" onClick={handleComplete} disabled={isCompleting} />
          )}
          {canCancel && (
            <IconButton icon={Ban} variant="secondary" tooltip="Batalkan Pesanan" onClick={() => setIsCancelModalOpen(true)} />
          )}
        </div>
      </div>

      {/* Status kedaluwarsa / countdown */}
      {!isCancelled && order.payment_status !== 'paid' && ['pending'].includes(order.status) && (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-none ${
          expiredByTime ? 'bg-rose-50 border-rose-300' : 'bg-amber-50 border-amber-300'
        }`}>
          <Clock size={18} className={expiredByTime ? 'text-rose-600' : 'text-amber-600'} />
          <div className="flex-1 text-xs">
            {expiredByTime ? (
              <>
                <p className="font-sport font-black uppercase tracking-wider text-rose-800">Batas Waktu Pembayaran Lewat</p>
                <p className="text-rose-700 mt-0.5">Pesanan akan dibatalkan otomatis dan <strong>stok dikembalikan</strong> ke gudang.</p>
              </>
            ) : (
              <>
                <p className="font-sport font-black uppercase tracking-wider text-amber-900">Selesaikan pembayaran sebelum</p>
                <p className="text-amber-800 mt-0.5">{formatDateTime(deadline)} — sisa <strong className="font-mono">{formatCountdown(remainingMs)}</strong></p>
              </>
            )}
          </div>
          {payable && (
            <button
              type="button"
              onClick={handlePay}
              disabled={isPaying}
              className="shrink-0 px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 text-white text-[11px] font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {isPaying ? <Loader2 size={13} className="animate-spin" /> : <CreditCard size={13} />}
              Bayar Sekarang
            </button>
          )}
        </div>
      )}

      {isCancelled && (
        <div className="flex items-center gap-3 p-4 bg-neutral-100 border border-neutral-300 rounded-none">
          <Ban size={18} className="text-neutral-600" />
          <p className="text-xs text-neutral-700">
            <span className="font-sport font-black uppercase tracking-wider text-neutral-900">Pesanan Dibatalkan</span>
            <span className="text-neutral-500"> — stok telah dikembalikan ke gudang.</span>
          </p>
        </div>
      )}

      {/* Rincian item */}
      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <Receipt size={16} className="text-amber-500" />
          <span>Rincian Barang</span>
        </h2>
        <div className="divide-y divide-neutral-100">
          {items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate">{item.product_name}</p>
                <p className="text-[11px] text-neutral-500 font-mono">{item.quantity} x {formatRupiah(item.product_price ?? 0)}</p>
              </div>
              <span className="font-mono font-bold text-xs text-neutral-900 shrink-0">{formatRupiah(item.subtotal ?? 0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-neutral-200 pt-4 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span className="font-mono">{formatRupiah(order.totals?.subtotal ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Ongkir</span><span className="font-mono">{formatRupiah(order.totals?.shipping_cost ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Asuransi</span><span className="font-mono">{formatRupiah(order.totals?.insurance_cost ?? 0)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Biaya Layanan</span><span className="font-mono">{formatRupiah(order.totals?.service_fee ?? 0)}</span></div>
          {(order.totals?.discount_amount ?? 0) > 0 && (
            <div className="flex justify-between"><span className="text-neutral-600">Diskon</span><span className="font-mono text-emerald-600">-{formatRupiah(order.totals?.discount_amount ?? 0)}</span></div>
          )}
          <div className="flex justify-between items-baseline border-t border-neutral-200 pt-2 mt-2">
            <span className="font-sport font-black uppercase tracking-wider text-neutral-950">Total</span>
            <span className="font-sport font-black text-lg text-neutral-950">{formatRupiah(order.totals?.grand_total ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Alamat & pengiriman */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <MapPin size={16} className="text-amber-500" />
            <span>Alamat Pengiriman</span>
          </h2>
          <div className="text-xs text-neutral-700 space-y-1">
            <p className="font-sport font-black uppercase text-neutral-950">{order.address?.recipient_name}</p>
            <p className="font-mono text-neutral-600">{order.address?.phone}</p>
            <p className="text-neutral-600 leading-relaxed">{order.address?.full_address}, {order.address?.city}, {order.address?.province} {order.address?.postal_code}</p>
          </div>
        </div>
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
            <Truck size={16} className="text-amber-500" />
            <span>Pengiriman</span>
          </h2>
          <div className="text-xs text-neutral-700 space-y-1">
            <p className="font-sport font-black uppercase text-neutral-950">{order.expedition?.name || '-'} — {order.expedition?.service || '-'}</p>
            <p className="text-neutral-600">Estimasi: {order.expedition?.etd || '-'}</p>
            {order.expedition?.tracking_number && (
              <p className="font-mono text-neutral-600">Resi: <span className="font-bold">{order.expedition.tracking_number}</span></p>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancel}
        title="Batalkan Pesanan?"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message="Pesanan akan dibatalkan dan stok produk dikembalikan ke gudang."
        confirmText="Ya, Batalkan"
        cancelText="Tidak"
        variant="danger"
        isLoading={isCancelling}
      />

      <PaymentInstructionModal
        isOpen={isInstructionOpen}
        onClose={() => setIsInstructionOpen(false)}
        orderData={instructionData}
        onPaymentConfirmed={async () => { await load(); }}
        onShowToast={onShowToast}
      />
    </div>
  );
}
