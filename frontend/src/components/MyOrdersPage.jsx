import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Receipt,
  ChevronRight,
  Clock,
  CircleCheck,
  CircleX,
  Truck,
  Box,
  PackageOpen,
  CreditCard,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import SearchBar from './molecules/SearchBar';
import { orderService } from '../services/orderService';

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Pembayaran' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

const STATUS_META = {
  pending: { label: 'Menunggu Pembayaran', cls: 'bg-amber-100 text-amber-800 border-amber-300', Icon: Clock },
  confirmed: { label: 'Pembayaran Dikonfirmasi', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: CircleCheck },
  processing: { label: 'Diproses Gudang', cls: 'bg-neutral-100 text-neutral-800 border-neutral-300', Icon: Box },
  shipped: { label: 'Dalam Pengiriman', cls: 'bg-neutral-900 text-white border-neutral-900', Icon: Truck },
  delivered: { label: 'Tiba di Tujuan', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: Truck },
  completed: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', Icon: CircleCheck },
  cancelled: { label: 'Dibatalkan', cls: 'bg-rose-100 text-rose-700 border-rose-300', Icon: CircleX },
  failed: { label: 'Gagal', cls: 'bg-rose-100 text-rose-700 border-rose-300', Icon: CircleX },
};

export function orderStatusMeta(status) {
  return STATUS_META[status] || { label: status || '-', cls: 'bg-neutral-100 text-neutral-700 border-neutral-300', Icon: Package };
}

export function orderDeadline(order) {
  const raw = order?.payment_expires_at || order?.expires_at;
  return raw ? new Date(raw) : null;
}

export function isOrderPayable(order) {
  if (!order) return false;
  if (order.payment_status === 'paid') return false;
  if (['cancelled', 'failed'].includes(order.status)) return false;
  if (!['pending'].includes(order.status)) return false;
  const deadline = orderDeadline(order);
  if (deadline && deadline.getTime() < Date.now()) return false;
  return true;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

export default function MyOrdersPage({
  currentUser = null,
  onOpenDetail = () => {},
  onNavigateCatalog = () => {},
  onOpenCart = () => {},
  onShowToast = () => {},
}) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await orderService.fetchMyOrders({
        status: statusFilter,
        search: searchQuery.trim() || undefined,
        page,
        per_page: 8,
      });
      setOrders(res.data || []);
      setMeta(res.meta || { current_page: 1, last_page: 1, total: (res.data || []).length });
    } catch (err) {
      setError(err?.message || 'Gagal memuat pesanan.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery, page]);

  useEffect(() => {
    load();
  }, [load]);

  const totalLabel = useMemo(() => `${meta.total || orders.length} pesanan`, [meta.total, orders.length]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Receipt size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">Pesanan Saya</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Riwayat pesanan, status pembayaran, dan lanjutkan pembayaran.</p>
            </div>
          </div>
        </div>
        <div className="text-xs text-neutral-500 font-medium sm:text-right">
          <span className="font-sport font-black uppercase tracking-wider text-neutral-950">{totalLabel}</span>
        </div>
      </div>

      {/* Filter status + pencarian */}
      <div className="bg-white p-4 sm:p-5 rounded-none border border-neutral-300 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setStatusFilter(tab.key); setPage(1); }}
              className={`shrink-0 px-3 py-2 text-[11px] font-sport font-black uppercase tracking-wider border rounded-none transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-neutral-950 text-white border-neutral-950'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <SearchBar
          value={searchQuery}
          onChange={(val) => { setSearchQuery(val); setPage(1); }}
          placeholder="Cari nomor pesanan atau nama produk..."
        />
      </div>

      {/* Daftar pesanan */}
      {isLoading ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-neutral-300 p-4 space-y-3">
              <div className="h-4 w-48 bg-neutral-100 animate-pulse" />
              <div className="h-3 w-32 bg-neutral-100 animate-pulse" />
              <div className="h-12 w-full bg-neutral-100 animate-pulse" />
            </div>
          ))}
          <p className="text-center text-xs font-sport font-black uppercase tracking-wider text-neutral-400">Memuat pesanan…</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-neutral-300 p-6 text-center">
          <p className="text-sm text-rose-600 font-medium">{error}</p>
          <button type="button" onClick={load} className="mt-4 px-4 py-2 bg-neutral-950 text-white text-[11px] font-sport font-black uppercase tracking-wider rounded-none cursor-pointer">Coba Lagi</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-neutral-300 p-12 text-center">
          <PackageOpen size={48} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="font-sport font-black text-lg uppercase tracking-tight text-black mb-1">Belum Ada Pesanan</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
            {currentUser
              ? 'Anda belum memiliki pesanan. Mulai belanja dan pesanan Anda akan tampil di sini.'
              : 'Belum ada pesanan pada sesi ini. Jika Anda sudah pernah memesan, gunakan halaman Lacak Pesanan dengan nomor pesanan Anda.'}
          </p>
          <button
            type="button"
            onClick={onNavigateCatalog}
            className="bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-none transition-colors cursor-pointer"
          >
            Mulai Belanja
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const statusMeta = orderStatusMeta(order.status);
            const StatusIcon = statusMeta.Icon;
            const payable = isOrderPayable(order);
            const items = order.items || [];
            const itemCount = items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);

            return (
              <div key={order.id} className="bg-white border border-neutral-300 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-200">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-neutral-950">{order.order_number}</span>
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
                    <p className="text-[11px] text-neutral-500 mt-1">{formatDate(order.created_at)} • {itemCount} barang</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-sport font-bold uppercase text-neutral-500 block">Total</span>
                    <span className="font-sport font-black text-lg text-neutral-950">{formatRupiah(order.totals?.grand_total ?? 0)}</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-neutral-600 truncate">
                    {items.slice(0, 3).map((it) => it.product_name).filter(Boolean).join(', ') || 'Detail pesanan'}
                    {items.length > 3 ? ` +${items.length - 3} lainnya` : ''}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {payable && (
                      <button
                        type="button"
                        onClick={() => onOpenDetail(order, { autoPay: true })}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-[11px] font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer"
                      >
                        <CreditCard size={13} />
                        Bayar Sekarang
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(order)}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] font-sport font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer"
                    >
                      Lihat Detail
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Paginasi */}
          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-[11px] font-sport font-black uppercase border border-neutral-300 rounded-none disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="text-[11px] font-mono font-bold text-neutral-600">{meta.current_page} / {meta.last_page}</span>
              <button
                type="button"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-[11px] font-sport font-black uppercase border border-neutral-300 rounded-none disabled:opacity-40 cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
