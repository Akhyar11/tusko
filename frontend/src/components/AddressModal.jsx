import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Check, X, Search, Edit3, Trash2, AlertCircle, Building2, Home, Briefcase } from 'lucide-react';

const PROVINCES_AND_CITIES = {
  'DKI Jakarta': ['Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara', 'Kepulauan Seribu'],
  'Jawa Barat': ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cimahi', 'Cirebon', 'Sukabumi', 'Tasikmalaya', 'Karawang', 'Purwakarta', 'Garut'],
  'Banten': ['Tangerang', 'Tangerang Selatan', 'Serang', 'Cilegon', 'Lebak', 'Pandeglang'],
  'Jawa Tengah': ['Semarang', 'Surakarta (Solo)', 'Magelang', 'Pekalongan', 'Salatiga', 'Tegal', 'Banyumas', 'Kudus'],
  'DI Yogyakarta': ['Yogyakarta', 'Sleman', 'Bantul', 'Kulon Progo', 'Gunungkidul'],
  'Jawa Timur': ['Surabaya', 'Malang', 'Sidoarjo', 'Gresik', 'Kediri', 'Blitar', 'Madiun', 'Mojokerto', 'Pasuruan', 'Banyuwangi'],
  'Bali': ['Denpasar', 'Badung', 'Gianyar', 'Buleleng', 'Tabanan'],
  'Sumatera Utara': ['Medan', 'Binjai', 'Pematangsiantar', 'Deli Serdang'],
  'Sumatera Barat': ['Padang', 'Bukittinggi', 'Payakumbuh'],
  'Riau': ['Pekanbaru', 'Dumai'],
  'Sumatera Selatan': ['Palembang', 'Prabumulih', 'Lubuklinggau'],
  'Lampung': ['Bandar Lampung', 'Metro'],
  'Kalimantan Timur': ['Balikpapan', 'Samarinda', 'Bontang'],
  'Sulawesi Selatan': ['Makassar', 'Parepare', 'Palopo']
};

