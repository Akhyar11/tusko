import React from 'react';
import { Ruler, TableProperties } from 'lucide-react';
import TextInput from './molecules/TextInput';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import RepeaterField from './molecules/RepeaterField';

const ROW_FIELDS = [
  { key: 'uk', label: 'UK' },
  { key: 'eur', label: 'EUR' },
  { key: 'us', label: 'US' },
  { key: 'cm', label: 'Panjang (CM)' },
  { key: 'raw_size', label: 'Ukuran Varian (pencocokan)' },
];

const labelCls = 'block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5';

/**
 * Form bersama Master Panduan Ukuran (dipakai halaman Create & Edit).
 */
export default function SizeChartForm({ value, onChange, categories = [] }) {
  const set = (key, val) => onChange({ ...value, [key]: val });

  return (
    <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
      <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
        <Ruler size={16} className="text-amber-500" /> Informasi Tabel Ukuran
      </h2>

      <div>
        <label className={labelCls}>Nama Tabel <span className="text-rose-500">*</span></label>
        <TextInput
          value={value.name || ''}
          onChange={(v) => set('name', v)}
          placeholder="Contoh: Konversi Ukuran Sepatu Lari"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kategori Terkait</label>
          <ServerSideSelect
            value={value.category_id ? String(value.category_id) : ''}
            onChange={(v) => set('category_id', v || '')}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Pilih kategori (kosongkan untuk default)..."
            isClearable
            scrollPadding={30}
          />
        </div>
        <div className="flex flex-col justify-end gap-3 pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={!!value.is_default} onChange={(v) => set('is_default', v)} />
            <span className="text-xs font-sport font-bold uppercase text-neutral-800">Jadikan Tabel Default</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={!!value.is_active} onChange={(v) => set('is_active', v)} />
            <span className="text-xs font-sport font-bold uppercase text-neutral-800">Aktif</span>
          </label>
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3 mb-4">
          <TableProperties size={16} className="text-amber-500" /> Baris Konversi Ukuran
        </h2>
        <RepeaterField
          value={value.rows || '[]'}
          onChange={(json) => set('rows', json)}
          itemFields={ROW_FIELDS}
          addLabel="Tambah Baris Ukuran"
        />
      </div>
    </div>
  );
}
