import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Star,
  MessageSquare,
  Info
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import ServerSideSelect from './molecules/ServerSideSelect';
import FormTipsPanel from './organisms/FormTipsPanel';
import { reviewService } from '../services/reviewService';

const ratingOptions = [
  { value: '5', label: '5 — Sangat Puas' },
  { value: '4', label: '4 — Puas' },
  { value: '3', label: '3 — Cukup' },
  { value: '2', label: '2 — Kurang' },
  { value: '1', label: '1 — Kecewa' }
];

/**
 * ReviewCreatePage — halaman terpisah pengiriman ulasan (T32.3).
 * `context` = { order, product } dari pesanan pelanggan.
 */
export default function ReviewCreatePage({
  context = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [rating, setRating] = useState('5');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const order = context?.order;
  const product = context?.product;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!order?.id || !product?.id) {
      setErrorMessage('Konteks pesanan/produk tidak ditemukan. Buka ulasan dari halaman pesanan Anda.');
      return;
    }
    if (!rating) {
      setErrorMessage('Pilih rating terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await reviewService.submitReview({
        product_id: Number(product.id),
        order_id: Number(order.id),
        rating: Number(rating),
        title: title.trim() || null,
        comment: comment.trim() || null
      });
      onShowToast('Ulasan berhasil dikirim dan menunggu moderasi.');
      onNavigateBack();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal mengirim ulasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Pesanan" variant="outline" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            Beri Ulasan Produk
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <IconButton icon={X} onClick={onNavigateBack} title="Batal" variant="secondary" />
          <IconButton
            icon={Save}
            onClick={() => document.getElementById('review-form')?.requestSubmit()}
            title="Kirim Ulasan"
            variant="primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5 lg:col-span-3">
          <form id="review-form" onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
                  <AlertCircle size={16} className="shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage('')}
                  className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3"
                  aria-label="Tutup pesan error"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-none space-y-1">
              <div className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-500">Produk</div>
              <div className="font-sport font-black text-sm text-neutral-950 uppercase">{product?.name || '-'}</div>
              {order?.order_number && (
                <div className="text-[11px] font-mono text-neutral-500">Pesanan: {order.order_number}</div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
                <Star size={16} className="text-amber-500" />
                <span>Penilaian Anda</span>
              </h2>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Rating <span className="text-rose-500">*</span>
                  </label>
                  <ServerSideSelect
                    options={ratingOptions}
                    value={rating}
                    onChange={(val) => setRating(val)}
                    placeholder="Pilih rating..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Judul Ulasan
                  </label>
                  <TextInput
                    value={title}
                    onChange={setTitle}
                    placeholder="Contoh: Kualitas mantap"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">
                    Komentar
                  </label>
                  <TextArea
                    rows={4}
                    value={comment}
                    onChange={setComment}
                    placeholder="Ceritakan pengalaman Anda memakai produk ini..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none"
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}</span>
              </button>

              <button
                type="button"
                onClick={onNavigateBack}
                disabled={isSubmitting}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        <FormTipsPanel
          className="lg:col-span-1"
          title="Panduan Ulasan"
          tips={[
            { icon: Star, heading: 'Rating', text: 'Beri 1–5 bintang sesuai kepuasan Anda terhadap produk.' },
            { icon: MessageSquare, heading: 'Komentar', text: 'Tulis ulasan jujur dan membantu pembeli lain memilih produk.' },
            { icon: Info, heading: 'Moderasi', text: 'Ulasan akan tampil di halaman produk setelah disetujui admin.' }
          ]}
        />
      </div>
    </div>
  );
}
