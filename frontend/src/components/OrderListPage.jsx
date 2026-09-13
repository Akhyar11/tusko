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
  Boxes,
  Printer,
  Mail
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { orderStatuses, mockOrders } from '../data/mockOrders';
import OrderStatusModal from './OrderStatusModal';
import PrintReceiptModal from './PrintReceiptModal';
import PrintInvoiceModal from './PrintInvoiceModal';

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
  onOpenStock = () => {},
  onOpenTemplates = () => {},
  onOpenExpeditions = () => {}
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | '30days' | '90days'
  const [copiedInvoice, setCopiedInvoice] = useState(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState(null);
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState(null);

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
          text: 'text-amber-800',
          border: 'border-amber-300',
          icon: Clock
        };
      case 'processing':
        return {
          label: 'Diproses Gudang',
          bg: 'bg-blue-50',
          text: 'text-blue-800',
          border: 'border-blue-300',
          icon: Clock
        };
      case 'shipped':
        return {
          label: 'Sedang Dikirim',
          bg: 'bg-purple-50',
          text: 'text-purple-800',
          border: 'border-purple-300',
          icon: Truck
        };
      case 'completed':
        return {
          label: 'Selesai',
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-300',
          icon: CheckCircle2
        };
      case 'cancelled':
      case 'failed':
        return {
          label: 'Dibatalkan',
          bg: 'bg-red-50',
          text: 'text-red-800',
          border: 'border-red-300',
          icon: XCircle
        };
      default:
        return {
          label: status,
          bg: 'bg-neutral-50',
          text: 'text-neutral-800',
          border: 'border-neutral-300',
          icon: FileText
        };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtered orders calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      // Keyword filter
      if (searchKeyword.trim() !== '') {
        const query = searchKeyword.toLowerCase();
        const invoiceMatch = (order.order_number || order.invoice_number || '').toLowerCase().includes(query);
        const expeditionMatch = (order.expedition?.name || order.expedition_name || '').toLowerCase().includes(query);
        const itemMatch = (order.items || []).some((item) => 
          (item.product_name || item.name || '').toLowerCase().includes(query)
        );
        const recipientMatch = (order.address?.recipient_name || order.recipient_name || '').toLowerCase().includes(query);

        if (!invoiceMatch && !expeditionMatch && !itemMatch && !recipientMatch) {
          return false;
        }
      }

      // Date filter
      if (dateFilter !== 'all' && order.created_at) {
        const orderTime = new Date(order.created_at).getTime();
        const now = new Date().getTime();
        const diffDays = (now - orderTime) / (1000 * 3600 * 24);

        if (dateFilter === '30days' && diffDays > 30) return false;
        if (dateFilter === '90days' && diffDays > 90) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchKeyword, dateFilter]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = { all: orders.length };
    orderStatuses.forEach((tab) => {
      if (tab.id !== 'all') {
        counts[tab.id] = orders.filter((o) => o.status === tab.id).length;
      }
    });
    return counts;
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-neutral-300 rounded-none shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase flex items-center gap-2.5">
            <ShoppingBag className="text-amber-600" size={24} />
            Antrean Pesanan & Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Monitoring antrean pesanan terbayar, booking pickup kurir otomatis, dan pencetakan label resi termal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={onOpenFinancialTransactions}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Buka Catatan Transaksi Arus Kas Keuangan"
          >
            <Wallet size={14} className="text-neutral-700" />
            <span>Buku Kas</span>
          </button>
          <button
            type="button"
            onClick={onOpenStock}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Buka Manajemen Stok & Inventaris Gudang"
          >
            <Boxes size={14} className="text-neutral-700" />
            <span>Stok Gudang</span>
          </button>
          <button
            type="button"
            onClick={onOpenTemplates}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Kelola Template Email Notifikasi & Format Resi"
          >
            <Mail size={14} className="text-neutral-700" />
            <span>Template</span>
          </button>
          <button
            type="button"
            onClick={onOpenExpeditions}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-sport font-black text-xs uppercase tracking-wider rounded-none border border-neutral-300 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Kelola Jasa Ekspedisi & Tarif Ongkir Toko"
          >
            <Truck size={14} className="text-neutral-700" />
            <span>Ekspedisi</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (Sharp Athletic Style) */}
      <div className="bg-white rounded-none border border-neutral-300 p-2 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {orderStatuses.map((tab) => {
            const isSelected = activeTab === tab.id;
            const count = tabCounts[tab.id] || 0;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-none text-xs font-sport font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 font-mono font-bold rounded-none ${
                    isSelected ? 'bg-amber-400 text-black' : 'bg-neutral-200 text-neutral-700'
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-none border border-neutral-300 shadow-2xs">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Cari nomor invoice, produk, penerima, atau kurir..."
            className="w-full pl-9.5 pr-4 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-black transition-all placeholder:text-neutral-400"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar size={15} className="text-neutral-500 hidden sm:block" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-medium text-neutral-800 cursor-pointer"
          >
            <option value="all">Semua Tanggal</option>
            <option value="30days">30 Hari Terakhir</option>
            <option value="90days">90 Hari Terakhir</option>
          </select>
        </div>
      </div>

      {/* Order Cards List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-none border border-neutral-300 p-12 text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-none flex items-center justify-center mx-auto border border-neutral-200">
              <ShoppingBag size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="font-sport font-black text-neutral-900 text-base uppercase">
                Tidak Ada Pesanan Ditemukan
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                {searchKeyword
                  ? `Tidak ada transaksi yang cocok dengan kata kunci "${searchKeyword}".`
                  : 'Belum ada antrean pesanan dalam status ini.'}
              </p>
            </div>
            {searchKeyword && (
              <button
                type="button"
                onClick={() => setSearchKeyword('')}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-sport font-black text-xs uppercase rounded-none cursor-pointer transition-colors"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => {
            const invoice = order.order_number || order.invoice_number || `INV/2026/TK/${order.id}`;
            const badge = getStatusBadge(order.status, order.payment_status);
            const StatusIcon = badge.icon;
            const items = order.items || [];
            const firstItem = items[0] || {
              product_name: 'Produk Tusko Performance',
              product_price: 249000,
              quantity: 1
            };
            const extraItemsCount = Math.max(0, items.length - 1);
            const totalAmount = order.totals?.grand_total ?? order.grand_total ?? 0;
            const expeditionName = order.expedition?.name || order.expedition_name || 'J&T Express (KiriminAja)';
            const expeditionService = order.expedition?.service || order.expedition_service || 'Reguler';
            const trackingNo = order.expedition?.tracking_number || order.tracking_number;

            return (
              <div
                key={order.id || invoice}
                className="bg-white rounded-none border border-neutral-300 p-4 sm:p-5 shadow-2xs space-y-4 hover:border-black transition-all"
              >
                {/* Order Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-200 text-xs">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 font-sport font-black text-neutral-950 uppercase">
                      <ShoppingBag size={14} className="text-amber-600" />
                      <span>Fulfillment</span>
                    </div>
                    <span className="text-neutral-300 hidden sm:inline">&bull;</span>
                    <span className="text-neutral-500 font-mono">{formatDate(order.created_at)}</span>
                    <span className="text-neutral-300 hidden sm:inline">&bull;</span>
                    
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-sport font-black uppercase border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      <StatusIcon size={12} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Invoice Number */}
                  <div className="flex items-center gap-1.5 text-neutral-500">
                    <span className="text-[11px] font-mono font-bold text-neutral-900">{invoice}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(invoice)}
                      className="p-1 hover:text-black transition-colors cursor-pointer"
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
                      src={firstItem.product_image || firstItem.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                      alt={firstItem.product_name || firstItem.name}
                      className="w-16 h-16 sm:w-18 sm:h-18 rounded-none object-cover border border-neutral-300 shrink-0"
                    />
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-neutral-950 text-xs sm:text-sm line-clamp-1 leading-snug">
                        {firstItem.product_name || firstItem.name}
                      </h4>
                      <p className="text-[11px] text-neutral-600 font-mono">
                        {firstItem.quantity || 1} unit &times; {formatRupiah(firstItem.product_price || firstItem.price || 0)}
                      </p>
                      {extraItemsCount > 0 && (
                        <p className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-none border border-amber-200 inline-block">
                          +{extraItemsCount} produk lainnya
                        </p>
                      )}
                      {firstItem.variant && (
                        <p className="text-[10px] text-neutral-500">
                          Varian: {firstItem.variant}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider on Mobile */}
                  <div className="h-px bg-neutral-200 md:hidden" />

                  {/* Total & Shipping Info */}
                  <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center shrink-0 md:border-l md:border-neutral-200 md:pl-6">
                    <div className="text-left md:text-right">
                      <span className="text-[11px] text-neutral-500 block uppercase font-mono">Total Nilai</span>
                      <span className="text-sm sm:text-base font-sport font-black text-neutral-950">
                        {formatRupiah(totalAmount)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-neutral-500 mt-1">
                      <span className="block font-medium">{expeditionName} {expeditionService}</span>
                      {trackingNo && (
                        <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                          Resi: {trackingNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    {trackingNo && (
                      <button
                        type="button"
                        onClick={() => setTrackingModalOrder(order)}
                        className="text-neutral-900 hover:text-amber-700 font-sport font-black uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Truck size={13} className="text-amber-600" />
                        <span>Live Tracking</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end flex-wrap">
                    {/* Ubah Status */}
                    <button
                      type="button"
                      onClick={() => setStatusModalOrder(order)}
                      className="px-3 py-1.5 text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-none font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Ubah status operasional"
                    >
                      <Package size={13} />
                      <span>Ubah Status</span>
                    </button>

                    {/* Cetak Resi Termal */}
                    <button
                      type="button"
                      onClick={() => setPrintReceiptOrder(order)}
                      className="px-3 py-1.5 text-white bg-neutral-950 hover:bg-neutral-800 border border-black rounded-none font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Cetak Label Resi Termal 100x150 mm"
                    >
                      <Printer size={13} className="text-amber-400" />
                      <span>Cetak Resi</span>
                    </button>

                    {/* Cetak E-Invoice */}
                    <button
                      type="button"
                      onClick={() => setPrintInvoiceOrder(order)}
                      className="px-3 py-1.5 text-neutral-800 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-none font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1"
                      title="Buka Faktur Digital E-Invoice"
                    >
                      <FileText size={13} />
                      <span>Invoice</span>
                    </button>

                    {/* Detail Transaksi */}
                    <button
                      type="button"
                      onClick={() => onViewOrderDetail(order)}
                      className="px-3 py-1.5 text-black bg-amber-400 hover:bg-amber-300 border border-amber-500 rounded-none font-sport font-black uppercase text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>Detail</span>
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
          <div className="bg-white rounded-none max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
                    Live Tracking Paket (KiriminAja)
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    {trackingModalOrder.expedition?.tracking_number || trackingModalOrder.tracking_number}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="p-1 rounded-none text-neutral-400 hover:text-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Courier Info */}
            <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-mono">Kurir & Layanan</span>
                <strong className="text-neutral-950 font-bold">
                  {trackingModalOrder.expedition?.name || 'J&T Express'} - {trackingModalOrder.expedition?.service || 'Reguler'}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block text-[10px] uppercase font-mono">Estimasi Tiba</span>
                <span className="text-emerald-700 font-bold">
                  {trackingModalOrder.expedition?.etd || '1-2 hari'}
                </span>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-none bg-amber-500 ring-4 ring-amber-100" />
                  <div className="w-0.5 h-12 bg-neutral-300" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Paket sedang diantar ke alamat penerima</p>
                  <p className="text-[10px] text-neutral-500">Kurir sedang dalam rute antar</p>
                  <span className="text-[10px] text-neutral-400 font-mono">07 Sep 2026, 08:30 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-none bg-neutral-400" />
                  <div className="w-0.5 h-12 bg-neutral-200" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Tiba di Sorting Hub Jakarta Selatan</p>
                  <p className="text-[10px] text-neutral-500">Paket dalam proses penyortiran</p>
                  <span className="text-[10px] text-neutral-400 font-mono">06 Sep 2026, 21:15 WIB</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-none bg-neutral-400" />
                </div>
                <div>
                  <p className="font-bold text-neutral-900">Pesanan telah diserahkan ke kurir</p>
                  <p className="text-[10px] text-neutral-500">Pickup kurir selesai di Warehouse Sentral</p>
                  <span className="text-[10px] text-neutral-400 font-mono">05 Sep 2026, 17:45 WIB</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTrackingModalOrder(null)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 font-sport font-black text-xs uppercase rounded-none text-neutral-900 transition-colors cursor-pointer mt-2"
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

      {/* Print Receipt Modal (Thermal 100x150 mm) */}
      <PrintReceiptModal
        isOpen={Boolean(printReceiptOrder)}
        onClose={() => setPrintReceiptOrder(null)}
        order={printReceiptOrder}
      />

      {/* Digital E-Invoice Modal */}
      <PrintInvoiceModal
        isOpen={Boolean(printInvoiceOrder)}
        onClose={() => setPrintInvoiceOrder(null)}
        order={printInvoiceOrder}
      />

    </div>
  );
}
