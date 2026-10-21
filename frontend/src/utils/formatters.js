export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export const PRODUCT_PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='26' fill='%23111111'%3ETUSKO PERFORMANCE%3C/text%3E%3Ctext x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='600' font-size='14' fill='%23888888'%3EFOTO PRODUK BELUM TERSEDIA%3C/text%3E%3C/svg%3E";

/**
 * Normalisasi URL gambar.
 * Jika URL menggunakan domain Cloudflare dev (*.r2.dev) yang terblokir oleh ISP lokal di Indonesia,
 * otomatis diarahkan ke proxy backend /api/storage/<path>.
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  let trimmed = url.trim();
  if (!trimmed) return '';

  // Tangani r2.dev dev subdomain yang dibajak/diblokir ISP lokal
  const r2Match = trimmed.match(/^https?:\/\/[^\/]+\.r2\.dev\/(.+)$/i);
  if (r2Match) {
    trimmed = r2Match[1];
  }

  // Jangan ubah blob preview lokal atau data URI
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Jangan ubah URL eksternal selain r2.dev (mis. unsplash)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Bersihkan prefix /api/storage/ atau api/storage/ atau storage/ berulang
  trimmed = trimmed.replace(/^(\/?api\/storage\/|\/?storage\/)+/, '');

  return `/api/storage/${trimmed}`;
};

