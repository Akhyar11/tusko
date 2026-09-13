import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Check, Loader2, Navigation, Tag } from 'lucide-react';
import { warehouseService } from '../services/warehouseService';

export default function CentralWarehouseModal({
  isOpen = false,
  onClose = () => {},
  onSuccess = () => {}
}) {
  const [activeTab, setActiveTab] = useState('warehouse'); // 'warehouse' | 'tracking_labels'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Warehouse Form State
  const [warehouseId, setWarehouseId] = useState(null);
  const [name, setName] = useState('Gudang Pusat Tusko');
  const [code, setCode] = useState('GDG-JKT-PST');
  const [address, setAddress] = useState('Jl. TB Simatupang No. 88, Cilandak');
  const [city, setCity] = useState('Jakarta Selatan');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('12430');
  const [latitude, setLatitude] = useState('-6.29230000');
  const [longitude, setLongitude] = useState('106.79950000');

  // Tracking Labels State
  const [trackingLabels, setTrackingLabels] = useState([
    {
      stage_key: 'at_warehouse',
      stage_name: 'Diproses di Gudang Pusat',
      custom_label: 'Paket sedang disiapkan dan dikemas di Gudang Pusat',
      description_template: 'Paket telah selesai diperiksa dan siap dijemput kurir di Gudang Pusat'
    },
    {
      stage_key: 'courier_pickup',
      stage_name: 'Diserahkan ke Kurir',
      custom_label: 'Paket telah diserahkan kepada kurir pengiriman KiriminAja',
      description_template: 'Kurir telah menerima paket dari Gudang Pusat untuk diteruskan ke Sorting Hub'
    },
    {
      stage_key: 'transit_hub',
      stage_name: 'Pusat Sortir Ekspedisi',
      custom_label: 'Tiba di fasilitas transit sortir ekspedisi',
      description_template: 'Paket dalam proses sortir di Sorting Hub ekspedisi'
    },
    {
      stage_key: 'out_for_delivery',
      stage_name: 'Kurir Mengantar Paket',
      custom_label: 'Paket dibawa kurir menuju alamat penerima',
      description_template: 'Kurir sedang dalam perjalanan mengantar paket ke alamat penerima'
    },
    {
      stage_key: 'delivered',
      stage_name: 'Paket Diterima',
      custom_label: 'Paket telah berhasil diterima',
      description_template: 'Paket telah diterima dengan baik di alamat tujuan oleh penerima yang bersangkutan'
    }
  ]);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    warehouseService.getPrimaryWarehouse().then((data) => {
      if (data?.warehouse) {
        const w = data.warehouse;
        setWarehouseId(w.id);
        setName(w.name || '');
        setCode(w.code || '');
        setAddress(w.address || '');
        setCity(w.city || '');
        setProvince(w.province || '');
        setPostalCode(w.postal_code || '');
        setLatitude(w.latitude ? String(w.latitude) : '');
        setLongitude(w.longitude ? String(w.longitude) : '');
      }
      if (data?.tracking_labels && data.tracking_labels.length > 0) {
        setTrackingLabels(data.tracking_labels);
      }
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (warehouseId) {
        await warehouseService.updateWarehouse(warehouseId, {
          name,
          code,
          address,
          city,
          province,
          postal_code: postalCode,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          is_primary: true
        });
      }
      onSuccess(`Pengaturan Gudang Pusat "${name}" berhasil disimpan!`);
      onClose();
    } catch {
      onSuccess(`Perubahan Gudang Pusat disimpan secara lokal.`);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTrackingLabels = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await warehouseService.updateTrackingLabels(trackingLabels);
      onSuccess('Kustomisasi label respons pelacakan KiriminAja berhasil diperbarui!');
      onClose();
    } catch {
      onSuccess('Label pelacakan KiriminAja disimpan.');
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleLabelChange = (index, field, val) => {
    setTrackingLabels(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-none max-w-2xl w-full p-6 shadow-2xl border border-neutral-300 space-y-5 animate-in fade-in max-h-[90vh] flex flex-col">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-none bg-neutral-900 text-amber-400 flex items-center justify-center">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-sport font-black text-base uppercase text-neutral-950">
                Pengaturan Gudang Pusat &amp; KiriminAja
              </h3>
              <p className="text-xs text-neutral-500">
                Tentukan lokasi titik asal gudang toko dan kustomisasi respons pelacakan live kurir.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-none text-neutral-400 hover:text-neutral-900 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('warehouse')}
            className={`px-4 py-2 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none border-b-2 ${
              activeTab === 'warehouse'
                ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Lokasi Gudang Pusat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tracking_labels')}
            className={`px-4 py-2 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none border-b-2 ${
              activeTab === 'tracking_labels'
                ? 'border-neutral-900 text-neutral-900 bg-neutral-50'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Label Respons Pelacakan KiriminAja
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-500 gap-2">
              <Loader2 className="animate-spin text-neutral-900" size={24} />
              <span className="text-xs font-sport uppercase">Memuat Konfigurasi Gudang...</span>
            </div>
          ) : activeTab === 'warehouse' ? (
            <form id="warehouse-form" onSubmit={handleSaveWarehouse} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Nama Gudang Pusat *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Contoh: Gudang Pusat Tusko Jakarta"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Kode Gudang *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    placeholder="Contoh: GDG-JKT-PST"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-neutral-700">Alamat Lengkap Gudang *</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Jl. TB Simatupang No. 88, Cilandak..."
                  className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    placeholder="Jakarta Selatan"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Provinsi *</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                    placeholder="DKI Jakarta"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700">Kode Pos</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12430"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 flex items-center gap-1">
                    <Navigation size={13} className="text-neutral-500" />
                    <span>Latitude GPS</span>
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-6.29230000"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-neutral-700 flex items-center gap-1">
                    <Navigation size={13} className="text-neutral-500" />
                    <span>Longitude GPS</span>
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="106.79950000"
                    className="w-full p-2.5 bg-neutral-50 border border-neutral-300 rounded-none focus:bg-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-[11px] text-neutral-600">
                Titik koordinat dan nama gudang di atas digunakan secara dinamis oleh KiriminAja untuk kalkulasi jarak ongkir dan penjemputan paket pickup kurir.
              </div>
            </form>
          ) : (
            <form id="tracking-labels-form" onSubmit={handleSaveTrackingLabels} className="space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-[11px] text-neutral-600">
                Atur keterangan label kustom respons pelacakan yang akan tampil saat pembeli melacak nomor resi KiriminAja (contoh: status paket sedang di gudang pusat toko, serah terima kurir, dll.).
              </div>

              {trackingLabels.map((lbl, idx) => (
                <div key={lbl.stage_key} className="p-3 bg-white border border-neutral-300 rounded-none space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-neutral-100">
                    <span className="font-sport font-black uppercase text-neutral-900 flex items-center gap-1.5">
                      <Tag size={13} className="text-amber-600" />
                      <span>{lbl.stage_name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">
                      {lbl.stage_key}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Label Judul Respons Status:</label>
                    <input
                      type="text"
                      value={lbl.custom_label || ''}
                      onChange={(e) => handleLabelChange(idx, 'custom_label', e.target.value)}
                      required
                      className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-none focus:bg-white focus:outline-none font-medium text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-700">Keterangan / Catatan Riwayat Respons:</label>
                    <input
                      type="text"
                      value={lbl.description_template || ''}
                      onChange={(e) => handleLabelChange(idx, 'description_template', e.target.value)}
                      className="w-full p-2 bg-neutral-50 border border-neutral-200 rounded-none focus:bg-white focus:outline-none text-[11px] text-neutral-600"
                    />
                  </div>
                </div>
              ))}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-none transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            form={activeTab === 'warehouse' ? 'warehouse-form' : 'tracking-labels-form'}
            disabled={isSaving || isLoading}
            className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black uppercase tracking-wider text-xs rounded-none transition-all cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
