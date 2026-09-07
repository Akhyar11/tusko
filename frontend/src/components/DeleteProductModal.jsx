import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  EyeOff, 
  Package, 
  AlertCircle, 
  Check 
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function DeleteProductModal({
  product = null,
  isOpen = false,
  onClose = () => {},
  onConfirmDelete = () => {},
  onDeactivateInstead = () => {}
}) {
  if (!isOpen || !product) return null;

  const stock = Number(product.stock || 0);
  const hasStock = stock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 bg-gradient-to-b from-rose-50/80 to-white border-b border-gray-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-950">
                Konfirmasi Hapus Produk
              </h3>
              <p className="text-xs text-gray-500">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus produk ini secara permanen dari katalog dan sistem toko?
          </p>

          {/* Product Preview Card */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-3">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-14 h-14 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
            />
            <div className="min-w-0 flex-1 text-xs">
              <h4 className="font-bold text-gray-950 truncate" title={product.name}>
                {product.name}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-gray-200 font-semibold text-gray-600">
                  {product.sku || `TSK-PRD-${product.id}`}
                </span>
                <span>•</span>
                <span className="font-extrabold text-gray-900">{formatRupiah(product.price)}</span>
              </div>
            </div>
          </div>

          {/* Warning notice if product has active inventory stock */}
          {hasStock && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Perhatian:</span> Produk ini masih memiliki{' '}
                <strong className="text-amber-700 font-black">{stock} unit stok</strong> di inventaris.
                Jika Anda menghapus produk, catatan persediaan untuk barang ini akan dihilangkan.
              </div>
            </div>
          )}

          {/* Alternative suggestion: Nonaktifkan saja */}
          <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2.5">
            <EyeOff size={16} className="text-sky-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Tips Aman:</span> Anda juga dapat menonaktifkan produk
              agar tidak tampil di etalase publik tanpa menghapus riwayat data produk.
            </div>
          </div>
        </div>

        {/* Action Footer Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              onDeactivateInstead(product);
              onClose();
            }}
            className="px-3.5 py-2 text-sky-700 bg-sky-100 hover:bg-sky-200 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Sembunyikan dari pembeli tanpa menghapus data"
          >
            <EyeOff size={14} />
            <span>Nonaktifkan Saja</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmDelete(product);
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Hapus Permanen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
