import React, { useEffect, useMemo, useState } from 'react';
import { Ruler, Plus, SlidersHorizontal, Pencil, Trash2, CheckCircle2, CircleOff, Star } from 'lucide-react';
import IconButton from './atoms/IconButton';
import ServerSideTable from './ServerSideTable';
import RowActionMenu from './molecules/RowActionMenu';
import ConfirmationModal from './ConfirmationModal';
import SizeChartFilterDrawer from './organisms/SizeChartFilterDrawer';
import { sizeChartService } from '../services/sizeChartService';
import { categoryService } from '../services/categoryService';
import { useSizeChartTableStore } from '../stores/useSizeChartTableStore';

/**
 * Master Panduan Ukuran — daftar tabel konversi ukuran (per kategori + default).
 */
export default function SizeChartListPage({
  onShowToast = () => {},
  onNavigateToCreate = () => {},
  onNavigateToEdit = () => {},
}) {
  const {
    page, limit, sortBy, sortDirection, filters, data: charts, total, isLoading,
    setPage, setLimit, setSort, setFilter, setFilters, resetFilters, fetchData,
  } = useSizeChartTableStore();

  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    categoryService.fetchCategories({ all: true })
      .then((res) => setCategories(res?.data || []))
      .catch(() => {});
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.search) n += 1;
    if (filters.category_id !== 'all') n += 1;
    if (filters.status !== 'all') n += 1;
    return n;
  }, [filters]);

  const sortOption = `${sortBy}_${sortDirection}`;

  const handleSortOptionChange = (val) => {
    const [col, dir] = String(val).split('_');
    setSort(col || 'sort_order', dir || 'asc');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await sizeChartService.deleteChart(deleteTarget.id);
      onShowToast(`Tabel "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      onShowToast(err?.message || 'Gagal menghapus tabel ukuran.', { type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(() => [
    {
      key: 'name',
      label: 'Nama Tabel Ukuran',
      sortable: true,
      render: (name, row) => (
        <div className="flex items-center gap-2">
          <Ruler size={14} className="text-amber-500 shrink-0" />
          <span className="font-sport font-bold text-neutral-950 text-sm">{name || row?.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Kategori',
      render: (_, row) => (
        <span className="text-xs font-medium text-neutral-700">{row?.category?.name || 'Default (semua)'}</span>
      ),
    },
    {
      key: 'rows_count',
      label: 'Baris',
      align: 'center',
      width: 'w-20',
      render: (val, row) => (
        <span className="font-mono text-xs text-neutral-700">{val ?? row?.rows_count ?? 0}</span>
      ),
    },
    {
      key: 'is_default',
      label: 'Default',
      align: 'center',
      width: 'w-28',
      render: (val) => (
        val
          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 font-sport font-black text-[10px] uppercase rounded-none"><Star size={11} /> Default</span>
          : <span className="text-neutral-400 text-xs">—</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      align: 'center',
      width: 'w-28',
      render: (val) => (
        val
          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-sport font-black text-[10px] uppercase rounded-none"><CheckCircle2 size={11} /> Aktif</span>
          : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-300 font-sport font-black text-[10px] uppercase rounded-none"><CircleOff size={11} /> Nonaktif</span>
      ),
    },
    {
      key: 'actions',
      label: 'Aksi',
      align: 'center',
      width: 'w-16',
      render: (_, row) => (
        <RowActionMenu buttonTitle="Menu Aksi">
          {(close) => (
            <div>
              <button
                type="button"
                onClick={() => { close(); onNavigateToEdit(row.id); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer rounded-none"
              >
                <Pencil size={14} className="text-neutral-500" /> Ubah / Edit
              </button>
              <button
                type="button"
                onClick={() => { close(); setDeleteTarget(row); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer rounded-none"
              >
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          )}
        </RowActionMenu>
      ),
    },
  ], [onNavigateToEdit]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Ruler size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">MASTER PANDUAN UKURAN</h1>
              <p className="text-xs text-neutral-600 mt-0.5">Tabel konversi ukuran per kategori produk, dengan satu tabel default sebagai fallback.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={Plus} title="Tambah Tabel Ukuran" variant="primary" onClick={onNavigateToCreate} />
          <IconButton
            icon={SlidersHorizontal}
            title="Filter"
            variant="secondary"
            badge={activeFilterCount > 0 ? activeFilterCount : null}
            onClick={() => setIsFilterOpen(true)}
          />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Tabel</span>
            <Ruler size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{total}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Tersimpan di server</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Default</span>
            <Star size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{charts.filter((c) => c.is_default).length}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Fallback (halaman ini)</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Aktif</span>
            <CheckCircle2 size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{charts.filter((c) => c.is_active).length}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Halaman ini</div>
        </div>
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Filter Aktif</span>
            <SlidersHorizontal size={16} />
          </div>
          <div className="flex items-baseline gap-2"><span className="text-2xl font-black font-sport">{activeFilterCount}</span></div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Saringan berjalan</div>
        </div>
      </div>

      <ServerSideTable
        columns={columns}
        data={charts}
        total={total}
        page={page}
        limit={limit}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={setSort}
        isLoading={isLoading}
        selectable={true}
        limitOptions={[10, 25, 50, 100]}
        emptyMessage="Belum ada tabel ukuran"
        emptyDescription="Tambahkan tabel konversi ukuran untuk kategori produk."
      />

      <SizeChartFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        activeFilterCount={activeFilterCount}
        totalFiltered={total}
        search={filters.search}
        onSearchChange={(v) => setFilter('search', v)}
        categoryId={filters.category_id}
        onCategoryChange={(v) => setFilter('category_id', v)}
        status={filters.status}
        onStatusChange={(v) => setFilter('status', v)}
        sortOption={sortOption}
        onSortOptionChange={handleSortOptionChange}
        categories={categories}
        onResetFilters={resetFilters}
      />

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Tabel Ukuran"
        message={`Yakin ingin menghapus tabel "${deleteTarget?.name || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
