import React from 'react';
import { Lightbulb } from 'lucide-react';

/**
 * FormTipsPanel — Sidebar panduan 1/4 untuk seluruh halaman form Tusko.
 * Aturan 24: grid desktop `lg:grid-cols-4` → form utama `lg:col-span-3`,
 * panel tips `lg:col-span-1` (sticky di desktop, menumpuk di mobile).
 *
 * Props:
 * - title: judul panel (default: "Panduan Pengisian")
 * - tips: [{ icon?: LucideIcon, heading: string, text: string }]
 * - className: tambahan class (mis. "lg:col-span-1")
 */
export default function FormTipsPanel({
  title = 'Panduan Pengisian',
  tips = [],
  className = ''
}) {
  return (
    <aside className={`bg-amber-50/60 border border-amber-200 rounded-none shadow-xs lg:sticky lg:top-6 self-start ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200 bg-amber-100/70">
        <span className="w-7 h-7 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center shrink-0">
          <Lightbulb size={15} />
        </span>
        <h2 className="text-xs font-sport font-black uppercase tracking-wider text-neutral-950">
          {title}
        </h2>
      </div>
      <ul className="p-4 space-y-3.5">
        {tips.map((tip, idx) => {
          const TipIcon = tip.icon || Lightbulb;
          return (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="w-6 h-6 rounded-none bg-white border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <TipIcon size={13} />
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-sport font-black uppercase tracking-wider text-neutral-900">
                  {tip.heading}
                </div>
                <p className="text-[11px] leading-relaxed text-neutral-600 mt-0.5">
                  {tip.text}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
