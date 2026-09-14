import React, { useState, useMemo, useEffect } from 'react';
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
  Eye, 
  Edit3, 
  MoreVertical, 
  FileText, 
  Printer, 
  SlidersHorizontal, 
  ExternalLink
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import OrderFilterDrawer from './organisms/OrderFilterDrawer';
import OrderStatusModal from './OrderStatusModal';
import PrintReceiptModal from './PrintReceiptModal';
import PrintInvoiceModal from './PrintInvoiceModal';
import ConfirmationModal from './ConfirmationModal';
import { formatRupiah } from '../utils/formatters';
import { orderStatuses, mockOrders } from '../data/mockOrders';
import { useOrderTableStore } from '../stores/useOrderTableStore';

export default function OrderListPage({
  orders = mockOrders,
  onBackToShopping = () => {},
  onViewOrderDetail = () => {},
  onPayOrder = () => {},
  onBuyAgain = () => {},
  onCancelOrder = () => {},
  onCompleteOrder = () => {},
  onUpdateStatus = () => {},
  onShowToast = () => {}
}) {
  // Centralized Zustand Table Store (100% Server-Side Data Operations)
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: tableOrders,
    total: totalOrdersCount,
    summary,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData,
  } = useOrderTableStore();

  // Filter drawer & active filters state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);

  // Modals state
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [printReceiptOrder, setPrintReceiptOrder] = useState(null);
  const [printInvoiceOrder, setPrintInvoiceOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [isBulkCancelOpen, setIsBulkCancelOpen] = useState(false);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close action popup when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveActionMenuId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Handle invoice copy
  const handleCopy = (invoice) => {
    navigator.clipboard?.writeText(invoice);
    setCopiedInvoice(invoice);
    setTimeout(() => setCopiedInvoice(null), 2000);
  };

  // Status mapping badge helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Menunggu Bayar',
          bg: 'bg-amber-50 text-amber-900 border-amber-300'
        };
      case 'processing':
        return {
          label: 'Diproses Gudang',
          bg: 'bg-blue-50 text-blue-900 border-blue-300'
        };
      case 'shipped':
        return {
          label: 'Sedang Dikirim',
          bg: 'bg-purple-50 text-purple-900 border-purple-300'
        };
      case 'completed':
        return {
          label: 'Selesai',
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-300'
        };
      case 'cancelled':
      case 'failed':
        return {
          label: 'Dibatalkan',
          bg: 'bg-red-50 text-red-900 border-red-300'
        };
      default:
        return {
          label: status,
          bg: 'bg-neutral-100 text-neutral-800 border-neutral-300'
        };
    }
  };

  const activeTab = filters.activeTab || 'all';
  const searchKeyword = filters.searchKeyword || '';
  const dateFilter = filters.dateFilter || 'all';
  const expeditionFilter = filters.expeditionFilter || 'all';

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeTab !== 'all') count++;
    if (searchKeyword.trim() !== '') count++;
    if (dateFilter !== 'all') count++;
    if (expeditionFilter !== 'all') count++;
    return count;
  }, [activeTab, searchKeyword, dateFilter, expeditionFilter]);

  const handleResetFilters = () => {
    resetFilters();
  };

  // Paginated records directly from server-side store
  const paginatedOrders = tableOrders.length > 0 || totalOrdersCount === 0 ? tableOrders : orders;
  const totalFiltered = totalOrdersCount > 0 || tableOrders.length > 0 ? totalOrdersCount : orders.length;

  // Metric KPI calculation
  const metrics = useMemo(() => {
    const list = paginatedOrders;
    const total = totalFiltered;
    const pending = list.filter((o) => o.status === 'pending').length;
    const processing = list.filter((o) => ['paid', 'processing', 'shipped'].includes(o.status)).length;
    const completed = list.filter((o) => o.status === 'completed').length;
    return { total, pending, processing, completed };
  }, [paginatedOrders, totalFiltered]);

  // Available unique expeditions for filter
  const uniqueExpeditions = useMemo(() => {
    const list = [];
    const seen = new Set();
    orders.forEach((o) => {
      const name = o.expedition?.name || o.expedition_name;
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push({ name, service: o.expedition?.service || o.expedition_service || '' });
      }
    });
    return list;
  }, [orders]);

  // Selection handlers
  const handleSelectRow = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentPageIds = paginatedOrders.map(o => o.id || o.order_number || o.invoice_number);
    const allSelected = currentPageIds.every(id => selectedOrderIds.includes(id));

    if (allSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const merged = new Set([...selectedOrderIds, ...currentPageIds]);
      setSelectedOrderIds(Array.from(merged));
    }
  };

  // Bulk actions
  const handleBulkCancel = () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkCancelOpen(true);
  };

  const confirmBulkCancel = () => {
    selectedOrderIds.forEach(id => {
      const order = orders.find(o => (o.id || o.order_number || o.invoice_number) === id);
      if (order) onCancelOrder(order);
    });
    onShowToast(`${selectedOrderIds.length} pesanan berhasil dibatalkan.`);
    setSelectedOrderIds([]);
    setIsBulkCancelOpen(false);
  };

  const confirmCancelOrder = () => {
    if (!orderToCancel) return;
    onCancelOrder(orderToCancel);
    onShowToast(`Pesanan ${orderToCancel.order_number || orderToCancel.invoice_number} berhasil dibatalkan.`);
    setOrderToCancel(null);
  };

  // Table Columns Definition for ServerSideTable
  const tableColumns = useMemo(() => [
    {
      key: 'order_number',
      label: 'No. Invoice & Waktu',
      sortable: true,
      width: 'min-w-[220px]',
      render: (_, order) => {
        const invoice = order.order_number || order.invoice_number || `INV/2026/TK/${order.id}`;
        const isCopied = copiedInvoice === invoice;

        return (
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-neutral-950 text-xs">{invoice}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(invoice);
                }}
                className="text-neutral-400 hover:text-black p-0.5 rounded-none transition-colors cursor-pointer"
                title="Salin Nomor Invoice"
              >
                {isCopied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
              </button>
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
              {new Date(order.created_at || Date.now()).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        );
      }
    },
    {
      key: 'recipient',
      label: 'Pelanggan & Alamat',
      width: 'min-w-[200px]',
      render: (_, order) => {
        const recipientName = order.address?.recipient_name || order.recipient_name || order.customer_name || 'Pembeli Tusko';
        const phone = order.address?.phone || order.phone || '';
        const city = order.address?.city || order.city || 'Indonesia';

        return (
          <div>
            <div className="font-bold text-neutral-900 text-xs font-sport uppercase tracking-tight truncate max-w-[180px]">
              {recipientName}
            </div>
            <div className="text-[11px] text-neutral-500 truncate max-w-[180px]">
              {city} {phone ? `• ${phone}` : ''}
            </div>
          </div>
        );
      }
    },
    {
      key: 'items',
      label: 'Item Produk',
      width: 'min-w-[240px]',
      render: (_, order) => {
        const items = order.items || [];
        const firstItem = items[0] || { product_name: 'Produk Tusko Performance', quantity: 1 };
        const extraCount = Math.max(0, items.length - 1);

        return (
          <div>
            <div className="font-bold text-neutral-900 text-xs line-clamp-1">
              {firstItem.product_name || firstItem.name}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {firstItem.quantity || 1} pcs {extraCount > 0 && <span className="text-amber-700 font-bold">(+{extraCount} produk lainnya)</span>}
            </div>
          </div>
        );
      }
    },
    {
      key: 'expedition',
      label: 'Ekspedisi & Resi',
      width: 'w-44',
      render: (_, order) => {
        const expName = order.expedition?.name || order.expedition_name || 'J&T Express';
        const service = order.expedition?.service || order.expedition_service || 'Reguler';
        const trackingNo = order.expedition?.tracking_number || order.tracking_number;

        return (
          <div>
            <div className="font-sport font-black uppercase text-xs text-neutral-950 truncate">
              {expName}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono">
              {service} {trackingNo ? `• ${trackingNo}` : ''}
            </div>
          </div>
        );
      }
    },
    {
      key: 'grand_total',
      label: 'Total Tagihan',
      sortable: true,
      align: 'right',
      width: 'w-36',
      render: (_, order) => {
        const total = order.totals?.grand_total ?? order.grand_total ?? 0;
        return (
          <div className="font-mono font-black text-sm text-neutral-950">
            {formatRupiah(total)}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Status Pesanan',
      align: 'center',
      width: 'w-36',
      render: (_, order) => {
        const badge = getStatusBadge(order.status);
        return (
          <span className={`inline-block px-2.5 py-1 text-[10px] font-sport font-black uppercase rounded-none border tracking-wider ${badge.bg}`}>
            {badge.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi',
      sortable: false,
      align: 'right',
      width: 'w-24',
      render: (_, order, rowIdx) => {
        const rowId = order.id || order.order_number || order.invoice_number;
        const isOpen = activeActionMenuId === rowId;
        const isNearBottom = rowIdx >= paginatedOrders.length - 2 && paginatedOrders.length > 3;

        return (
          <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setActiveActionMenuId(isOpen ? null : rowId)}
              className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
                isOpen 
                  ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                  : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
              }`}
              title="Menu Aksi Pesanan"
            >
              <MoreVertical size={16} />
            </button>

            {isOpen && (
              <div 
                className={`absolute right-0 ${
                  isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'
                } w-52 bg-white border border-neutral-300 rounded-none shadow-xl z-50 py-1 text-left animate-in fade-in zoom-in-95 duration-100`}
              >
                {/* 1. Lihat Detail */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    onViewOrderDetail(order);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Eye size={14} className="text-neutral-500" />
                  <span>Lihat Detail Pesanan</span>
                </button>

                {/* 2. Ubah Status */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setStatusModalOrder(order);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Edit3 size={14} className="text-neutral-500" />
                  <span>Ubah Status Pesanan</span>
                </button>

                {/* 3. Cetak Resi */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setPrintReceiptOrder(order);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer size={14} className="text-neutral-500" />
                  <span>Cetak Label Resi</span>
                </button>

                {/* 4. Cetak Invoice */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveActionMenuId(null);
                    setPrintInvoiceOrder(order);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText size={14} className="text-neutral-500" />
                  <span>Cetak Faktur Invoice</span>
                </button>

                {/* 5. Batalkan Pesanan (Destructive Red) */}
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveActionMenuId(null);
                      setOrderToCancel(order);
                    }}
                    className="w-full px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer border-t border-neutral-100 transition-colors"
                  >
                    <XCircle size={14} className="text-rose-600" />
                    <span>Batalkan Pesanan</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ], [paginatedOrders, activeActionMenuId, copiedInvoice]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Bar Bersih (Icon-only Controls, 0 Cross-Module Tabs) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
            <ShoppingBag size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase">
              Antrean Pesanan &amp; Transaksi
            </h1>
            <p className="text-xs text-neutral-600 mt-0.5">
              Monitoring antrean pesanan terbayar, booking pickup kurir otomatis, dan pencetakan label resi thermal.
            </p>
          </div>
        </div>

        {/* Action Buttons: Icon-Only with Tooltip */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <IconButton
            icon={SlidersHorizontal}
            onClick={() => setIsFilterDrawerOpen(true)}
            tooltip="Buka Filter Antrean Pesanan"
            variant={activeFilterCount > 0 ? 'dark' : 'secondary'}
            badge={activeFilterCount > 0 ? activeFilterCount : null}
          />
        </div>
      </div>

      {/* 2. Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Pesanan */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Pesanan</span>
            <ShoppingBag size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-950 font-sport">{metrics.total}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Order</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-neutral-600 font-bold border-t border-neutral-100 pt-1.5">
            <CheckCircle2 size={12} className="text-emerald-600" />
            <span>Semua antrean transaksi</span>
          </div>
        </div>

        {/* Card 2: Menunggu Pembayaran */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menunggu Bayar</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${metrics.pending > 0 ? 'text-amber-700' : 'text-neutral-950'}`}>
              {metrics.pending}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Antrean</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Pending settlement</span>
          </div>
        </div>

        {/* Card 3: Fulfillment & Kirim */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Fulfillment</span>
            <Truck size={16} className="text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${metrics.processing > 0 ? 'text-blue-700' : 'text-neutral-950'}`}>
              {metrics.processing}
            </span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Paket</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Gudang & siap pickup</span>
          </div>
        </div>

        {/* Card 4: Selesai */}
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Pesanan Selesai</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.completed}</span>
            <span className="text-[11px] font-mono font-bold text-neutral-400">Sukses</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-bold border-t border-neutral-100 pt-1.5">
            <span>Diterima pelanggan</span>
          </div>
        </div>
      </div>

      {/* 3. Main Data Table: Single Table View Only */}
      <ServerSideTable
        columns={tableColumns}
        data={paginatedOrders}
        total={totalFiltered}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={setPage}
        onLimitChange={setLimit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => {
          setSort(newSortBy, newDir);
        }}
        isLoading={isLoading}
        selectable={true}
        selectedIds={selectedOrderIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        idKey="id"
        emptyMessage="Tidak Ada Pesanan Ditemukan"
        emptyDescription="Sesuaikan kata kunci pencarian atau ubah filter status pesanan."
        bulkActions={
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleBulkCancel}
              className="px-2.5 py-1 bg-red-700 hover:bg-red-600 text-white font-sport font-bold text-[11px] uppercase rounded-none transition-colors cursor-pointer"
            >
              Batalkan Terpilih ({selectedOrderIds.length})
            </button>
          </div>
        }
      />

      {/* 4. Centralized Filter Sidebar Organism */}
      <OrderFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={totalFiltered}
        totalOrders={totalFiltered}
        searchKeyword={searchKeyword}
        onSearchChange={(val) => setFilter('searchKeyword', val)}
        statusFilter={activeTab}
        onStatusFilterChange={(val) => setFilter('activeTab', val)}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => setFilter('dateFilter', val)}
        expeditionFilter={expeditionFilter}
        onExpeditionFilterChange={(val) => setFilter('expeditionFilter', val)}
        expeditions={uniqueExpeditions}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Modals */}
      {statusModalOrder && (
        <OrderStatusModal
          isOpen={Boolean(statusModalOrder)}
          order={statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          onUpdateStatus={(orderId, newStatus, trackingNo, courierName) => {
            onUpdateStatus(orderId, newStatus, trackingNo, courierName);
            setStatusModalOrder(null);
            onShowToast('Status pesanan berhasil diperbarui.');
          }}
        />
      )}

      {printReceiptOrder && (
        <PrintReceiptModal
          isOpen={Boolean(printReceiptOrder)}
          order={printReceiptOrder}
          onClose={() => setPrintReceiptOrder(null)}
        />
      )}

      {printInvoiceOrder && (
        <PrintInvoiceModal
          isOpen={Boolean(printInvoiceOrder)}
          order={printInvoiceOrder}
          onClose={() => setPrintInvoiceOrder(null)}
        />
      )}

      {/* Confirmation Modal - Single Order Cancel */}
      <ConfirmationModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={confirmCancelOrder}
        title="Konfirmasi Pembatalan Pesanan"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin membatalkan pesanan ${orderToCancel?.order_number || orderToCancel?.invoice_number}? Status pesanan akan diubah menjadi dibatalkan.`}
        confirmText="Batalkan Pesanan"
        variant="danger"
      >
        {orderToCancel && (
          <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 text-xs font-sport space-y-1">
            <div className="flex justify-between">
              <span className="text-neutral-500">Pelanggan:</span>
              <span className="font-bold text-neutral-900">{orderToCancel.customer_name || orderToCancel.customer || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Tagihan:</span>
              <span className="font-mono font-bold text-neutral-900">{formatRupiah(orderToCancel.total_amount || orderToCancel.total || 0)}</span>
            </div>
          </div>
        )}
      </ConfirmationModal>

      {/* Confirmation Modal - Bulk Order Cancel */}
      <ConfirmationModal
        isOpen={isBulkCancelOpen}
        onClose={() => setIsBulkCancelOpen(false)}
        onConfirm={confirmBulkCancel}
        title="Konfirmasi Pembatalan Massal Pesanan"
        subtitle="Tindakan ini tidak dapat dibatalkan."
        message={`Apakah Anda yakin ingin membatalkan ${selectedOrderIds.length} pesanan terpilih? Semua pesanan terpilih akan dibatalkan.`}
        confirmText={`Batalkan ${selectedOrderIds.length} Pesanan`}
        variant="danger"
      />
    </div>
  );
}
