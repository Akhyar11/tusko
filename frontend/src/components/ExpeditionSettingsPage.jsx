import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Star, 
  Edit, 
  Trash2, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Settings2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Zap,
  Check
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { initialExpeditions, expeditionCategoriesList } from '../data/mockExpeditionSettings';
import AddExpeditionModal from './AddExpeditionModal';
import EditRateModal from './EditRateModal';

export default function ExpeditionSettingsPage({
  expeditions = initialExpeditions,
  onBack = () => {},
  onAddExpedition = () => {},
  onDeleteExpedition = () => {},
  onEditRate = () => {},
  onSetDefault = () => {},
  onToggleActive = () => {},
  onShowToast = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTargetExpedition, setDeleteTargetExpedition] = useState(null);
  const [editRateExpedition, setEditRateExpedition] = useState(null);

  // Filtered expeditions
  const filteredExpeditions = useMemo(() => {
    return expeditions.filter((exp) => {
      const matchesCategory = selectedCategory === 'Semua Kategori' || exp.category === selectedCategory;
      const matchesSearch = 
        exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.code && exp.code.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && exp.isActive) || 
        (statusFilter === 'inactive' && !exp.isActive);

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [expeditions, searchQuery, selectedCategory, statusFilter]);

  // Statistics
  const totalCount = expeditions.length;
  const activeCount = expeditions.filter(e => e.isActive).length;
  const defaultExp = expeditions.find(e => e.isDefault) || expeditions[0];
  const avgRate = expeditions.length > 0 
    ? Math.round(expeditions.reduce((s, e) => s + e.baseRate, 0) / expeditions.length)
    : 0;

  // Courier brand color helper
  const getCourierColor = (code) => {
    switch (code) {
      case 'jne':
        return 'bg-blue-600 text-white';
      case 'sicepat':
        return 'bg-rose-600 text-white';
      case 'jnt':
        return 'bg-red-600 text-white';
      case 'gosend':
        return 'bg-emerald-600 text-white';
      case 'grab':
        return 'bg-green-600 text-white';
      case 'anteraja':
        return 'bg-amber-600 text-white';
      default:
        return 'bg-neutral-800 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Transaksi / Dashboard</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Truck className="text-emerald-600" size={26} />
            <span>Pengaturan Jasa Ekspedisi</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kelola pilihan kurir pengiriman, tarif dasar (flat/per kg), dan status ekspedisi utama toko.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-none transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Tambah Ekspedisi</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Ekspedisi
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs text-gray-500">Layanan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Ekspedisi Aktif
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{activeCount}</span>
            <span className="text-xs text-gray-500">Bisa dipilih pembeli</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-none border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Ekspedisi Utama (Default)
          </span>
          <div className="flex items-center gap-1.5 truncate">
            <Star size={16} className="text-amber-500 fill-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-gray-900 truncate">
              {defaultExp?.name || '-'}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 truncate block">
            {defaultExp?.service}
          </span>
        </div>

        <div className="bg-white p-4 rounded-none border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Rata-rata Ongkir
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-gray-900">
              {formatRupiah(avgRate)}
            </span>
            <span className="text-[10px] text-gray-500">/ pesanan</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-none border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ekspedisi atau nama layanan..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-gray-50 border border-gray-200 rounded-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Aktif ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nonaktif ({totalCount - activeCount})
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 shrink-0 mr-1">Kategori:</span>
          {expeditionCategoriesList.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-none whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expeditions Data Table */}
      <div className="bg-white rounded-none border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Ekspedisi &amp; Layanan</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Estimasi (ETD)</th>
                <th className="px-4 py-3">Tarif &amp; Mode</th>
                <th className="px-4 py-3 text-center">Fitur</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Default</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExpeditions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Truck className="mx-auto text-gray-300 mb-2" size={32} />
                    <p className="font-bold text-sm text-gray-600">Tidak ada ekspedisi yang cocok</p>
                    <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau kategori filter.</p>
                  </td>
                </tr>
              ) : (
                filteredExpeditions.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                    
                    {/* Courier Name & Service */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className={`px-2 py-1 rounded-none font-black text-[11px] tracking-wider uppercase shrink-0 ${getCourierColor(exp.code)}`}>
                          {exp.code || exp.name.slice(0, 3)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-gray-900 text-xs sm:text-sm">
                              {exp.name}
                            </span>
                            {exp.isDefault && (
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold text-[9.5px] rounded-none flex items-center gap-0.5">
                                <Star size={10} className="fill-amber-500" />
                                Utama
                              </span>
                            )}
                          </div>
                          <span className="text-gray-700 font-medium block text-xs">
                            {exp.service}
                          </span>
                          <span className="text-[10.5px] text-gray-400 line-clamp-1 mt-0.5">
                            {exp.description}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-none font-bold text-[10.5px] ${
                        exp.category === 'Reguler' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        exp.category === 'Instan & Same Day' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        exp.category === 'Next Day' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Estimated Time (ETD) */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-800">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400 shrink-0" />
                        <span>{exp.etd}</span>
                      </div>
                    </td>

                    {/* Rate & Mode */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-black text-gray-900 text-xs sm:text-sm block">
                          {formatRupiah(exp.baseRate)}
                        </span>
                        <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-none ${
                          exp.rateType === 'per_kg'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-teal-50 text-teal-800 border border-teal-200'
                        }`}>
                          {exp.rateType === 'per_kg' ? 'Tarif per Kg' : 'Tarif Flat'}
                        </span>
                      </div>
                    </td>

                    {/* Features (Tracking & COD) */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <span 
                          className={`px-1.5 py-0.5 rounded-none text-[10px] font-bold ${
                            exp.trackingSupport ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={exp.trackingSupport ? 'Mendukung nomor resi live tracking' : 'Tidak mendukung tracking'}
                        >
                          Resi
                        </span>
                        <span 
                          className={`px-1.5 py-0.5 rounded-none text-[10px] font-bold ${
                            exp.codSupport ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-400'
                          }`}
                          title={exp.codSupport ? 'Mendukung Cash On Delivery' : 'Non-COD'}
                        >
                          COD
                        </span>
                      </div>
                    </td>

                    {/* Status Toggle / Indicator */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (exp.isDefault && exp.isActive) {
                            alert('Ekspedisi utama tidak dapat dinonaktifkan. Silakan pilih ekspedisi lain sebagai default terlebih dahulu.');
                            return;
                          }
                          onToggleActive(exp);
                          onShowToast(`Status ${exp.name} (${exp.service}) diubah menjadi ${!exp.isActive ? 'Aktif' : 'Nonaktif'}.`);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-none font-bold text-[11px] transition-all cursor-pointer shadow-2xs ${
                          exp.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title={exp.isActive ? 'Klik untuk menonaktifkan ekspedisi ini' : 'Klik untuk mengaktifkan ekspedisi ini'}
                      >
                        {exp.isActive ? (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-600"></span>
                          </span>
                        ) : (
                          <span className="w-2 h-2 rounded-none bg-gray-400"></span>
                        )}
                        <span>{exp.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    {/* Default Expedition Indicator & Action */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {exp.isDefault ? (
                        <div 
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-none font-black text-[11px] shadow-2xs"
                          title="Ekspedisi ini dipilih secara otomatis saat checkout pembeli"
                        >
                          <Star size={13} className="fill-amber-400 text-amber-500" />
                          <span>Utama</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSetDefault(exp);
                            onShowToast(`⭐ ${exp.name} (${exp.service}) berhasil dijadikan ekspedisi utama toko!`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-amber-800 bg-gray-50 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-none transition-all cursor-pointer shadow-2xs"
                          title="Klik untuk menjadikan ekspedisi pilihan utama pembeli"
                        >
                          <Star size={12} className="text-gray-400" />
                          <span>Set Default</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditRateExpedition(exp)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-none transition-colors cursor-pointer"
                          title="Atur Tarif & Mode Ongkir"
                        >
                          <DollarSign size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetExpedition(exp)}
                          disabled={exp.isDefault}
                          className={`p-1.5 rounded-none transition-colors cursor-pointer ${
                            exp.isDefault
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title={exp.isDefault ? 'Ekspedisi utama tidak bisa dihapus' : 'Hapus Ekspedisi'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Menampilkan <strong>{filteredExpeditions.length}</strong> dari <strong>{totalCount}</strong> jasa ekspedisi
          </span>
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Tarif di atas digunakan secara otomatis saat checkout pembeli
          </span>
        </div>
      </div>

      {/* Add Expedition Modal Popup */}
      <AddExpeditionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(newExp) => {
          if (typeof onAddExpedition === 'function') {
            onAddExpedition(newExp);
          }
          onShowToast(`Ekspedisi "${newExp.name} (${newExp.service})" berhasil ditambahkan!`);
        }}
      />

      {/* Delete Confirmation Modal Popup */}
      {deleteTargetExpedition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-none max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-none bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                  Hapus Jasa Ekspedisi?
                </h3>
                <p className="text-xs text-gray-500">
                  Tindakan ini akan menghapus kurir dari toko
                </p>
              </div>
            </div>

            <div className="bg-red-50/70 p-3.5 rounded-none border border-red-200 text-xs text-red-900 space-y-1">
              <p className="font-bold">
                {deleteTargetExpedition.name} - {deleteTargetExpedition.service}
              </p>
              <p className="text-[11px] text-red-700">
                Kategori: {deleteTargetExpedition.category} | Tarif: {formatRupiah(deleteTargetExpedition.baseRate)}
              </p>
              <p className="text-[11px] text-red-600 pt-1">
                Perhatian: Setelah dihapus, pelanggan tidak akan dapat lagi memilih layanan ekspedisi ini saat melakukan checkout belanja.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetExpedition(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-none transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteExpedition(deleteTargetExpedition);
                  onShowToast(`Ekspedisi "${deleteTargetExpedition.name} - ${deleteTargetExpedition.service}" berhasil dihapus.`);
                  setDeleteTargetExpedition(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-none transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Ya, Hapus Ekspedisi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rate Modal Popup */}
      <EditRateModal
        isOpen={Boolean(editRateExpedition)}
        onClose={() => setEditRateExpedition(null)}
        expedition={editRateExpedition}
        onSave={(updatedData) => {
          onEditRate(updatedData);
          onShowToast(`Pengaturan tarif "${editRateExpedition.name} - ${editRateExpedition.service}" berhasil disimpan!`);
          setEditRateExpedition(null);
        }}
      />

    </div>
  );
}
