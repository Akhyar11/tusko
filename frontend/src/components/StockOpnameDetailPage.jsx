import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  X,
  Send,
  BadgeCheck,
  ClipboardCheck,
  Warehouse,
  Package,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import ConfirmationModal from './ConfirmationModal';
import { stockOpnameService } from '../services/stockOpnameService';

const STATUS_STYLES = {
  draft: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-300',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-300',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300'
};

const STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'Diajukan',
  approved: 'Disetujui',
  rejected: 'Ditolak'
};

export default function StockOpnameDetailPage({
  opname: initialOpname = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [opname, setOpname] = useState(initialOpname);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionType, setActionType] = useState(null);

  const loadOpname = async () => {
    if (!initialOpname?.id) return;
    try {
      const fresh = await stockOpnameService.getOpname(initialOpname.id);
      if (fresh) setOpname(fresh);
    } catch (err) {
      onShowToast('Gagal memuat detail opname: ' + err.message);
    }
  };

  useEffect(() => {
    loadOpname();
  }, [initialOpname?.id]);

  const items = opname?.items || [];
  const totalDifference = items.reduce((sum, item) => sum + (item.difference || 0), 0);
  const plusCount = items.filter((item) => (item.difference || 0) > 0).length;
  const minusCount = items.filter((item) => (item.difference || 0) < 0).length;

  const runAction = async () => {
    if (!opname || !actionType) return;
    setIsSubmitting(true);
    try {
      if (actionType === 'submit') {
        await stockOpnameService.submitOpname(opname.id);
        onShowToast(`Sesi ${opname.opname_number} diajukan untuk persetujuan.`);
      } else {
        await stockOpnameService.approveOpname(opname.id);
        onShowToast(`Sesi ${opname.opname_number} disetujui & stok disesuaikan.`);
      }
      setActionType(null);
      loadOpname();
    } catch (err) {
      onShowToast(err.message || 'Gagal memproses sesi opname.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Stock Opname" variant="outline" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 truncate">
              {opname?.opname_number || 'Detail Opname'}
            </h1>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 text-[11px] font-sport font-black uppercase tracking-wider border rounded-none ${STATUS_STYLES[opname?.status] || STATUS_STYLES.draft}`}>
              {STATUS_LABELS[opname?.status] || opname?.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {opname?.status === 'draft' && (
            <IconButton icon={Send} onClick={() => setActionType('submit')} title="Ajukan Persetujuan" variant="secondary" />
          )}
          {opname?.status === 'in_progress' && (
            <IconButton icon={BadgeCheck} onClick={() => setActionType('approve')} title="Setujui & Sesuaikan Stok" variant="primary" />
          )}
          <IconButton icon={X} onClick={onNavigateBack} title="Tutup" variant="secondary" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Jumlah Item</span>
            <Package size={16} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-neutral-950">{items.length}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Baris dihitung</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Selisih Lebih</span>
            <ArrowUp size={16} className="text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-emerald-700">{plusCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Fisik &gt; sistem</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Selisih Kurang</span>
            <ArrowDown size={16} className="text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-sport text-rose-700">{minusCount}</span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Fisik &lt; sistem</div>
        </div>

        <div className="bg-white p-4 rounded-none border border-neutral-300 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1.5">
            <span className="text-xs font-sport font-black uppercase tracking-wider">Total Selisih</span>
            <Minus size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-sport ${totalDifference >= 0 ? 'text-neutral-950' : 'text-rose-700'}`}>
              {totalDifference > 0 ? `+${totalDifference}` : totalDifference}
            </span>
          </div>
          <div className="mt-2 text-[11px] border-t border-neutral-100 pt-1.5 text-neutral-500">Net unit</div>
        </div>
      </div>

      <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
        <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
          <ClipboardCheck size={16} className="text-amber-500" />
          <span>Informasi Sesi</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Gudang</span>
            <span className="font-bold text-neutral-900 flex items-center gap-1.5">
              <Warehouse size={13} className="text-neutral-400" />
              {opname?.warehouse?.name || '-'} ({opname?.warehouse?.code || '-'})
            </span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Petugas</span>
            <span className="font-bold text-neutral-900">{opname?.conductor?.name || '-'}</span>
          </div>
          <div>
            <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Tanggal Pelaksanaan</span>
            <span className="font-mono text-neutral-800 flex items-center gap-1.5">
              <Calendar size={13} className="text-neutral-400" />
              {opname?.conducted_at ? String(opname.conducted_at).slice(0, 10) : '-'}
            </span>
          </div>
        </div>

        {opname?.notes && (
          <div>
            <span className="text-neutral-500 uppercase font-sport font-bold block mb-1 text-xs">Catatan</span>
            <p className="text-xs text-neutral-800 bg-neutral-50 border border-neutral-200 p-3">{opname.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-300 rounded-none shadow-2xs overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200">
          <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-amber-500" />
            <span>Rincian Item &amp; Selisih</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-950 text-white font-sport font-black uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Produk</th>
                <th className="py-3.5 px-4 text-center">Stok Sistem</th>
                <th className="py-3.5 px-4 text-center">Stok Fisik</th>
                <th className="py-3.5 px-4 text-center">Selisih</th>
                <th className="py-3.5 px-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-4 text-center text-neutral-500">
                    Tidak ada item pada sesi ini.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-sport font-bold text-neutral-950 uppercase text-xs">{item.product?.name || '-'}</div>
                      {item.variant?.name && <div className="text-[11px] text-neutral-500">{item.variant.name}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-neutral-800">{item.system_stock}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-950">{item.physical_stock}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono font-black ${
                          item.difference > 0 ? 'text-emerald-700' : item.difference < 0 ? 'text-rose-700' : 'text-neutral-500'
                        }`}
                      >
                        {item.difference > 0 ? <ArrowUp size={12} /> : item.difference < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(actionType)}
        onClose={() => setActionType(null)}
        onConfirm={runAction}
        title={actionType === 'approve' ? 'Setujui Sesi Opname' : 'Ajukan Sesi Opname'}
        message={
          actionType === 'approve'
            ? `Setujui sesi ${opname?.opname_number}? Stok akan disesuaikan sesuai selisih fisik dan jurnal penyesuaian dibuat.`
            : `Ajukan sesi ${opname?.opname_number} untuk proses persetujuan?`
        }
        confirmText={actionType === 'approve' ? 'Setujui & Sesuaikan' : 'Ajukan'}
        cancelText="Batal"
        variant={actionType === 'approve' ? 'warning' : 'info'}
        isLoading={isSubmitting}
      />
    </div>
  );
}
