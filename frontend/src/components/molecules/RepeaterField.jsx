import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import TextInput from './TextInput';
import ServerSideSelect from './ServerSideSelect';
import ImageUploadField from './ImageUploadField';
import { categoryService } from '../../services/categoryService';

/**
 * Molecule: RepeaterField — penyusun daftar item terstruktur (pengganti input JSON mentah).
 * Nilai disimpan sebagai string JSON (kompatibel parser storefront).
 *
 * @param {string} props.value - JSON string array objek
 * @param {function} props.onChange - (jsonString) => void
 * @param {Array} props.itemFields - [{ key, label, type: 'text'|'image'|'category', placeholder? }]
 */
export default function RepeaterField({ value = '', onChange = () => {}, itemFields = [], addLabel = 'Tambah Item' }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!itemFields.some((f) => f.type === 'category')) return undefined;
    let mounted = true;
    categoryService.fetchCategories({ all: true })
      .then((res) => {
        if (mounted) setCategories(res?.data || []);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [itemFields]);

  let items = [];
  try {
    const parsed = value ? JSON.parse(value) : [];
    items = Array.isArray(parsed) ? parsed : [];
  } catch {
    items = [];
  }

  const emit = (next) => onChange(JSON.stringify(next));

  const addItem = () => {
    const empty = {};
    itemFields.forEach((f) => { empty[f.key] = ''; });
    emit([...items, empty]);
  };

  const updateItem = (index, key, val) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: val } : item));
    emit(next);
  };

  const removeItem = (index) => emit(items.filter((_, i) => i !== index));

  const moveItem = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    emit(next);
  };

  const renderItemField = (item, index, field) => {
    const val = item[field.key] ?? '';

    if (field.type === 'image') {
      return (
        <div className="sm:col-span-2">
          <label className="block text-[10.5px] font-sport font-black uppercase tracking-wider text-neutral-700 mb-1">{field.label}</label>
          <ImageUploadField value={val} onChange={(url) => updateItem(index, field.key, url)} placeholder="Unggah gambar..." />
        </div>
      );
    }

    if (field.type === 'category') {
      return (
        <div>
          <label className="block text-[10.5px] font-sport font-black uppercase tracking-wider text-neutral-700 mb-1">{field.label}</label>
          <ServerSideSelect
            value={val === '' || val === null || val === undefined ? '' : String(val)}
            onChange={(v) => updateItem(index, field.key, v)}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Pilih kategori..."
            isClearable
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-[10.5px] font-sport font-black uppercase tracking-wider text-neutral-700 mb-1">{field.label}</label>
        <TextInput
          value={String(val ?? '')}
          onChange={(v) => updateItem(index, field.key, v)}
          placeholder={field.placeholder || field.label}
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <div className="p-4 border border-dashed border-neutral-300 rounded-none text-center text-[11px] text-neutral-500 flex flex-col items-center gap-1.5">
          <Layers size={18} className="text-neutral-400" />
          Belum ada item. Klik “{addLabel}” untuk menambah.
        </div>
      ) : (
        items.map((item, index) => (
          <div key={index} className="border border-neutral-300 rounded-none bg-white">
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 bg-neutral-50">
              <span className="text-[10.5px] font-sport font-black uppercase tracking-wider text-neutral-600">
                Item #{index + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveItem(index, -1)} disabled={index === 0} title="Naikkan" className="w-7 h-7 flex items-center justify-center border border-neutral-300 text-neutral-600 hover:bg-neutral-100 cursor-pointer disabled:opacity-40 rounded-none">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} title="Turunkan" className="w-7 h-7 flex items-center justify-center border border-neutral-300 text-neutral-600 hover:bg-neutral-100 cursor-pointer disabled:opacity-40 rounded-none">
                  <ChevronDown size={14} />
                </button>
                <button type="button" onClick={() => removeItem(index)} title="Hapus item" className="w-7 h-7 flex items-center justify-center border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer rounded-none">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {itemFields.map((f) => (
                <React.Fragment key={f.key}>{renderItemField(item, index, f)}</React.Fragment>
              ))}
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={addItem}
        className="w-full py-2 border border-dashed border-neutral-400 text-neutral-700 hover:bg-neutral-50 text-[11px] font-sport font-black uppercase tracking-wider cursor-pointer rounded-none flex items-center justify-center gap-1.5"
      >
        <Plus size={14} />
        <span>{addLabel}</span>
      </button>
    </div>
  );
}
