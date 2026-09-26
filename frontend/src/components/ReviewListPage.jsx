import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Trash2,
  SlidersHorizontal,
  BadgeCheck,
  XCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import ReviewFilterDrawer from './organisms/ReviewFilterDrawer';
import ConfirmationModal from './ConfirmationModal';
import RowActionMenu from './molecules/RowActionMenu';
import { reviewService } from '../services/reviewService';
import { useReviewTableStore } from '../stores/useReviewTableStore';

function StarRow({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={star <= rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}
        />
      ))}
    </span>
  );
}

export default function ReviewListPage({ onShowToast = () => {} }) {
  const {
    page,
    limit,
    sortBy,
    sortDirection,
    filters,
    data: reviews,
    total,
    isLoading,
    setPage,
    setLimit,
    setSort,
    setFilter,
    resetFilters,
    fetchData
  } = useReviewTableStore();

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingReview, setDeletingReview] = useState(null);
  const [moderating, setModerating] = useState(null);

  const loadReviews = async () => {
    try {
      await fetchData();
    } catch (err) {
      onShowToast('Gagal memuat data ulasan: ' + err.message);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const metrics = useMemo(() => ({
    total,
    pending: reviews.filter((r) => !r.is_approved).length,
    approved: reviews.filter((r) => r.is_approved).length,
    avg: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2) : '0.00'
  }), [reviews, total]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.userSearchQuery) count++;
    if (filters.createdFrom) count++;
    if (filters.createdTo) count++;
    if (filters.productFilter && filters.productFilter !== 'all') count++;
    if (filters.ratingFilter && filters.ratingFilter !== 'all') count++;
    if (filters.statusFilter && filters.statusFilter !== 'all') count++;
    return count;
  }, [filters]);

  const handleResetFilters = () => {
    resetFilters();
    onShowToast('Filter ulasan telah direset.');
  };

  const runModerate = async () => {
    if (!moderating) return;
    setIsSubmitting(true);
    try {
      await reviewService.moderateReview(moderating.review.id, moderating.approve);
      onShowToast(moderating.approve ? 'Ulasan disetujui.' : 'Ulasan ditolak.');
      setModerating(null);
      loadReviews();
    } catch (err) {
      onShowToast(err.message || 'Gagal memoderasi ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingReview) return;
    setIsSubmitting(true);
    try {
      await reviewService.deleteReview(deletingReview.id);
      onShowToast('Ulasan berhasil dihapus.');
      setDeletingReview(null);
      loadReviews();
    } catch (err) {
      onShowToast(err.message || 'Gagal menghapus ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'product',
      label: 'PRODUK',
      sortable: false,
      width: 'min-w-[200px]',
      render: (val, row) => (
        <div className="font-sport font-black text-xs text-neutral-950 uppercase tracking-tight leading-snug">
          {row.product?.name || '-'}
        </div>
      )
    },
    {
      key: 'user',
      label: 'PENGULAS',
      sortable: false,
      width: 'min-w-[160px]',
      render: (val, row) => (
        <div className="text-xs space-y-0.5">
          <div className="font-bold text-neutral-900">{row.user?.name || '-'}</div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[150px]">{row.user?.email || '-'}</div>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'RATING',
      sortable: true,
      align: 'center',
      width: 'w-32 min-w-[120px]',
      render: (val, row) => (
        <div className="flex flex-col items-center gap-1">
          <StarRow rating={row.rating} />
          <span className="font-mono text-[10px] text-neutral-500">{row.rating}/5</span>
        </div>
      )
    },
    {
      key: 'comment',
      label: 'ULASAN',
      sortable: false,
      width: 'min-w-[240px]',
      render: (val, row) => (
        <div className="space-y-0.5">
          {row.title && <div className="font-bold text-neutral-900 text-xs">{row.title}</div>}
          <div className="text-[11px] text-neutral-600 line-clamp-2 max-w-[260px]">{row.comment || '-'}</div>
        </div>
      )
    },
    {
      key: 'is_approved',
      label: 'STATUS',
      sortable: false,
      align: 'center',
      width: 'w-32 min-w-[120px]',
      render: (val, row) =>
        row.is_approved ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-none whitespace-nowrap">
            <BadgeCheck size={11} />
            <span>Disetujui</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-sport font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 rounded-none whitespace-nowrap">
            <Clock size={11} />
            <span>Menunggu</span>
          </span>
        )
    },
    {
      key: 'created_at',
      label: 'TANGGAL',
      sortable: true,
      width: 'min-w-[130px]',
      render: (val, row) => (
        <span className="font-mono text-[11px] text-neutral-600">
          {row.created_at ? String(row.created_at).slice(0, 10) : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'AKSI',
      align: 'center',
      width: 'w-16 min-w-[64px]',
      render: (val, row) => (
        <div className="inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <RowActionMenu buttonTitle="Menu Aksi">
            {(close) => (
              <>
                {!row.is_approved && (
                  <button
                    type="button"
                    onClick={() => { close(); setModerating({ review: row, approve: true }); }}
                    className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <BadgeCheck size={13} className="text-neutral-500" />
                    <span>Setujui</span>
                  </button>
                )}
                {row.is_approved && (
                  <button
                    type="button"
                    onClick={() => { close(); setModerating({ review: row, approve: false }); }}
                    className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <XCircle size={13} className="text-neutral-500" />
                    <span>Tolak</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { close(); setDeletingReview(row); }}
                  className="w-full px-3.5 py-2 text-xs font-sport font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} className="text-rose-600" />
                  <span>Hapus Ulasan</span>
                </button>
              </>
            )}
          </RowActionMenu>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Moderasi Ulasan Produk
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Tinjau, setujui, atau hapus ulasan pelanggan. Rating produk diperbarui otomatis saat disetujui.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start xl:self-auto">
          <div className="relative">
            <IconButton
              icon={SlidersHorizontal}
              onClick={() => setIsFilterDrawerOpen(true)}
              title="Buka Filter & Pencarian"
              variant={activeFilterCount > 0 ? 'primary' : 'outline'}
            />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-mono font-black text-[9px] flex items-center justify-center rounded-none shadow-xs pointer-events-none">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Ulasan</span>
            <MessageSquare size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.total}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Semua ulasan</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Menunggu</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-amber-700">{metrics.pending}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Perlu moderasi</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Disetujui</span>
            <BadgeCheck size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{metrics.approved}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Tampil di katalog</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Rata-rata</span>
            <Star size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{metrics.avg}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Rating halaman ini</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={reviews}
        total={total}
        page={page}
        limit={limit}
        limitOptions={[10, 25, 50, 100]}
        onPageChange={(p) => setPage(p)}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={({ sortBy: newSortBy, sortDirection: newDir }) => setSort(newSortBy, newDir)}
        isLoading={isLoading}
        selectable={true}
        idKey="id"
        emptyMessage="Belum Ada Ulasan"
        emptyDescription="Ulasan pelanggan akan muncul di sini untuk dimoderasi."
      />

      <ReviewFilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        activeFilterCount={activeFilterCount}
        searchQuery={filters.searchQuery || ''}
        onSearchQueryChange={(val) => setFilter('searchQuery', val)}
        userSearchQuery={filters.userSearchQuery || ''}
        onUserSearchQueryChange={(val) => setFilter('userSearchQuery', val)}
        createdFrom={filters.createdFrom || ''}
        onCreatedFromChange={(val) => setFilter('createdFrom', val)}
        createdTo={filters.createdTo || ''}
        onCreatedToChange={(val) => setFilter('createdTo', val)}
        productFilter={filters.productFilter || 'all'}
        onProductFilterChange={(val) => setFilter('productFilter', val)}
        ratingFilter={filters.ratingFilter || 'all'}
        onRatingFilterChange={(val) => setFilter('ratingFilter', val)}
        statusFilter={filters.statusFilter || 'all'}
        onStatusFilterChange={(val) => setFilter('statusFilter', val)}
        onResetFilters={handleResetFilters}
      />

      <ConfirmationModal
        isOpen={Boolean(moderating)}
        onClose={() => setModerating(null)}
        onConfirm={runModerate}
        title={moderating?.approve ? 'Setujui Ulasan' : 'Tolak Ulasan'}
        message={moderating?.approve
          ? 'Setujui ulasan ini? Ulasan akan tampil di halaman produk dan rating produk diperbarui.'
          : 'Tolak ulasan ini? Ulasan tidak akan tampil di halaman produk.'}
        confirmText={moderating?.approve ? 'Setujui' : 'Tolak'}
        cancelText="Batal"
        variant={moderating?.approve ? 'info' : 'warning'}
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={confirmDelete}
        title="Hapus Ulasan"
        message="Apakah Anda yakin ingin menghapus ulasan ini secara permanen?"
        confirmText="Hapus Ulasan"
        cancelText="Batal"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}
