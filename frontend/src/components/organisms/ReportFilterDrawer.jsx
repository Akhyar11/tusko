import React from 'react';
import { X } from 'lucide-react';
import IconButton from '../atoms/IconButton';

/**
 * Drawer filter kanan generik untuk halaman laporan (T34.10/T34.12).
 * Field filter diisi via `children` (memakai TextInput/ServerSideSelect/SearchBar).
 */
export default function ReportFilterDrawer({
  isOpen = false,
  onClose = () => {},
  onApply = () => {},
  onReset = () => {},
  title = 'Filter Laporan',
  subtitle = 'Saring data laporan berdasarkan parameter berikut.',
  children,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-neutral-950/60" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          <div className="p-5 sm:p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-neutral-800 shrink-0">
            <div>
              <h2 className="text-sm font-black font-sport uppercase tracking-wider">{title}</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>
            </div>
            <IconButton icon={X} variant="secondary" title="Tutup filter" onClick={onClose} />
          </div>
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {children}
          </div>
          <div className="p-5 sm:p-6 bg-white border-t border-neutral-200 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onReset}
              className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onApply}
              className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer rounded-none"
            >
              Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
