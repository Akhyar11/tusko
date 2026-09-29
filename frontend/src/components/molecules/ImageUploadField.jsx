import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import FileInput from './FileInput';
import { apiClient } from '../../services/apiClient';

/**
 * Molecule: ImageUploadField — unggah gambar ke Storage (R2) untuk konten storefront.
 * Memakai FileInput (aturan 28) + endpoint admin `/api/admin/storefront/image`.
 */
export default function ImageUploadField({
  value = '',
  onChange = () => {},
  placeholder = 'Pilih gambar...',
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiClient.post('/api/admin/storefront/image', formData);
      onChange(response?.data?.url || '');
    } catch (err) {
      setError(err?.message || 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <FileInput accept="image/*" disabled={uploading} onChange={handleFile}>
        <div className="w-full h-[42px] px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-none flex items-center gap-2 cursor-pointer hover:bg-neutral-100 transition-colors">
          {uploading ? (
            <Loader2 size={15} className="animate-spin text-amber-500" />
          ) : (
            <Upload size={15} className="text-neutral-500" />
          )}
          <span className="text-neutral-600 font-medium">
            {uploading ? 'Mengunggah...' : (value ? 'Ganti gambar' : placeholder)}
          </span>
        </div>
      </FileInput>

      {value && (
        <img src={value} alt="Pratinjau" className="w-full max-h-40 object-cover border border-neutral-200 rounded-none" />
      )}
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
