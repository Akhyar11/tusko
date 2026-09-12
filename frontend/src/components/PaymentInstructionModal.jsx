import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Building2, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  X, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ChevronDown
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
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 24 hours countdown timer
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || !orderData) return null;

  const {
    invoiceNumber = 'INV/2026/TSK-0001',
    vaNumber = '8808123456789012',
    totalAmount = 0,
    paymentMethod = { name: 'BCA Virtual Account', type: 'midtrans' }
  } = orderData;

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'va') {
      setCopiedVa(true);
      setTimeout(() => setCopiedVa(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmPaid = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setPaymentSuccess(true);
      onPaymentConfirmed({
        ...orderData,
        paymentStatus: 'paid',
        status: 'processing'
      });
    }, 800);
  };

  // Format time
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const instructionsObj = paymentMethod.instructions || {};
  const instructionChannels = Object.keys(instructionsObj);
  const currentSteps = instructionChannels.length > 0 ? instructionsObj[instructionChannels[activeInstructionTab]] || [] : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-none max-w-lg w-full p-5 sm:p-6 shadow-2xl border-2 border-black max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-black text-white flex items-center justify-center -skew-x-6">
              {paymentMethod.icon === 'QrCode' ? <QrCode size={16} className="text-amber-400 skew-x-6" /> : <CreditCard size={16} className="text-amber-400 skew-x-6" />}
            </div>
            <div>
              <h3 className="font-sport font-black uppercase text-sm sm:text-base text-black tracking-wide">
                Instruksi Pembayaran
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                Invoice: <strong className="text-black font-mono">{invoiceNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-none text-neutral-400 hover:text-black hover:bg-neutral-100 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">

          {/* Payment Success state banner */}
          {paymentSuccess ? (
            <div className="py-8 text-center space-y-3 bg-neutral-100 rounded-none border-2 border-black">
              <div className="w-14 h-14 bg-black text-amber-400 rounded-none flex items-center justify-center mx-auto shadow-none -skew-x-6">
                <Check size={32} strokeWidth={3} className="skew-x-6" />
              </div>
              <h4 className="font-sport font-black text-lg uppercase text-black">Konfirmasi Diterima!</h4>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto font-medium">
                Terima kasih, pembayaranmu telah dikonfirmasi. Pesananmu akan segera diproses oleh gudang Tusko!
              </p>
            </div>
          ) : (
            <>
              {/* Countdown Timer Banner */}
              <div className="p-3 bg-amber-400/20 border border-amber-400 rounded-none flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-black font-sport font-bold uppercase">
                  <Clock size={16} className="text-amber-600 shrink-0 animate-pulse" />
                  <span>Selesaikan dalam</span>
                </div>
                <span className="font-mono font-black text-xs sm:text-sm text-black bg-white px-2.5 py-0.5 rounded-none border border-neutral-300 tracking-wider">
                  {timeFormatted}
                </span>
              </div>

              {/* Total Amount Box */}
              <div className="p-4 bg-neutral-50 rounded-none border border-neutral-300 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-sport font-bold uppercase text-neutral-500 block">Total Jumlah Pembayaran</span>
                  <span className="font-sport font-black text-xl text-black">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(totalAmount), 'amount')}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-black rounded-none text-xs font-sport font-black uppercase text-black flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy size={12} />
                  <span>{copiedAmount ? 'Disalin!' : 'Salin'}</span>
                </button>
              </div>

              {/* Payment Method Specific Credentials */}
              {paymentMethod.type === 'midtrans' && paymentMethod.id !== 'qris' && (
                /* Virtual Account details */
                <div className="p-4 bg-white rounded-none border-2 border-black space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sport font-black uppercase text-black">{paymentMethod.name}</span>
                    <span className="text-[10px] font-sport font-black uppercase text-black bg-amber-400 px-2 py-0.5 rounded-none">
                      Otomatis
                    </span>
                  </div>
                  <div className="p-3 bg-neutral-50 rounded-none border border-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-sport font-bold uppercase text-neutral-400 block">Nomor Virtual Account</span>
                      <span className="font-mono text-sm sm:text-base font-black text-black tracking-wider">
                        {vaNumber}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(vaNumber, 'va')}
                      className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-none text-xs font-sport font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy size={12} />
                      <span>{copiedVa ? 'Disalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* QRIS Display */}
              {paymentMethod.id === 'qris' && (
                <div className="p-4 bg-white rounded-none border-2 border-black text-center space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-sport font-black uppercase text-black">
                    <QrCode size={16} className="text-black" />
                    <span>Scan Kode QRIS Nasional</span>
                  </div>

                  {/* Visual SVG QR Code placeholder */}
                  <div className="w-48 h-48 mx-auto bg-white p-3 rounded-none border-2 border-dashed border-black flex flex-col items-center justify-center relative">
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-neutral-100 rounded-none">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-none ${
                            (i % 2 === 0 || i % 5 === 0) ? 'bg-black' : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black p-1.5 text-white font-sport font-black text-[10px] tracking-wider rounded-none">
                        QRIS
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 font-medium">
                    Mendukung GoPay, OVO, DANA, BCA mobile, LinkAja, ShopeePay, dan semua aplikasi bank berlogo QRIS.
                  </p>
                </div>
              )}

              {/* Manual Bank Transfer Credentials */}
              {paymentMethod.type === 'manual' && (
                <div className="p-4 bg-white rounded-none border-2 border-black space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sport font-black uppercase text-black">{paymentMethod.bankName || paymentMethod.name}</span>
                    <span className="text-[10px] font-sport font-black uppercase text-black bg-amber-400 px-2 py-0.5 rounded-none">
                      Verifikasi 1x24 Jam
                    </span>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-none border border-neutral-300 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-sport font-bold uppercase text-neutral-400 block">Nomor Rekening Resmi</span>
                      <span className="font-mono text-sm sm:text-base font-black text-black">
                        {paymentMethod.accountNumber || '873-019-2819'}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-medium block">
                        a.n {paymentMethod.accountHolder || 'PT Tusko Performa Indonesia'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentMethod.accountNumber || '873-019-2819', 'va')}
                      className="px-3.5 py-2 bg-black hover:bg-neutral-800 text-white rounded-none text-xs font-sport font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy size={12} />
                      <span>{copiedVa ? 'Disalin!' : 'Salin'}</span>
                    </button>
                  </div>

                  {/* Bukti Transfer Upload */}
                  <div className="pt-2">
                    <label className="text-xs font-sport font-black uppercase text-black block mb-1.5">
                      Unggah Bukti Transfer <span className="text-red-500">*</span>
                    </label>
                    <div className="border-2 border-dashed border-neutral-300 rounded-none p-4 text-center bg-white hover:bg-neutral-50 transition-colors relative cursor-pointer">
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
                            className="w-12 h-12 object-cover rounded-none border border-neutral-300"
                          />
                          <div className="text-left text-xs">
                            <span className="font-sport font-bold uppercase text-black flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-amber-500" /> {proofFile?.name}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-medium block">Klik untuk mengganti foto</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <UploadCloud size={22} className="mx-auto text-black" />
                          <p className="text-xs font-sport font-bold uppercase text-black">Pilih foto struk / tangkapan layar m-banking</p>
                          <p className="text-[10px] text-neutral-400 font-medium">Format JPG, PNG, maks 5 MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Instructions */}
              {instructionChannels.length > 0 && (
                <div className="bg-white rounded-none border border-neutral-300 p-4 space-y-3">
                  <h4 className="text-xs font-sport font-black uppercase text-black flex items-center gap-1.5">
                    <HelpCircle size={14} className="text-black" />
                    <span>Petunjuk Cara Pembayaran</span>
                  </h4>

                  {/* Channel Tabs */}
                  {instructionChannels.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-neutral-200">
                      {instructionChannels.map((channel, idx) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setActiveInstructionTab(idx)}
                          className={`px-3 py-1.5 rounded-none text-xs font-sport font-black uppercase tracking-wider whitespace-nowrap cursor-pointer transition-colors ${
                            activeInstructionTab === idx
                              ? 'bg-black text-white'
                              : 'text-neutral-500 hover:text-black'
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Steps List */}
                  <ol className="space-y-2 text-xs text-neutral-700">
                    {currentSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-5 h-5 rounded-none bg-black text-white text-[10px] font-sport font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{step.replace('{{va_number}}', vaNumber)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Security Banner */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-sport font-bold uppercase text-neutral-500 pt-1">
                <ShieldCheck size={14} className="text-black shrink-0" />
                <span>Pembayaran aman dilindungi enkripsi Gateway &amp; Garansi Toko</span>
              </div>
            </>
          )}

        </div>

        {/* Modal Action Buttons Footer */}
        <div className="pt-3 border-t-2 border-black flex items-center gap-3 shrink-0">
          {!paymentSuccess && (
            <button
              type="button"
              disabled={isVerifying}
              onClick={handleConfirmPaid}
              className="flex-1 py-3 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-none font-sport font-black uppercase text-xs tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 -skew-x-3 hover:skew-x-0"
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
            className={`py-3 px-5 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 rounded-none font-sport font-bold uppercase text-xs transition-colors cursor-pointer ${
              paymentSuccess ? 'w-full bg-black text-white hover:bg-neutral-800 border-black' : ''
            }`}
          >
            {paymentSuccess ? 'Selesai &amp; Ke Beranda' : 'Nanti Saja'}
          </button>
        </div>

      </div>
    </div>
  );
}
