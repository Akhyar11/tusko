import React, { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { reviewService } from '../../services/reviewService';

/**
 * Organism: ProductReviewsSection (T32.3)
 * Menampilkan agregat rating + daftar ulasan disetujui pada halaman detail produk.
 */
export default function ProductReviewsSection({ productId, onShowToast = () => {} }) {
  const [reviews, setReviews] = useState([]);
  const [aggregate, setAggregate] = useState({ count: 0, average: 0, distribution: {} });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!productId) return undefined;

    setIsLoading(true);
    reviewService.fetchProductReviews(productId, { per_page: 20 })
      .then((res) => {
        if (!active) return;
        setReviews(res.data || []);
        setAggregate(res.aggregate || { count: 0, average: 0, distribution: {} });
      })
      .catch(() => {
        if (active) onShowToast('Gagal memuat ulasan produk.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [productId]);

  const distribution = aggregate.distribution || {};
  const maxCount = Math.max(1, ...Object.values(distribution).map((v) => Number(v) || 0));

  return (
    <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
      <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
        <MessageSquare size={16} className="text-amber-500" />
        <span>Ulasan &amp; Rating Pembeli</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="flex flex-col items-center justify-center border border-neutral-200 p-4">
          <div className="text-4xl font-black font-sport text-neutral-950">{Number(aggregate.average || 0).toFixed(1)}</div>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={star <= Math.round(Number(aggregate.average || 0)) ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}
              />
            ))}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">{aggregate.count || 0} ulasan</div>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(distribution[star] || 0);
            const pct = (count / maxCount) * 100;
            return (
              <div key={star} className="flex items-center gap-2 text-[11px]">
                <span className="w-8 font-mono text-neutral-600">{star}★</span>
                <div className="flex-1 h-2 bg-neutral-100 border border-neutral-200">
                  <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-neutral-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <p className="text-xs text-neutral-500">Memuat ulasan...</p>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-neutral-500">Belum ada ulasan untuk produk ini.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-sport font-black uppercase text-neutral-900 truncate">
                    {review.user?.name || 'Pembeli'}
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={12}
                        className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}
                      />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-neutral-400 shrink-0">
                  {review.created_at ? String(review.created_at).slice(0, 10) : ''}
                </span>
              </div>
              {review.title && (
                <div className="mt-2 text-xs font-bold text-neutral-900">{review.title}</div>
              )}
              {review.comment && (
                <p className="mt-1 text-xs text-neutral-600 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
