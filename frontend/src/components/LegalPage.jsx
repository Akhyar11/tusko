import React from 'react';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  FileText,
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import { isHtmlContent, sanitizeHtml } from '../utils/sanitizeHtml';

/**
 * T42.2 — Halaman legal/informasi storefront generik.
 *
 * Judul & isi sepenuhnya berasal dari Settings Hub (store profile) — tidak ada
 * konten hardcode. `docKey` memilih field teks yang dirender.
 */
const DOC_META = {
  about: { title: 'Tentang Kami', field: 'about_text' },
  contact: { title: 'Kontak', field: 'contact_text' },
  terms: { title: 'Syarat & Ketentuan', field: 'terms_text' },
  privacy: { title: 'Kebijakan Privasi', field: 'privacy_text' },
  refund: { title: 'Kebijakan Pengembalian', field: 'refund_text' },
  shipping: { title: 'Kebijakan Pengiriman', field: 'shipping_text' },
  faq: { title: 'FAQ', field: 'faq_text' },
};

function normalizeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return `https://${raw.replace(/^@/, '')}`;
}

function ContactRow({ icon: Icon, label, value, href = null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-xs">
      <span className="mt-0.5 text-neutral-500 shrink-0"><Icon size={15} /></span>
      <div className="min-w-0">
        <p className="font-sport font-black uppercase tracking-wider text-neutral-500 text-[10px]">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="text-neutral-800 hover:text-amber-600 break-words">{value}</a>
        ) : (
          <p className="text-neutral-800 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function LegalPage({ docKey = 'about', storeProfile = {}, onBackToHome = () => {} }) {
  const meta = DOC_META[docKey] || DOC_META.about;
  const content = String(storeProfile?.[meta.field] || '').trim();
  const brandName = storeProfile?.legal_name || storeProfile?.name || 'Toko';
  const addressParts = [storeProfile?.address, storeProfile?.city, storeProfile?.province].filter(Boolean);
  const whatsapp = String(storeProfile?.whatsapp || '').replace(/\D/g, '');
  const instagram = normalizeUrl(storeProfile?.social_instagram);
  const tiktok = normalizeUrl(storeProfile?.social_tiktok);
  const facebook = normalizeUrl(storeProfile?.social_facebook);
  const hasIdentity = addressParts.length > 0 || storeProfile?.cs_email || storeProfile?.cs_phone
    || whatsapp || storeProfile?.npwp || storeProfile?.nib || storeProfile?.operating_hours
    || instagram || tiktok || facebook;

  const paragraphs = content ? content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean) : [];
  const htmlMode = isHtmlContent(content);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <IconButton icon={ArrowLeft} variant="outline" tooltip="Kembali ke Beranda" onClick={onBackToHome} />
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-amber-500" />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
          {content && htmlMode ? (
            <>
              <style>{`.tusko-legal p{margin:0 0 .6rem;line-height:1.7}.tusko-legal h2{font-size:1rem;font-weight:800;text-transform:uppercase;letter-spacing:.02em;margin:.8rem 0 .5rem}.tusko-legal h3{font-size:.9rem;font-weight:800;margin:.7rem 0 .4rem}.tusko-legal ul{list-style:disc;padding-left:1.25rem;margin:0 0 .6rem}.tusko-legal ol{list-style:decimal;padding-left:1.25rem;margin:0 0 .6rem}.tusko-legal blockquote{border-left:3px solid #d4d4d4;padding-left:.75rem;color:#525252;margin:.5rem 0}.tusko-legal a{color:#b45309;text-decoration:underline}`}</style>
              <div className="tusko-legal text-xs sm:text-sm text-neutral-700" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
            </>
          ) : paragraphs.length > 0 ? (
            paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-xs text-neutral-500">
              Informasi ini belum diatur oleh admin melalui menu Pengaturan Sistem.
            </p>
          )}

          {docKey === 'refund' && storeProfile?.return_window_days ? (
            <p className="text-xs font-sport font-black uppercase tracking-wider text-neutral-900 border-t border-neutral-200 pt-3">
              Jendela pengembalian: {storeProfile.return_window_days} hari sejak barang diterima.
            </p>
          ) : null}
        </div>

        <aside className="lg:col-span-1 bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-3 lg:sticky lg:top-6">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider border-b border-neutral-200 pb-3">
            {brandName}
          </h2>

          {!hasIdentity && (
            <p className="text-xs text-neutral-500">
              Identitas & kontak bisnis belum diatur admin.
            </p>
          )}

          <ContactRow icon={MapPin} label="Alamat" value={addressParts.join(', ')} />
          <ContactRow icon={Mail} label="Email" value={storeProfile?.cs_email} href={storeProfile?.cs_email ? `mailto:${storeProfile.cs_email}` : null} />
          <ContactRow icon={Phone} label="Telepon" value={storeProfile?.cs_phone} href={storeProfile?.cs_phone ? `tel:${storeProfile.cs_phone}` : null} />
          <ContactRow
            icon={Phone}
            label="WhatsApp"
            value={whatsapp || null}
            href={whatsapp ? `https://wa.me/${whatsapp}` : null}
          />
          <ContactRow icon={Clock} label="Jam Operasional" value={storeProfile?.operating_hours} />

          {(storeProfile?.npwp || storeProfile?.nib) && (
            <div className="border-t border-neutral-200 pt-3 text-[11px] text-neutral-600 space-y-0.5">
              {storeProfile?.npwp && <p>NPWP: {storeProfile.npwp}</p>}
              {storeProfile?.nib && <p>NIB: {storeProfile.nib}</p>}
            </div>
          )}

          {(instagram || tiktok || facebook) && (
            <div className="flex items-center gap-3 border-t border-neutral-200 pt-3">
              {instagram && <a href={instagram} target="_blank" rel="noreferrer" title="Instagram" className="text-neutral-500 hover:text-amber-600"><Globe size={16} /></a>}
              {tiktok && <a href={tiktok} target="_blank" rel="noreferrer" title="TikTok" className="text-neutral-500 hover:text-amber-600"><Globe size={16} /></a>}
              {facebook && <a href={facebook} target="_blank" rel="noreferrer" title="Facebook" className="text-neutral-500 hover:text-amber-600"><Globe size={16} /></a>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
