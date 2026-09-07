import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  Clock, 
  X, 
  QrCode, 
  Building2, 
  CreditCard, 
  UploadCloud, 
  Check, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export default function PaymentInstructionModal({
  isOpen = false,
  onClose = () => {},
  orderData = null,
  onPaymentConfirmed = () => {}
}) {
  const [copiedVa, setCopiedVa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState(0);
  const [timeLeft, setTimeLeft] = useState(86399); // 23h 59m 59s
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const {
    invoiceNumber,
    vaNumber,
    totalAmount,
    paymentMethod = {},
    expedition = {},
    items = []
  } = orderData;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPaid = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onPaymentConfirmed(orderData);
      }, 1500);
    }, 1200);
  };

  const instructionsObj = paymentMethod.instructions || {};
  const instructionChannels = Object.keys(instructionsObj);
  const currentSteps = instructionChannels.length > 0 ? instructionsObj[instructionChannels[activeInstructionTab]] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              {paymentMethod.icon === 'QrCode' ? <QrCode size={18} /> : <CreditCard size={18} />}
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Instruksi Pembayaran
              </h3>
              <p className="text-[11px] text-gray-500">
                Invoice: <strong className="text-gray-800">{invoiceNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">

          {/* Payment Success state banner */}
          {paymentSuccess ? (
            <div className="py-8 text-center space-y-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
                <Check size={32} strokeWidth={3} />
              </div>
              <h4 className="font-black text-base text-emerald-900">Konfirmasi Diterima!</h4>
              <p className="text-xs text-emerald-700 max-w-xs mx-auto">
                Terima kasih, pembayaranmu telah dikonfirmasi. Pesananmu akan segera diproses oleh penjual!
              </p>
            </div>
          ) : (
            <>
              {/* Countdown Timer Banner */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock size={16} className="text-amber-600 shrink-0 animate-pulse" />
                  <span>Selesaikan dalam</span>
                </div>
                <span className="font-mono font-black text-xs sm:text-sm text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 tracking-wider">
                  {timeFormatted}
                </span>
              </div>

              {/* Total Amount Box */}
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-gray-500 block">Total Jumlah Pembayaran</span>
                  <span className="font-black text-base sm:text-lg text-gray-900">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(totalAmount), 'amount')}
                  className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Copy size={12} />
                  <span>{copiedAmount ? 'Disalin!' : 'Salin Jumlah'}</span>
                </button>
              </div>

              {/* Payment Method Specific Credentials */}
              {paymentMethod.type === 'midtrans' && paymentMethod.id !== 'qris' && (
                /* Virtual Account details */
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">{paymentMethod.name}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                      Otomatis
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Nomor Virtual Account</span>
                      <span className="font-mono text-sm sm:text-base font-black text-emerald-700 tracking-wider">
                        {vaNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(vaNumber, 'va')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Copy size={12} />
                      <span>{copiedVa ? 'Disalin!' : 'Salin Nomor'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QRIS Display */}
              {paymentMethod.id === 'qris' && (
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-800">
                    <QrCode size={16} className="text-emerald-600" />
                    <span>Scan Kode QRIS Nasional</span>
                  </div>

                  {/* Visual SVG QR Code placeholder */}
                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-dashed border-emerald-400 shadow-xs flex flex-col items-center justify-center relative">
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-gray-50 rounded-xl">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 2 === 0 || i % 5 === 0) ? 'bg-gray-900' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white p-1 rounded-md shadow-xs border border-gray-200 text-[9px] font-black text-emerald-700">
                        QRIS
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500">
                    Mendukung GoPay, OVO, DANA, BCA mobile, LinkAja, ShopeePay, dan semua aplikasi bank berlogo QRIS.
                  </p>
                </div>
              )}

              {/* Manual Bank Transfer Credentials */}
              {paymentMethod.type === 'manual' && (
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">{paymentMethod.bankName || paymentMethod.name}</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Verifikasi 1x24 Jam
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 flex items-center justify-between shadow-2xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block font-medium">Nomor Rekening Resmi</span>
                      <span className="font-mono text-sm sm:text-base font-black text-emerald-800">
                        {paymentMethod.accountNumber || '873-019-2819'}
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        a.n {paymentMethod.accountHolder || 'PT Toko Online Mandiri'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentMethod.accountNumber || '873-019-2819', 'va')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Copy size={12} />
                      <span>{copiedVa ? 'Disalin!' : 'Salin Rekening'}</span>
                    </button>
                  </div>

                  {/* Bukti Transfer Upload */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-gray-800 block mb-1.5">
                      Unggah Bukti Transfer <span className="text-rose-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 text-center bg-white hover:bg-gray-50 transition-colors relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {proofPreview ? (
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={proofPreview}
                            alt="Bukti Transfer"
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          />
                          <div className="text-left text-xs">
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 size={13} /> {proofFile?.name}
                            </span>
                            <span className="text-[10px] text-gray-400 block">Klik untuk mengganti foto</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud size={22} className="mx-auto text-emerald-600" />
                          <p className="text-xs font-semibold text-gray-700">Pilih foto struk / tangkapan layar m-banking</p>
                          <p className="text-[10px] text-gray-400">Format JPG, PNG, maks 5 MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              {instructionChannels.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-emerald-600" />
                    <span>Petunjuk Cara Pembayaran</span>
                  </h4>

                  {/* Channel Tabs */}
                  {instructionChannels.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-gray-100">
                      {instructionChannels.map((channel, idx) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setActiveInstructionTab(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                            activeInstructionTab === idx
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Steps List */}
                  <ol className="space-y-2 text-xs text-gray-700">
                    {currentSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                        <span className="w-4.5 h-4.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                          {idx + 1}
                        </span>
                        <span>{step.replace('{{va_number}}', vaNumber)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
                <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                <span>Pembayaran aman dilindungi enkripsi Midtrans & Garansi Toko</span>
              </div>
            </>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
          {!paymentSuccess && (
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleConfirmPaid}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isVerifying ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Saya Sudah Bayar</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
              paymentSuccess ? 'w-full bg-emerald-600 text-white hover:bg-emerald-700' : ''
            }`}
          >
            {paymentSuccess ? 'Selesai & Ke Halaman Utama' : 'Nanti Saja'}
          </button>
        </div>

      </div>
    </div>
  );
}
