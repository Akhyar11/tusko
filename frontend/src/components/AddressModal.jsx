import React, { useState } from 'react';
import { MapPin, Plus, Check, X, Search, Edit3, Trash2 } from 'lucide-react';

export default function AddressModal({
  isOpen = false,
  onClose = () => {},
  addresses = [],
  selectedAddressId = null,
  onSelectAddress = () => {},
  onSaveAddress = () => {},
  onDeleteAddress = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    label: 'Rumah',
    recipient_name: '',
    phone: '',
    full_address: '',
    city: '',
    province: '',
    postal_code: '',
    is_default: false
  });

  const [formErrors, setFormErrors] = useState({});

  if (!isOpen) return null;

  // Filter addresses
  const filteredAddresses = addresses.filter(addr =>
    addr.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    addr.full_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddForm = () => {
    setEditingId(null);
    setFormData({
      label: 'Rumah',
      recipient_name: '',
      phone: '',
      full_address: '',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postal_code: '12190',
      is_default: addresses.length === 0
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (addr) => {
    setEditingId(addr.id);
    setFormData({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      full_address: addr.full_address,
      city: addr.city,
      province: addr.province,
      postal_code: addr.postal_code,
      is_default: addr.is_default
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.recipient_name.trim()) errors.recipient_name = 'Nama penerima wajib diisi';
    if (!formData.phone.trim()) errors.phone = 'Nomor telepon wajib diisi';
    if (!formData.full_address.trim()) errors.full_address = 'Alamat lengkap wajib diisi';
    if (!formData.city.trim()) errors.city = 'Kota wajib diisi';
    if (!formData.postal_code.trim()) errors.postal_code = 'Kode pos wajib diisi';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSaveAddress({
      ...formData,
      id: editingId || Date.now()
    });

    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-emerald-600" />
            <h3 className="font-bold text-sm sm:text-base text-gray-900">
              {isFormOpen 
                ? (editingId ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru')
                : 'Pilih Alamat Pengiriman'}
            </h3>
          </div>
          <button
            onClick={() => {
              if (isFormOpen) {
                setIsFormOpen(false);
              } else {
                onClose();
              }
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {isFormOpen ? (
            /* Add / Edit Form */
            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Label Alamat</label>
                <div className="flex gap-2">
                  {['Rumah', 'Kantor', 'Apartemen', 'Kos'].map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, label: lbl }))}
                      className={`px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
                        formData.label === lbl
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Nama Penerima *</label>
                  <input
                    type="text"
                    value={formData.recipient_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-gray-50"
                  />
                  {formErrors.recipient_name && (
                    <span className="text-[10px] text-rose-600">{formErrors.recipient_name}</span>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Nomor Telepon *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="0812xxxxxxx"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-gray-50"
                  />
                  {formErrors.phone && (
                    <span className="text-[10px] text-rose-600">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Alamat Lengkap *</label>
                <textarea
                  rows={2}
                  value={formData.full_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_address: e.target.value }))}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-gray-50 resize-none"
                />
                {formErrors.full_address && (
                  <span className="text-[10px] text-rose-600">{formErrors.full_address}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Kota / Kabupaten *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Jakarta Selatan"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-gray-50"
                  />
                  {formErrors.city && (
                    <span className="text-[10px] text-rose-600">{formErrors.city}</span>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Kode Pos *</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="12190"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-gray-50"
                  />
                  {formErrors.postal_code && (
                    <span className="text-[10px] text-rose-600">{formErrors.postal_code}</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="text-xs text-gray-700">Jadikan sebagai alamat utama</span>
                </label>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Alamat
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
                    className="w-full pl-8 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl text-xs border border-emerald-200 cursor-pointer shrink-0 transition-colors"
                >
                  <Plus size={14} />
                  <span>Tambah</span>
                </button>
              </div>

              {filteredAddresses.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Tidak ada alamat yang sesuai pencarian.
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
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
                            : 'border-gray-200 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-gray-900">
                                {addr.recipient_name}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
                                {addr.label}
                              </span>
                              {addr.is_default && (
                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                                  Utama
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">{addr.phone}</p>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {addr.full_address}, {addr.city}, {addr.province}, {addr.postal_code}
                        </p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditForm(addr);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
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
                              className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
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
