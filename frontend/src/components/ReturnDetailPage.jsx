import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  X,
  BadgeCheck,
  XCircle,
  Wallet,
  RotateCcw,
  Package,
  UserRound,
  FileText,
  AlertCircle
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import ServerSideSelect from './molecules/ServerSideSelect';
import ConfirmationModal from './ConfirmationModal';
import { returnService } from '../services/returnService';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-800 border-amber-300',
  approved: 'bg-sky-50 text-sky-800 border-sky-300',
  rejected: 'bg-rose-50 text-rose-700 border-rose-300',
  refunded: 'bg-emerald-50 text-emerald-800 border-emerald-300'
};

const STATUS_LABELS = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  refunded: 'Direfund'
};

const refundMethodOptions = [
  { value: 'manual', label: 'Manual (Transfer)' },
  { value: 'midtrans', label: 'Midtrans (Online)' }
];

export default function ReturnDetailPage({
  orderReturn: initialReturn = null,
  onNavigateBack = () => {},
  onShowToast = () => {}
}) {
  const [data, setData] = useState(initialReturn);
  const [rejectionReason, setRejectionReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('manual');
  const [refundReference, setRefundReference] = useState('');
  const [action, setAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!initialReturn?.id) return;
    try {
      const fresh = await returnService.getReturn(initialReturn.id);
      if (fresh) setData(fresh);
    } catch (err) {
      onShowToast('Gagal memuat detail retur: ' + err.message);
    }
  }, [initialReturn?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!data || !action) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      setErrorMessage('Alasan penolakan wajib diisi.');
      setAction(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (action === 'approve') {
        await returnService.approveReturn(data.id);
        onShowToast('Retur disetujui.');
      } else if (action === 'reject') {
        await returnService.rejectReturn(data.id, rejectionReason.trim());
        onShowToast('Retur ditolak.');
      } else if (action === 'refund') {
        await returnService.refundReturn(data.id, refundMethod, refundReference.trim() || null);
        onShowToast('Retur berhasil direfund (stok & poin disesuaikan).');
      }
      setAction(null);
      await load();
    } catch (err) {
      const validation = err.errors ? Object.values(err.errors).flat().join(' ') : '';
      setErrorMessage(validation || err.message || 'Gagal memproses retur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <IconButton icon={ArrowLeft} onClick={onNavigateBack} title="Kembali ke Retur & Refund" variant="outline" />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black font-sport uppercase tracking-tight text-neutral-950 truncate">
              {data?.return_number || 'Detail Retur'}
            </h1>
            <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 text-[11px] font-sport font-black uppercase tracking-wider border rounded-none ${STATUS_STYLES[data?.status] || STATUS_STYLES.pending}`}>
              {STATUS_LABELS[data?.status] || data?.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.status === 'pending' && (
            <IconButton icon={BadgeCheck} onClick={() => setAction('approve')} title="Setujui Retur" variant="primary" />
          )}
          {(data?.status === 'pending' || data?.status === 'approved') && (
            <IconButton icon={XCircle} onClick={() => setAction('reject')} title="Tolak Retur" variant="secondary" />
          )}
          <IconButton icon={X} onClick={onNavigateBack} title="Tutup" variant="secondary" />
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 text-rose-800 rounded-none flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-sport font-bold uppercase">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage('')} className="text-rose-600 hover:text-rose-800 cursor-pointer shrink-0 ml-3" aria-label="Tutup pesan error">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <UserRound size={16} className="text-amber-500" />
              <span>Informasi Pengajuan</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Pelanggan</span>
                <span className="font-bold text-neutral-900">{data?.user?.name || '-'}</span>
                <div className="text-[11px] text-neutral-500">{data?.user?.email || ''}</div>
              </div>
              <div>
                <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Pesanan</span>
                <span className="font-mono text-neutral-800">{data?.order_number || '-'}</span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Nominal Refund</span>
                <span className="font-mono font-black text-neutral-950">{`Rp ${(Number(data?.refund_amount) || 0).toLocaleString('id-ID')}`}</span>
              </div>
              <div>
                <span className="text-neutral-500 uppercase font-sport font-bold block mb-1">Tanggal Pengajuan</span>
                <span className="font-mono text-neutral-800">{data?.requested_at ? String(data.requested_at).slice(0, 10) : '-'}</span>
              </div>
            </div>
            {data?.reason && (
              <div>
                <span className="text-neutral-500 uppercase font-sport font-bold block mb-1 text-xs">Alasan</span>
                <p className="text-xs text-neutral-800 bg-neutral-50 border border-neutral-200 p-3">{data.reason}</p>
              </div>
            )}
            {data?.rejection_reason && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                Alasan penolakan: {data.rejection_reason}
              </div>
            )}
          </div>

          <div className="bg-white border border-neutral-300 rounded-none shadow-2xs overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-neutral-200">
              <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2">
                <Package size={16} className="text-amber-500" />
                <span>Item yang Diretur</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950 text-white font-sport font-black uppercase text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Produk</th>
                    <th className="py-3.5 px-4 text-center">Qty</th>
                    <th className="py-3.5 px-4 text-right">Refund</th>
                    <th className="py-3.5 px-4 text-center">Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {items.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 px-4 text-center text-neutral-500">Tidak ada item.</td></tr>
                  ) : items.map((item) => (
                    <tr key={item.id} className="hover:bg-neutral-50/80">
                      <td className="py-3.5 px-4 font-sport font-bold text-neutral-950 uppercase">{item.product_name || '-'}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-neutral-800">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-950">{`Rp ${(Number(item.refund_amount) || 0).toLocaleString('id-ID')}`}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`text-[10px] font-sport font-black uppercase ${item.restocked ? 'text-emerald-700' : 'text-neutral-400'}`}>
                          {item.restocked ? 'Ya' : 'Belum'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-4">
            <h2 className="text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3">
              <FileText size={16} className="text-amber-500" />
              <span>Aksi Moderasi</span>
            </h2>

            {data?.status === 'pending' && (
              <button
                type="button"
                onClick={() => setAction('approve')}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider cursor-pointer rounded-none flex items-center justify-center gap-2"
              >
                <BadgeCheck size={15} /> Setujui Retur
              </button>
            )}

            {(data?.status === 'pending' || data?.status === 'approved') && (
              <div className="space-y-2 border-t border-neutral-200 pt-4">
                <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Alasan Penolakan</label>
                <TextArea rows={2} value={rejectionReason} onChange={setRejectionReason} placeholder="Alasan menolak retur..." />
                <button
                  type="button"
                  onClick={() => setAction('reject')}
                  className="w-full py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-sport font-black uppercase tracking-wider cursor-pointer rounded-none flex items-center justify-center gap-2"
                >
                  <XCircle size={15} /> Tolak Retur
                </button>
              </div>
            )}

            {data?.status === 'approved' && (
              <div className="space-y-3 border-t border-neutral-200 pt-4">
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Metode Refund</label>
                  <ServerSideSelect options={refundMethodOptions} value={refundMethod} onChange={setRefundMethod} placeholder="Pilih metode refund..." />
                </div>
                <div>
                  <label className="block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5">Referensi (opsional)</label>
                  <TextInput value={refundReference} onChange={setRefundReference} placeholder="No. transfer / refund key" weight="mono" />
                </div>
                <button
                  type="button"
                  onClick={() => setAction('refund')}
                  className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-900 text-white text-xs font-sport font-black uppercase tracking-wider cursor-pointer rounded-none flex items-center justify-center gap-2"
                >
                  <Wallet size={15} /> Proses Refund
                </button>
              </div>
            )}

            {data?.status === 'refunded' && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-3">
                Refund selesai. Metode: <strong>{data?.refund_method || '-'}</strong>
                {data?.refund_reference ? <> · Ref: <span className="font-mono">{data.refund_reference}</span></> : null}
              </div>
            )}

            {data?.status === 'rejected' && (
              <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-3">
                Retur ditolak.
              </div>
            )}

            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <RotateCcw size={12} className="text-neutral-400" />
              <span>Refund memicu pengembalian stok, poin, &amp; jurnal otomatis.</span>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={Boolean(action)}
        onClose={() => setAction(null)}
        onConfirm={runAction}
        title={action === 'approve' ? 'Setujui Retur' : action === 'reject' ? 'Tolak Retur' : 'Proses Refund'}
        message={
          action === 'approve'
            ? `Setujui retur ${data?.return_number}? Setelah disetujui, retur dapat direfund.`
            : action === 'reject'
              ? `Tolak retur ${data?.return_number}?`
              : `Proses refund ${data?.return_number} via ${refundMethod}? Stok, poin, dan jurnal akan disesuaikan.`
        }
        confirmText={action === 'approve' ? 'Setujui' : action === 'reject' ? 'Tolak' : 'Proses Refund'}
        cancelText="Batal"
        variant={action === 'reject' ? 'danger' : action === 'refund' ? 'warning' : 'info'}
        isLoading={isSubmitting}
      />
    </div>
  );
}
