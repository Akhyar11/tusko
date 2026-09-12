import React, { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Package, 
  Check, 
  Loader2 
} from 'lucide-react';

/**
 * ServerSideTable - Komponen Tabel Server-Side Standar Tusko Sportswear
 * Mengusung Sharp & Athletic Performance Design (100% rounded-none).
 * Mendukung paginasi server-side, pemilihan limit per halaman, sorting kolom,
 * multi-select row (checkbox), skeleton loading, dan custom cell renderer.
 */
export default function ServerSideTable({
  columns = [],
  data = [],
  total = 0,
  totalCount,
  page = 1,
  limit = 10,
  perPage,
  limitOptions = [10, 25, 50, 100],
  onPageChange = () => {},
  onLimitChange = () => {},
  onPerPageChange,
  sortBy = '',
  sortColumn,
  sortDirection = 'desc', // 'asc' | 'desc'
  onSortChange = () => {},
  onSort,
  isLoading = false,
  emptyMessage = 'Tidak ada data yang ditemukan',
  emptyDescription = 'Coba sesuaikan kata kunci pencarian atau filter Anda.',
  emptyIcon: EmptyIcon = Package,
  selectable = false,
  selectedIds = [],
  onSelectRow = () => {},
  onSelectAll = () => {},
  onSelectionChange,
  idKey = 'id',
  rowIdKey,
  bulkActions = null,
  className = ''
}) {
  const effectiveTotal = totalCount !== undefined ? totalCount : total;
  const effectiveLimit = perPage !== undefined ? perPage : limit;
  const effectiveSortBy = sortColumn !== undefined ? sortColumn : sortBy;
  const effectiveIdKey = rowIdKey !== undefined ? rowIdKey : idKey;

  // Hitung total halaman
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / effectiveLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);

  // Range item yang sedang ditampilkan
  const startItem = effectiveTotal === 0 ? 0 : (safePage - 1) * effectiveLimit + 1;
  const endItem = Math.min(safePage * effectiveLimit, effectiveTotal);

  // Checkbox select all status
  const isAllSelected = useMemo(() => {
    if (!data.length) return false;
    return data.every((row) => selectedIds.includes(row[effectiveIdKey]));
  }, [data, selectedIds, effectiveIdKey]);

  const isSomeSelected = useMemo(() => {
    if (!data.length) return false;
    return data.some((row) => selectedIds.includes(row[effectiveIdKey])) && !isAllSelected;
  }, [data, selectedIds, effectiveIdKey, isAllSelected]);

  // Handler klik header kolom untuk sorting
  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    const isCurrentSort = effectiveSortBy === col.key;
    let nextDir = 'asc';
    if (isCurrentSort) {
      nextDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    onSortChange({ sortBy: col.key, sortDirection: nextDir });
    if (typeof onSort === 'function') {
      onSort(col.key, nextDir);
    }
  };

  const handleRowSelect = (rowId) => {
    onSelectRow(rowId);
    if (typeof onSelectionChange === 'function') {
      const nextSelected = selectedIds.includes(rowId)
        ? selectedIds.filter(id => id !== rowId)
        : [...selectedIds, rowId];
      onSelectionChange(nextSelected);
    }
  };

  const handleAllSelect = () => {
    onSelectAll();
    if (typeof onSelectionChange === 'function') {
      if (isAllSelected) {
        onSelectionChange([]);
      } else {
        onSelectionChange(data.map(row => row[effectiveIdKey]));
      }
    }
  };

  const handleLimitChange = (newLimit) => {
    onLimitChange(newLimit);
    if (typeof onPerPageChange === 'function') {
      onPerPageChange(newLimit);
    }
  };

  // Helper nomor halaman dengan ellipsis cerdas (e.g. 1 ... 4 [5] 6 ... 20)
  const paginationPages = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safePage - 1);
      let end = Math.min(totalPages - 1, safePage + 1);

      if (safePage <= 3) {
        start = 2;
        end = 4;
      } else if (safePage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      if (start > 2) pages.push('ellipsis-1');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis-2');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className={`bg-white border border-neutral-300 rounded-none shadow-2xs overflow-hidden ${className}`}>
      
      {/* Bulk Action Bar (Muncul jika ada row terpilih) */}
      {selectable && selectedIds.length > 0 && (
        <div className="bg-neutral-950 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-5 h-5 bg-amber-400 text-black font-sport font-black text-xs flex items-center justify-center rounded-none">
              {selectedIds.length}
            </span>
            <span className="font-sport font-bold uppercase tracking-wider">
              Item Terpilih dari total {total} data
            </span>
          </div>

          <div className="flex items-center gap-2">
            {bulkActions}
            <button
              type="button"
              onClick={onSelectAll}
              className="px-2.5 py-1 text-[11px] font-sport font-bold uppercase text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-none transition-colors cursor-pointer"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto relative min-h-[300px]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Head */}
          <thead>
            <tr className="bg-neutral-950 text-white font-sport font-black uppercase text-[11px] tracking-wider border-b border-neutral-950 select-none">
              {selectable && (
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleAllSelect}
                    aria-label="Pilih semua baris"
                    className="h-4 w-4 accent-amber-500 rounded-none cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isCurrentSort = effectiveSortBy === col.key;
                const alignClass = 
                  col.align === 'center' ? 'text-center' :
                  col.align === 'right' ? 'text-right' : 'text-left';

                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    className={`py-3.5 px-4 ${alignClass} ${col.width || ''} ${
                      col.sortable 
                        ? 'cursor-pointer hover:bg-neutral-900 transition-colors group' 
                        : ''
                    }`}
                  >
                    <div className={`inline-flex items-center gap-1.5 ${
                      col.align === 'center' ? 'justify-center' :
                      col.align === 'right' ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-neutral-500 group-hover:text-amber-400 transition-colors">
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={13} className="text-amber-400" />
                            ) : (
                              <ArrowDown size={13} className="text-amber-400" />
                            )
                          ) : (
                            <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-200 font-sans">
            {isLoading ? (
              // Skeleton Loader State
              Array.from({ length: Math.min(effectiveLimit, 5) }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="animate-pulse bg-white">
                  {selectable && (
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-neutral-200 rounded-none mx-auto" />
                    </td>
                  )}
                  {columns.map((col, colIdx) => (
                    <td key={`col-${colIdx}`} className={`py-4 px-4 ${col.width || ''}`}>
                      <div 
                        className="h-3.5 bg-neutral-200 rounded-none" 
                        style={{ width: `${60 + ((colIdx * 17) % 35)}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-16 px-4 text-center bg-white"
                >
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-14 h-14 bg-neutral-100 border border-neutral-300 text-neutral-400 flex items-center justify-center mx-auto rounded-none">
                      <EmptyIcon size={28} />
                    </div>
                    <h3 className="font-sport font-black text-base uppercase text-neutral-900 tracking-tight">
                      {emptyMessage}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {emptyDescription}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              // Rows Rendering
              data.map((row, rowIdx) => {
                const rowId = row[effectiveIdKey];
                const isSelected = selectedIds.includes(rowId);

                return (
                  <tr
                    key={rowId || rowIdx}
                    className={`transition-colors ${
                      isSelected 
                        ? 'bg-amber-50/50 hover:bg-amber-50' 
                        : 'hover:bg-neutral-50/80 bg-white'
                    }`}
                  >
                    {selectable && (
                      <td className="py-3.5 px-4 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleRowSelect(rowId)}
                          aria-label={`Pilih baris ${rowId}`}
                          className="h-4 w-4 accent-amber-500 rounded-none cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => {
                      const value = row[col.key];
                      const alignClass = 
                        col.align === 'center' ? 'text-center' :
                        col.align === 'right' ? 'text-right' : 'text-left';

                      return (
                        <td 
                          key={col.key} 
                          className={`py-3.5 px-4 ${alignClass} ${col.width || ''} text-neutral-800`}
                        >
                          {typeof col.render === 'function' 
                            ? col.render(value !== undefined ? value : row, row, rowIdx) 
                            : (value ?? '-')}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      <div className="bg-neutral-50 border-t border-neutral-300 p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs select-none">
        
        {/* Left Info: Range & Per-Page Limit Dropdown */}
        <div className="flex flex-wrap items-center gap-3 text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span>Tampilkan:</span>
            <select
              value={effectiveLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              disabled={isLoading}
              aria-label="Jumlah baris per halaman"
              className="bg-white border border-neutral-300 text-xs font-mono font-bold px-2 py-1 rounded-none text-neutral-900 focus:outline-none focus:border-black cursor-pointer shadow-2xs"
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>baris per halaman</span>
          </div>

          <span className="text-neutral-300 hidden sm:inline">&bull;</span>

          <div className="font-medium text-neutral-700">
            Menampilkan <strong className="font-mono text-neutral-950">{startItem}</strong> - <strong className="font-mono text-neutral-950">{endItem}</strong> dari <strong className="font-mono text-neutral-950">{total}</strong> data
          </div>
        </div>

        {/* Right Pagination Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1 || isLoading}
            className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Halaman Pertama"
            aria-label="Halaman Pertama"
          >
            <ChevronsLeft size={15} />
          </button>

          {/* Previous Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1 || isLoading}
            className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1 mx-1">
            {paginationPages.map((p, pIdx) => {
              if (typeof p === 'string') {
                return (
                  <span 
                    key={`ellipsis-${pIdx}`} 
                    className="px-2 py-1 text-neutral-400 font-mono text-xs select-none"
                  >
                    ...
                  </span>
                );
              }

              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(p)}
                  disabled={isLoading}
                  className={`min-w-[32px] h-8 px-2 text-xs font-mono font-bold transition-all cursor-pointer rounded-none ${
                    isCurrent
                      ? 'bg-neutral-950 text-white border border-neutral-950 shadow-xs'
                      : 'bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-100 hover:border-neutral-400'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages || isLoading}
            className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Halaman Berikutnya"
            aria-label="Halaman Berikutnya"
          >
            <ChevronRight size={15} />
          </button>

          {/* Last Page Button */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages || isLoading}
            className="p-1.5 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white text-neutral-700 rounded-none transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Halaman Terakhir"
            aria-label="Halaman Terakhir"
          >
            <ChevronsRight size={15} />
          </button>
        </div>

      </div>

    </div>
  );
}
