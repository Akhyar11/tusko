import React from 'react';
import { 
  CreditCard, 
  Warehouse, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';

/**
 * OrderFulfillmentStepper
 * Tusko Sharp & Athletic Performance Design System (rounded-none, high-contrast)
 * Visualizes the 5 discrete fulfillment milestones:
 * 1. Verifikasi Pembayaran
 * 2. Masuk Antrean Gudang
 * 3. Sedang Dikemas di Gudang
 * 4. Diserahkan ke Kurir
 * 5. Paket Tiba di Tujuan
 */
export default function OrderFulfillmentStepper({
  order = {},
  warehouseName = 'Gudang Pusat Tusko',
  onTrackClick = null,
  compact = false
}) {
  const status = order.status || 'pending';
  const paymentStatus = order.payment_status || (status === 'pending' ? 'unpaid' : 'paid');
  const trackingNumber = order.expedition?.tracking_number || order.tracking_number;
  const courierName = order.expedition?.name || order.expedition_name || 'Kurir KiriminAja';

  // Handle cancelled state
  if (status === 'cancelled' || status === 'failed') {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-none text-red-900 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-red-600 shrink-0" />
          <div>
            <span className="font-sport font-black uppercase block">Pesanan Dibatalkan</span>
            <span className="text-[11px] text-red-700">Transaksi tidak dilanjutkan ke proses gudang atau pengiriman kurir.</span>
          </div>
        </div>
      </div>
    );
  }

  // Determine current active step (1 to 5)
  // 1: Pending payment
  // 2: Paid / Order placed in warehouse queue
  // 3: Processing / Packing in warehouse
  // 4: Shipped / Handed to courier & in transit
  // 5: Completed / Delivered
  let currentStep = 1;
  if (status === 'completed' || status === 'delivered') {
    currentStep = 5;
  } else if (status === 'shipped') {
    currentStep = 4;
  } else if (status === 'processing') {
    currentStep = 3;
  } else if (status === 'paid' || paymentStatus === 'paid') {
    currentStep = 2;
  } else {
    currentStep = 1;
  }

  const steps = [
    {
      step: 1,
      title: 'Pembayaran',
      desc: currentStep > 1 ? 'Terverifikasi' : 'Menunggu Bayar',
      icon: CreditCard,
    },
    {
      step: 2,
      title: 'Antrean Gudang',
      desc: currentStep >= 2 ? (order.warehouse_name || warehouseName) : 'Gudang Pusat',
      icon: Warehouse,
    },
    {
      step: 3,
      title: 'Sedang Dikemas',
      desc: currentStep >= 3 ? 'Pengepakan Selesai' : 'Siap Dikemas',
      icon: PackageCheck,
    },
    {
      step: 4,
      title: 'Kurir Ekspedisi',
      desc: trackingNumber ? `Resi: ${trackingNumber.slice(0, 12)}...` : courierName,
      icon: Truck,
    },
    {
      step: 5,
      title: 'Tiba di Tujuan',
      desc: currentStep === 5 ? 'Paket Diterima' : 'Estimasi Tujuan',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-neutral-50 p-3.5 sm:p-4 rounded-none border border-neutral-200 space-y-3">
      {/* Stepper Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-none bg-amber-500 animate-pulse" />
          <span className="font-sport font-black uppercase text-neutral-950 text-[11px] sm:text-xs tracking-wide">
            Posisi Terkini:{' '}
            <span className="text-amber-700">
              {currentStep === 1 && 'Menunggu Pembayaran Pelanggan'}
              {currentStep === 2 && `Pesanan Masuk di ${order.warehouse_name || warehouseName}`}
              {currentStep === 3 && `Sedang Dikemas & Quality Check di ${order.warehouse_name || warehouseName}`}
              {currentStep === 4 && `Paket Diserahkan ke ${courierName} (Dalam Perjalanan)`}
              {currentStep === 5 && 'Paket Telah Berhasil Diterima Pembeli'}
            </span>
          </span>
        </div>

        {onTrackClick && (
          <button
            type="button"
            onClick={onTrackClick}
            className="text-[11px] font-sport font-black uppercase text-neutral-900 hover:text-amber-700 underline underline-offset-2 cursor-pointer transition-colors"
          >
            Lihat Detail Alur &rarr;
          </button>
        )}
      </div>

      {/* 5-Step Process Visualizer */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 pt-1 relative">
        {steps.map((s, idx) => {
          const isCompleted = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isUpcoming = currentStep < s.step;
          const Icon = s.icon;

          return (
            <div key={s.step} className="flex flex-col items-center text-center relative group">
              {/* Connector Line behind steps */}
              {idx < steps.length - 1 && (
                <div 
                  className={`hidden sm:block absolute top-3.5 left-1/2 w-full h-0.5 z-0 ${
                    currentStep > s.step ? 'bg-black' : 'bg-neutral-200'
                  }`} 
                />
              )}

              {/* Step Circle / Box (rounded-none strict) */}
              <div 
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-none z-10 flex items-center justify-center border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-black text-amber-400 border-black shadow-2xs'
                    : isCurrent
                      ? 'bg-amber-400 text-black border-black font-black ring-2 ring-amber-200'
                      : 'bg-white text-neutral-400 border-neutral-300'
                }`}
                title={`${s.title}: ${s.desc}`}
              >
                <Icon size={14} className="sm:w-4 sm:h-4" />
              </div>

              {/* Step Label */}
              <div className="mt-1.5 space-y-0.5 w-full">
                <p className={`font-sport font-black uppercase text-[9px] sm:text-[10px] leading-tight line-clamp-1 ${
                  isCurrent ? 'text-black' : isCompleted ? 'text-neutral-800' : 'text-neutral-400'
                }`}>
                  {s.title}
                </p>
                {!compact && (
                  <p className="text-[8px] sm:text-[9px] font-mono text-neutral-500 line-clamp-1 hidden sm:block">
                    {s.desc}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
