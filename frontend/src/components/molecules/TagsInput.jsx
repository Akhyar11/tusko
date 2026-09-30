import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

/**
 * Molecule: TagsInput — input daftar nilai (comma-separated) sebagai chip.
 * Dipakai untuk field seperti kurir aktif, origin FE, slug kategori footer.
 * Nilai disimpan sebagai string dipisah koma (kompatibel backend).
 */
export default function TagsInput({ value = '', onChange = () => {}, placeholder = 'Ketik lalu tekan Enter...' }) {
  const [input, setInput] = useState('');

  const tags = String(value || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const commit = (raw) => {
    const next = raw.trim();
    if (next === '') return;
    if (tags.includes(next)) {
      setInput('');
      return;
    }
    onChange([...tags, next].join(', '));
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag).join(', '));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      remove(tags[tags.length - 1]);
    }
  };

  return (
    <div className="w-full min-h-[42px] px-2 py-1.5 bg-neutral-50 border border-neutral-300 rounded-none focus-within:bg-white focus-within:border-amber-500 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-neutral-900 text-white text-[11px] font-mono px-2 py-1 rounded-none"
          >
            <span className="truncate max-w-[220px]">{tag}</span>
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-neutral-400 hover:text-amber-400 cursor-pointer"
              title={`Hapus ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}

        <div className="flex items-center gap-1 flex-1 min-w-[140px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => commit(input)}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] bg-transparent text-xs sm:text-sm text-neutral-950 font-medium focus:outline-none py-1.5"
          />
          {input.trim() !== '' && (
            <button
              type="button"
              onClick={() => commit(input)}
              className="w-6 h-6 flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer"
              title="Tambah"
            >
              <Plus size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
