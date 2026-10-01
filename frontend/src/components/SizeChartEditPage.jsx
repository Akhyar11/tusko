import React, { useEffect, useState } from 'react';
import { ArrowLeft, X, Save, AlertCircle } from 'lucide-react';
import IconButton from './atoms/IconButton';
import SizeChartForm from './SizeChartForm';
import FormTipsPanel from './organisms/FormTipsPanel';
import { sizeChartService } from '../services/sizeChartService';
import { categoryService } from '../services/categoryService';

const TIPS = [
  { icon: 'Ruler', heading: 'Nama & Kategori', text: 'Ubah nama/kategori bila tabel ini dipindahkan ke kategori lain.' },
  { icon: 'Star', heading: 'Tabel Default', text: 'Hanya satu tabel yang boleh menjadi default; menyimpan sebagai default akan menonaktifkan default lain.' },
  { icon: 'TableProperties', heading: 'Baris Konversi', text: 'Perbarui baris UK/EUR/US/Panjang dan ukuran varian untuk pencocokan.' },
];

export default function SizeChartEditPage({ chartId, onShowToast = () => {}, onNavigateBack = () => {} }) {
  const [value, setValue] = useState({ name: '', category_id: '', is_default: false, is_active: true, rows: '[]' });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoryService.fetchCategories({ all: true }).then((res) => setCategories(res?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!chartId) return;
    let mounted = true;
    setIsLoading(true);
    sizeChartService.getChart(chartId)
      .then((chart) => {
        if (!mounted || !chart) return;
        setValue({
          name: chart.name || '',
          category_id: chart.category_id ? String(chart.category_id) : '',
          is_default: !!chart.is_default,
          is_active: !!chart.is_active,
          rows: JSON.stringify(chart.rows || []),
        });
      })
      .catch((err) => setError(err?.message || 'Gagal memuat tabel ukuran.'))
      .finally(() => mounted && setIsLoading(false));
    return () => { mounted = false; };
  }, [chartId]);

  const handleSubmit = async () => {
    setError('');
    if (!value.name || !value.name.trim()) {
      setError('Nama tabel wajib diisi.');
      return;
    }
    let rows = [];
    try { rows = value.rows ? JSON.parse(value.rows) : []; } catch { rows = []; }

    setIsSaving(true);
    try {
      await sizeChartService.updateChart(chartId, {
        name: value.name.trim(),
        category_id: value.category_id ? Number(value.category_id) : null,
        is_default: !!value.is_default,
        is_active: !!value.is_active,
        rows,
      });
      onShowToast('Panduan ukuran berhasil diperbarui.');
      onNavigateBack();
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui panduan ukuran.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} variant="outline" title="Kembali ke Panduan Ukuran" onClick={onNavigateBack} />
          <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950">Ubah Panduan Ukuran</h1>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={X} variant="secondary" title="Batal" onClick={onNavigateBack} />
          <IconButton icon={Save} variant="primary" title="Simpan" onClick={handleSubmit} disabled={isSaving || isLoading} />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
          <span className="text-xs font-sport font-bold uppercase flex items-center gap-2"><AlertCircle size={16} className="text-rose-600" /> {error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-600 hover:text-rose-800 cursor-pointer"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="bg-white p-6 border border-neutral-300 rounded-none text-xs text-neutral-500">Memuat tabel ukuran…</div>
          ) : (
            <SizeChartForm value={value} onChange={setValue} categories={categories} />
          )}
        </div>
        <div className="lg:col-span-1">
          <FormTipsPanel title="Panduan Pengisian" tips={TIPS} />
        </div>
      </div>
    </div>
  );
}
