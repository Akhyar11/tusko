import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Copy, 
  Check, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  ChevronRight, 
  ExternalLink,
  RotateCcw,
  Calendar,
  AlertCircle,
  FileText,
  MapPin,
  Package,
  Wallet,
  Boxes
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { orderStatuses, mockOrders } from '../data/mockOrders';
import OrderStatusModal from './OrderStatusModal';

export default function OrderListPage({
  orders = mockOrders,
  onBackToShopping = () => {},
  onViewOrderDetail = () => {},
  onPayOrder = () => {},
  onBuyAgain = () => {},
  onCancelOrder = () => {},
  onCompleteOrder = () => {},
  onUpdateStatus = () => {},
  onOpenFinancialTransactions = () => {},
  onOpenStock = () => {}
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | '30days' | '90days'
  const [copiedInvoice, setCopiedInvoice] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);

  const handleCopy = (invoice) => {
    navigator.clipboard?.writeText(invoice);
    setCopiedInvoice(invoice);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Status mapping for badge colors & labels
  const getStatusBadge = (status, paymentStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Menunggu Pembayaran',
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: Clock
        };
      case 'processing':
        return {
          label: 'Sedang Diproses',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: Clock
        };
      case 'shipped':
        return {
          label: 'Sedang Dikirim',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200',
          icon: Truck
        };
      case 'completed':
        return {
          label: 'Selesai',
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: CheckCircle2
        };
      case 'cancelled':
      case 'failed':
        return {
          label: paymentStatus === 'expired' ? 'Kedaluwarsa' : 'Dibatalkan',
          bg: 'bg-red-50',
          text: 'text-red-700',
          border: 'border-red-200',
          icon: XCircle
        };
      default:
        return {
          label: status,
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200',
          icon: FileText
        };
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Tab filter
      if (activeTab !== 'all') {
        if (activeTab === 'pending' && order.status !== 'pending') return false;
        if (activeTab === 'processing' && order.status !== 'processing') return false;
        if (activeTab === 'shipped' && order.status !== 'shipped') return false;
        if (activeTab === 'completed' && order.status !== 'completed') return false;
        if (activeTab === 'cancelled' && !['cancelled', 'failed'].includes(order.status)) return false;
      }

      // 2. Date filter
      if (dateFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        if (dateFilter === '30days' && diffDays > 30) return false;
        if (dateFilter === '90days' && diffDays > 90) return false;
      }

      // 3. Search query
      if (searchKeyword.trim() !== '') {
        const query = searchKeyword.toLowerCase();
        const matchInvoice = (order.order_number || order.invoice_number || '').toLowerCase().includes(query);
        const matchProduct = (order.items || []).some((item) =>
          (item.product_name || '').toLowerCase().includes(query)
        );
        const matchExpedition = (order.expedition?.name || '').toLowerCase().includes(query);
        return matchInvoice || matchProduct || matchExpedition;
      }

      return true;
    });
  }, [orders, activeTab, dateFilter, searchKeyword]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: orders.length, pending: 0, processing: 0, shipped: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (o.status === 'pending') counts.pending++;
      else if (o.status === 'processing') counts.processing++;
      else if (o.status === 'shipped') counts.shipped++;
      else if (o.status === 'completed') counts.completed++;
      else if (['cancelled', 'failed'].includes(o.status)) counts.cancelled++;
    });
    return counts;
  }, [orders]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2.5">
            <ShoppingBag className="text-emerald-600" size={26} />
            Daftar Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pantau status pesanan, pembayaran, dan riwayat belanja Anda
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onOpenFinancialTransactions}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Buka Catatan Transaksi Arus Kas Keuangan"
          >
            <Wallet size={15} className="text-amber-600" />
            <span>Arus Kas</span>
          </button>
          <button
            type="button"
            onClick={onOpenStock}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-300 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Buka Manajemen Stok & Inventaris Gudang"
          >
            <Boxes size={15} className="text-blue-600" />
            <span>Stok Gudang</span>
          </button>
          <button
            type="button"
            onClick={onBackToShopping}
            className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-600 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <span>Belanja Lagi</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (Tokopedia Style) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {orderStatuses.map((tab) => {
            const isSelected = activeTab === tab.id;
            const count = tabCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-emerald-700/80 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari nomor invoice, produk, atau kurir..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all placeholder:text-gray-400"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar size={15} className="text-gray-400 hidden sm:block" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 font-medium text-gray-700 cursor-pointer"
          >
            <option value="all">Semua Tanggal</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="90days">90 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Orders List Container */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <ShoppingBag size={32} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-base">Tidak ada transaksi ditemukan</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchKeyword || activeTab !== 'all' || dateFilter !== 'all'
                  ? 'Coba ganti kata kunci pencarian atau ubah filter status transaksi.'
                  : 'Yuk, mulai belanja dan nikmati berbagai promo menarik hari ini!'}
              </p>
            </div>
            {(searchKeyword || activeTab !== 'all' || dateFilter !== 'all') ? (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSearchKeyword('');
                  setDateFilter('all');
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToShopping}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Mulai Belanja
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const invoice = order.order_number || order.invoice_number;
            const badge = getStatusBadge(order.status, order.payment_status);
            const StatusIcon = badge.icon;
            const items = order.items || [];
            const firstItem = items[0] || {};
            const extraItemsCount = items.length > 1 ? items.length - 1 : 0;
            const totalAmount = order.totals?.grand_total ?? order.grand_total ?? 0;
            const expeditionName = order.expedition?.name || order.expedition_name || 'Kurir Standar';
            const expeditionService = order.expedition?.service || order.expedition_service || '';
            const trackingNo = order.expedition?.tracking_number || order.tracking_number;

            return (
              <div
                key={order.id || invoice}
                className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs space-y-4 hover:border-gray-300 transition-all"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-gray-900">
                      <ShoppingBag size={14} className="text-emerald-600" />
                      <span>Belanja</span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <span className="text-gray-500">{formatDate(order.created_at)}</span>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <StatusIcon size={12} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Invoice Number */}
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <span className="text-[11px] font-mono">{invoice}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(invoice)}
                      className="p-1 hover:text-emerald-600 transition-colors cursor-pointer"
                      title="Salin Invoice"
                    >
                      {copiedInvoice === invoice ? (
                        <Check size={13} className="text-emerald-600" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Items Body */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Product Info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <img
                      src={firstItem.product_image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                      alt={firstItem.product_name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-gray-100 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-1 leading-snug">
                        {firstItem.product_name}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {firstItem.quantity} barang × {formatRupiah(firstItem.product_price)}
                      </p>
                      {extraItemsCount > 0 && (
                        <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                          +{extraItemsCount} produk lainnya
                        </p>
                      )}
                      {firstItem.notes && (
                        <p className="text-[10px] text-gray-400 italic line-clamp-1">
                          Catatan: {firstItem.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider on Mobile */}
                  <div className="h-px bg-gray-100 md:hidden" />

                  {/* Total & Shipping Info */}
                  <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center shrink-0 md:border-l md:border-gray-100 md:pl-6">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-gray-500 block">Total Belanja</span>
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {formatRupiah(totalAmount)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-gray-500 mt-1">
                      <span className="block font-medium">{expeditionName} {expeditionService}</span>
                      {trackingNo && (
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold block">
                          Resi: {trackingNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    {order.status === 'pending' && (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                        Batas bayar: 24 Jam
                      </span>
                    )}
                    {trackingNo && (
                      <button
                        type="button"
                        onClick={() => setTrackingModalOrder(order)}
                        className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Truck size={13} />
                        <span>Lacak Resi</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end">
                    {/* Action buttons based on status */}
                    {order.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onCancelOrder(order)}
                          className="px-3 py-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 rounded-xl font-semibold transition-colors cursor-pointer"
                        >
                          Batalkan
                        </button>
                        <button
                          type="button"
                          onClick={() => onPayOrder(order)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Bayar Sekarang
                        </button>
                      </>
                    )}

                    {order.status === 'shipped' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setTrackingModalOrder(order)}
                          className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Truck size={13} />
                          <span>Lacak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onCompleteOrder(order)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          Terima Pesanan
                        </button>
                      </>
                    )}

                    {order.status === 'completed' && (
                      <button
                        type="button"
                        onClick={() => onBuyAgain(firstItem)}
                        className="px-3.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw size={12} />
                        <span>Beli Lagi</span>
                      </button>
                    )}

                    {/* Change Status Button */}
                    <button
                      type="button"
                      onClick={() => setStatusModalOrder(order)}
                      className="px-3 py-1.5 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="Ubah status pesanan"
                    >
                      <Package size={13} />
                      <span>Ubah Status</span>
                    </button>

                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => onViewOrderDetail(order)}
                      className="px-3 py-1.5 text-gray-700 hover:text-emerald-700 hover:bg-gray-50 border border-gray-200 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Detail Transaksi</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Shipment Tracking Modal Popup */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                    Lacak Pengiriman
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {trackingModalOrder.expedition?.tracking_number || trackingModalOrder.tracking_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Courier Info */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
              <div>
                <span className="text-gray-400 block text-[10px]">Kurir & Layanan</span>
                <strong className="text-gray-800 font-bold">
                  {trackingModalOrder.expedition?.name} - {trackingModalOrder.expedition?.service}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px]">Estimasi Tiba</span>
                <span className="text-emerald-700 font-bold">
                  {trackingModalOrder.expedition?.etd || '1-2 hari'}
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100" />
                  <div className="w-0.5 h-12 bg-emerald-200" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Paket sedang diantar ke alamat tujuan</p>
                  <p className="text-[10px] text-gray-500">Kurir sedang menuju ke lokasi penerima</p>
                  <span className="text-[10px] text-gray-400">07 Sep 2026, 08:30 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <div className="w-0.5 h-12 bg-gray-200" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Tiba di Hub Sortir Jakarta Selatan</p>
                  <p className="text-[10px] text-gray-500">Paket dalam proses penyortiran</p>
                  <span className="text-[10px] text-gray-400">06 Sep 2026, 21:15 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Pesanan telah diserahkan ke kurir</p>
                  <p className="text-[10px] text-gray-500">Pengirim telah menyerahkan paket</p>
                  <span className="text-[10px] text-gray-400">05 Sep 2026, 17:45 WIB</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTrackingModalOrder(null)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 font-bold text-xs rounded-xl text-gray-800 transition-colors cursor-pointer mt-2"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Order Status Change Modal */}
      <OrderStatusModal
        isOpen={Boolean(statusModalOrder)}
        onClose={() => setStatusModalOrder(null)}
        order={statusModalOrder}
        onUpdateStatus={onUpdateStatus}
      />

    </div>
  );
}
