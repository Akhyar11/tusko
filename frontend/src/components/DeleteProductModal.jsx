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
  products = null,
  isOpen = false,
  onClose = () => {},
  onConfirmDelete = () => {},
  onDeactivateInstead = () => {}
}) {
  const isBulk = Boolean(products && Array.isArray(products) && products.length > 0);
  if (!isOpen || (!product && !isBulk)) return null;

  const count = isBulk ? products.length : 1;
  const totalStock = isBulk
    ? products.reduce((acc, p) => acc + Number(p.stock || 0), 0)
    : Number(product?.stock || 0);
  const hasStock = totalStock > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-none border border-neutral-300 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 bg-neutral-900 text-white border-b border-neutral-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-sm font-sport font-black uppercase tracking-wider text-white">
                {isBulk ? `Konfirmasi Hapus ${count} Produk Terpilih` : 'Konfirmasi Hapus Produk'}
              </h3>
              <p className="text-xs text-neutral-400 font-sport">
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-none hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-neutral-700 leading-relaxed font-sport">
            {isBulk
              ? `Apakah Anda yakin ingin menghapus ${count} produk terpilih secara permanen dari katalog dan sistem toko?`
              : 'Apakah Anda yakin ingin menghapus produk ini secara permanen dari katalog dan sistem toko?'}
          </p>

          {/* Product Preview (Single or Bulk) */}
          {!isBulk && product ? (
            <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200 flex items-center gap-3">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                alt={product.name}
                className="w-14 h-14 rounded-none object-cover border border-neutral-200 bg-white shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <h4 className="font-bold text-neutral-950 truncate font-sport" title={product.name}>
                  {product.name}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5 font-sport">
                  <span className="font-mono bg-white px-1.5 py-0.2 rounded-none border border-neutral-200 font-semibold text-neutral-700">
                    {product.sku || `TSK-PRD-${product.id}`}
                  </span>
                  <span>•</span>
                  <span className="font-extrabold text-neutral-900">{formatRupiah(product.price)}</span>
                </div>
              </div>
            </div>
          ) : isBulk ? (
            <div className="bg-neutral-50 p-3 rounded-none border border-neutral-200">
              <div className="text-[11px] font-sport font-black text-neutral-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Daftar {count} Produk Terpilih:</span>
                <span className="text-[10px] bg-neutral-200 px-1.5 py-0.2 rounded-none text-neutral-800">
                  Total {count} Item
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-neutral-200">
                {products.map((p) => (
                  <div key={p.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'}
                        alt={p.name}
                        className="w-7 h-7 rounded-none object-cover border border-neutral-200 bg-white shrink-0"
                      />
                      <span className="font-bold text-neutral-900 truncate font-sport">{p.name}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 text-[11px] font-sport">
                      <span className="font-mono text-neutral-500 text-[10px]">{p.sku || `TSK-PRD-${p.id}`}</span>
                      <span className="font-extrabold text-neutral-950">{formatRupiah(p.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Warning notice if product has active inventory stock */}
          {hasStock && (
            <div className="p-3 bg-amber-50 rounded-none border border-amber-300 flex items-start gap-2.5 text-xs text-amber-900 font-sport">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Perhatian:</span>{' '}
                {isBulk
                  ? `Produk terpilih masih memiliki total `
                  : `Produk ini masih memiliki `}
                <strong className="text-amber-800 font-black">{totalStock} unit stok</strong> di inventaris.
                Jika Anda menghapus, seluruh catatan persediaan untuk barang ini akan dihilangkan.
              </div>
            </div>
          )}

          {/* Alternative suggestion: Nonaktifkan saja */}
          <div className="bg-neutral-100 p-3 rounded-none border border-neutral-300 text-xs text-neutral-800 flex items-start gap-2.5 font-sport">
            <EyeOff size={16} className="text-neutral-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Tips Aman:</span> Anda juga dapat menonaktifkan{' '}
              {isBulk ? `${count} produk terpilih` : 'produk'} agar tidak tampil di etalase publik tanpa menghapus riwayat data transaksi atau katalog.
            </div>
          </div>
        </div>

        {/* Action Footer Buttons */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs font-sport">
          <button
            type="button"
            onClick={() => {
              onDeactivateInstead(isBulk ? products : product);
              onClose();
            }}
            className="px-3.5 py-2 text-neutral-800 bg-white hover:bg-neutral-200 border border-neutral-300 font-bold rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            title="Sembunyikan dari pembeli tanpa menghapus data"
          >
            <EyeOff size={14} />
            <span>Nonaktifkan Saja</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-neutral-700 bg-white hover:bg-neutral-200 border border-neutral-300 font-bold rounded-none transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirmDelete(isBulk ? products : product);
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-none transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>{isBulk ? `Hapus ${count} Produk` : 'Hapus Permanen'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