export default function AddressModal({
  isOpen = false,
  onClose = () => {},
  addresses = [],
  selectedAddressId = null,
  onSelectAddress = () => {},
  onSaveAddress = () => {},
  onDeleteAddress = () => {},
  initialMode = 'list' // 'list' | 'add'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(initialMode === 'add');
  const [editingId, setEditingId] = useState(null);

  // Form state
  const defaultProvince = 'DKI Jakarta';
  const defaultCity = PROVINCES_AND_CITIES[defaultProvince][0];

  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone: '',
    full_address: '',
    district: '',
    city: defaultCity,
    province: defaultProvince,
    postal_code: '',
    notes: '',
    is_default: false
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialMode === 'add') {
        handleOpenAddForm();
      } else {
        setIsFormOpen(false);
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Filter addresses
  const filteredAddresses = addresses.filter(addr =>
    addr.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.full_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      label: 'Rumah',
      recipient_name: '',
      phone: '',
      full_address: '',
      district: '',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '',
      notes: '',
      is_default: addresses.length === 0
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (addr) => {
    setEditingId(addr.id);
    const prov = addr.province && PROVINCES_AND_CITIES[addr.province] ? addr.province : 'DKI Jakarta';
    setFormData({
      label: addr.label || 'Rumah',
      recipient_name: addr.recipient_name || '',
      phone: addr.phone || '',
      full_address: addr.full_address || '',
      district: addr.district || '',
      city: addr.city || PROVINCES_AND_CITIES[prov][0],
      province: prov,
      postal_code: addr.postal_code || '',
      notes: addr.notes || '',
      is_default: addr.is_default || false
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleProvinceChange = (newProvince) => {
    const availableCities = PROVINCES_AND_CITIES[newProvince] || [];
    setFormData(prev => ({
      ...prev,
      province: newProvince,
      city: availableCities[0] || ''
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.recipient_name.trim()) {
      errors.recipient_name = 'Nama penerima wajib diisi';
    } else if (formData.recipient_name.trim().length < 2) {
      errors.recipient_name = 'Nama penerima minimal 2 karakter';
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^(08|\+?628)[0-9]{7,12}$/.test(cleanPhone)) {
      errors.phone = 'Format nomor HP tidak valid (contoh: 08123456789)';
    }

    if (!formData.full_address.trim()) {
      errors.full_address = 'Alamat lengkap wajib diisi';
    } else if (formData.full_address.trim().length < 8) {
      errors.full_address = 'Alamat terlalu singkat (cantumkan nama jalan & nomor)';
    }

    if (!formData.province) {
      errors.province = 'Provinsi wajib dipilih';
    }

    if (!formData.city) {
      errors.city = 'Kota / Kabupaten wajib dipilih';
    }

    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Kode pos wajib diisi';
    } else if (!/^[0-9]{5}$/.test(formData.postal_code.trim())) {
      errors.postal_code = 'Kode pos harus 5 digit angka';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newId = editingId || Date.now();
    const addressToSave = {
      ...formData,
      id: newId,
      phone: formData.phone.trim(),
      postal_code: formData.postal_code.trim()
    };

    onSaveAddress(addressToSave);
    onSelectAddress(newId);
    setIsFormOpen(false);
    setEditingId(null);
    onClose();
  };

  const labelPresets = [
    { name: 'Rumah', icon: Home },
    { name: 'Kantor', icon: Briefcase },
    { name: 'Apartemen', icon: Building2 },
    { name: 'Kos', icon: MapPin }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-none max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-black max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-black text-white flex items-center justify-center -skew-x-6">
              <MapPin size={16} className="text-amber-400 skew-x-6" />
            </div>
            <div>
              <h3 className="font-sport font-black uppercase text-sm sm:text-base text-black tracking-wide">
                {isFormOpen 
                  ? (editingId ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Pengiriman Baru')
                  : 'Pilih Alamat Pengiriman'}
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                {isFormOpen 
                  ? 'Pastikan rincian alamat akurat untuk kemudahan kurir' 
                  : 'Pilih alamat tujuan pengiriman pesananmu'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isFormOpen && initialMode !== 'add') {
                setIsFormOpen(false);
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-none text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
          {isFormOpen ? (
            /* Add / Edit Form */
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              {/* Label Alamat */}
              <div>
                <label className="font-sport font-bold uppercase text-black block mb-1.5">
                  Label Alamat <span className="text-neutral-400 font-normal">(Contoh: Rumah, Kantor)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {labelPresets.map((preset) => {
                    const Icon = preset.icon;
                    const isSelected = formData.label === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, label: preset.name }))}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-none border font-sport font-bold uppercase text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-black bg-black text-white'
                            : 'border-neutral-300 text-black hover:bg-neutral-100'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Penerima & Nomor Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Nama Penerima <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                    placeholder="Contoh: Budi Pratama"
                    className={`w-full px-3 py-2 border rounded-none focus:outline-none focus:border-black font-medium transition-colors ${
                      formErrors.recipient_name 
                        ? 'border-red-500 bg-red-50/50' 
                        : 'border-neutral-300 bg-neutral-50 focus:bg-white'
                    }`}
                  />
                  {formErrors.recipient_name && (
                    <span className="text-[10px] font-sport font-bold text-red-600 block mt-1">{formErrors.recipient_name}</span>
                  )}
                </div>

                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Nomor Telepon / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 08123456789"
                    className={`w-full px-3 py-2 border rounded-none focus:outline-none focus:border-black font-mono font-medium transition-colors ${
                      formErrors.phone 
                        ? 'border-red-500 bg-red-50/50' 
                        : 'border-neutral-300 bg-neutral-50 focus:bg-white'
                    }`}
                  />
                  {formErrors.phone && (
                    <span className="text-[10px] font-sport font-bold text-red-600 block mt-1">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              {/* Wilayah: Provinsi & Kota */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Provinsi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:outline-none focus:border-black bg-neutral-50 focus:bg-white cursor-pointer font-medium"
                  >
                    {Object.keys(PROVINCES_AND_CITIES).map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Kota / Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:outline-none focus:border-black bg-neutral-50 focus:bg-white cursor-pointer font-medium"
                  >
                    {(PROVINCES_AND_CITIES[formData.province] || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kecamatan & Kode Pos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                    placeholder="Contoh: Gambir"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:outline-none focus:border-black bg-neutral-50 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-sport font-bold uppercase text-black block mb-1">
                    Kode Pos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="Contoh: 10110"
                    className={`w-full px-3 py-2 border rounded-none focus:outline-none focus:border-black font-mono font-medium transition-colors ${
                      formErrors.postal_code 
                        ? 'border-red-500 bg-red-50/50' 
                        : 'border-neutral-300 bg-neutral-50 focus:bg-white'
                    }`}
                  />
                  {formErrors.postal_code && (
                    <span className="text-[10px] font-sport font-bold text-red-600 block mt-1">{formErrors.postal_code}</span>
                  )}
                </div>
              </div>

              {/* Alamat Lengkap */}
              <div>
                <label className="font-sport font-bold uppercase text-black block mb-1">
                  Alamat Lengkap <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.full_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_address: e.target.value }))}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, gedung/patokan..."
                  className={`w-full px-3 py-2 border rounded-none focus:outline-none focus:border-black resize-none font-medium transition-colors ${
                    formErrors.full_address 
                      ? 'border-red-500 bg-red-50/50' 
                      : 'border-neutral-300 bg-neutral-50 focus:bg-white'
                  }`}
                />
                {formErrors.full_address && (
                  <span className="text-[10px] font-sport font-bold text-red-600 block mt-1">{formErrors.full_address}</span>
                )}
              </div>

              {/* Catatan untuk Kurir */}
              <div>
                <label className="font-sport font-bold uppercase text-black block mb-1">
                  Catatan Patokan untuk Kurir <span className="text-neutral-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Contoh: Pagar hitam depan lapangan basket"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-none focus:outline-none focus:border-black bg-neutral-50 focus:bg-white font-medium"
                />
              </div>

              {/* Jadikan Alamat Utama */}
              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded-none accent-black border-neutral-300 cursor-pointer"
                  />
                  <span className="font-sport font-bold uppercase text-black text-xs">Jadikan Alamat Utama Pengiriman</span>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-black rounded-none border border-neutral-300 font-sport font-bold uppercase transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-none font-sport font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Simpan &amp; Gunakan
                </button>
              </div>
            </form>
          ) : (
            /* Address List */
            <>
              {/* Search Bar & Add Button */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari penerima atau alamat..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-medium"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-black hover:bg-neutral-800 text-white font-sport font-black uppercase rounded-none text-xs cursor-pointer shrink-0 transition-colors"
                >
                  <Plus size={14} />
                  <span>Tambah Alamat</span>
                </button>
              </div>

              {filteredAddresses.length === 0 ? (
                <div className="py-10 text-center text-neutral-500 text-xs">
                  <MapPin size={28} className="mx-auto text-neutral-300 mb-2" />
                  <p className="font-sport font-bold uppercase">Tidak ada alamat yang sesuai pencarian.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => {
                          onSelectAddress(addr.id);
                          onClose();
                        }}
                        className={`p-3.5 rounded-none border-2 cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-black bg-neutral-50 shadow-none'
                            : 'border-neutral-200 hover:border-black bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-sport font-black uppercase text-xs sm:text-sm text-black">
                                {addr.recipient_name}
                              </span>
                              <span className="text-[10px] bg-neutral-100 text-neutral-800 font-sport font-bold uppercase px-2 py-0.5 rounded-none border border-neutral-200">
                                {addr.label}
                              </span>
                              {addr.is_default && (
                                <span className="text-[10px] bg-black text-white font-sport font-black uppercase px-1.5 py-0.5 rounded-none">
                                  Utama
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 font-mono font-medium mt-0.5">{addr.phone}</p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-none bg-black text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                          {addr.full_address}
                          {addr.district ? `, ${addr.district}` : ''}
                          {`, ${addr.city}, ${addr.province}, ${addr.postal_code}`}
                        </p>

                        {addr.notes && (
                          <p className="text-[11px] text-neutral-500 italic bg-neutral-50 px-2.5 py-1 rounded-none border border-neutral-200">
                            Patokan: {addr.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditForm(addr);
                            }}
                            className="text-black hover:text-amber-600 font-sport font-bold uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={12} />
                            <span>Ubah Alamat</span>
                          </button>

                          {addresses.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAddress(addr.id);
                              }}
                              className="text-red-600 hover:text-red-800 font-sport font-bold uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              <span>Hapus</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
