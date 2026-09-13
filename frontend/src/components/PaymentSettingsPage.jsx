import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  RotateCcw, 
  ExternalLink,
  Layers,
  Clock,
  Sparkles,
  Key,
  QrCode,
  Building2,
  Lock
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

export default function PaymentSettingsPage({
  onShowToast = () => {},
  onBackToDashboard = () => {}
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    payment_mode: 'midtrans_popup',
    is_production: false,
    merchant_id: '',
    client_key: '',
    server_key: '',
    expiry_duration_hours: 24,
    enable_va: true,
    enable_qris: true,
    enable_cc: true,
    is_active: true,
    has_server_key: false,
  });

  // Fetch current payment settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/payment-settings');
      if (res?.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data,
          server_key: '', // Keep masked for security unless edited
        }));
      }
    } catch (err) {
      onShowToast('Gagal memuat pengaturan payment gateway dari server.', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        payment_mode: settings.payment_mode,
        is_production: Boolean(settings.is_production),
        merchant_id: settings.merchant_id || null,
        client_key: settings.client_key || null,
        expiry_duration_hours: Number(settings.expiry_duration_hours) || 24,
        enable_va: Boolean(settings.enable_va),
        enable_qris: Boolean(settings.enable_qris),
        enable_cc: Boolean(settings.enable_cc),
        is_active: Boolean(settings.is_active),
      };

      if (settings.server_key.trim()) {
        payload.server_key = settings.server_key.trim();
      }

      const res = await apiClient.put('/api/payment-settings', payload);
      if (res?.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data,
          server_key: '',
        }));
        onShowToast('Pengaturan payment gateway Midtrans berhasil disimpan!');
      }
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Gagal menyimpan pengaturan payment gateway.';
      onShowToast(msg, { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const paymentModes = [
    {
      id: 'midtrans_popup',
      title: 'Popup Midtrans Snap (Modal Terbuka di Layar Toko)',
      desc: 'Pelanggan menyelesaikan pembayaran langsung melalui pop-up modal Snap Midtrans di situs Tusko (QRIS/GoPay, Virtual Account, Kartu Kredit). Paling direkomendasikan untuk konversi tinggi.',
      badge: 'Rekomendasi Utama',
      icon: Sparkles
    },
    {
      id: 'store_custom',
      title: 'Tampilan Pembayaran Storefront (Instruksi Internal Toko)',
      desc: 'Nomor Virtual Account dan petunjuk transfer ditampilkan langsung di dalam antarmuka toko Tusko. Pelanggan menyalin kode bayar dan dapat melakukan cek verifikasi otomatis.',
      badge: 'Native Store View',
      icon: Building2
    },
    {
      id: 'midtrans_redirect',
      title: 'Redirect Halaman Pembayaran Midtrans (Hosted Payment)',
      desc: 'Pelanggan dialihkan langsung ke URL pembayaran mandiri Midtrans (VT-Web) dan otomatis kembali ke toko setelah pembayaran selesai.',
      badge: 'Eksternal Redirect',
      icon: ExternalLink
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Header Module Card */}
      <div className="bg-white rounded-none border border-neutral-300 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-neutral-950 text-amber-400 rounded-none flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-sport font-black uppercase text-neutral-950 tracking-tight">
              Pengaturan Payment Gateway &amp; Midtrans
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Kelola mode pembayaran (Popup Snap vs Tampilan Toko), kunci API Midtrans, dan status verifikasi transaksi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={isLoading || isSaving}
            className="px-3.5 py-2 border border-neutral-300 hover:bg-neutral-100 rounded-none text-xs font-sport font-black uppercase text-neutral-800 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Muat Ulang Pengaturan"
          >
            <RotateCcw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-none text-xs font-sport font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save size={14} className="text-amber-400" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        </div>
      </div>

      {/* KPI Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 border border-neutral-300 rounded-none shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block">Mode Pembayaran Aktif</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-amber-500" />
            <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
              {settings.payment_mode === 'midtrans_popup' ? 'Popup Midtrans Snap' :
               settings.payment_mode === 'store_custom' ? 'Tampilan Storefront' : 'Redirect Midtrans'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Tersinkronisasi ke Checkout</p>
        </div>

        <div className="bg-white p-4 border border-neutral-300 rounded-none shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block">Lingkungan Gateway</span>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-none ${settings.is_production ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
              {settings.is_production ? 'PRODUKSI (LIVE)' : 'SANDBOX (TESTING)'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">API Midtrans v1/v2</p>
        </div>

        <div className="bg-white p-4 border border-neutral-300 rounded-none shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block">Status Server Key</span>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className={settings.has_server_key ? 'text-emerald-700' : 'text-neutral-400'} />
            <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
              {settings.has_server_key ? 'Terverifikasi' : 'Belum Dikonfigurasi'}
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Validasi SHA-512 Webhook</p>
        </div>

        <div className="bg-white p-4 border border-neutral-300 rounded-none shadow-2xs space-y-1">
          <span className="text-[10px] font-mono uppercase text-neutral-500 block">Batas Waktu Bayar</span>
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-neutral-700" />
            <h3 className="font-sport font-black text-sm uppercase text-neutral-950">
              {settings.expiry_duration_hours} Jam
            </h3>
          </div>
          <p className="text-[11px] text-neutral-500 font-mono">Auto-cancel jika expired</p>
        </div>
      </div>

      {/* Main Form Layout */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Payment Display Mode Selector */}
        <div className="bg-white rounded-none border border-neutral-300 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-sport font-black text-base uppercase text-neutral-950">
              1. Pilihan Mode Tampilan Pembayaran (Payment Gateway Experience)
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Tentukan bagaimana pembeli menyelesaikan pembayaran pesanan saat checkout storefront.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paymentModes.map((mode) => {
              const isSelected = settings.payment_mode === mode.id;
              const ModeIcon = mode.icon;

              return (
                <div
                  key={mode.id}
                  onClick={() => setSettings(prev => ({ ...prev, payment_mode: mode.id }))}
                  className={`p-4 rounded-none border-2 cursor-pointer transition-all space-y-3 relative ${
                    isSelected 
                      ? 'border-neutral-950 bg-amber-50/40 shadow-xs' 
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-none flex items-center justify-center ${
                        isSelected ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        <ModeIcon size={16} />
                      </div>
                      <span className="text-[10px] font-sport font-black uppercase px-2 py-0.5 bg-neutral-100 text-neutral-900 border border-neutral-300 rounded-none">
                        {mode.badge}
                      </span>
                    </div>

                    <input
                      type="radio"
                      name="payment_mode"
                      value={mode.id}
                      checked={isSelected}
                      onChange={() => setSettings(prev => ({ ...prev, payment_mode: mode.id }))}
                      className="cursor-pointer accent-neutral-950 mt-1"
                    />
                  </div>

                  <div>
                    <h3 className="font-sport font-black text-xs uppercase text-neutral-950 leading-snug">
                      {mode.title}
                    </h3>
                    <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
                      {mode.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Gateway Credentials & Environment */}
        <div className="bg-white rounded-none border border-neutral-300 p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-sport font-black text-base uppercase text-neutral-950">
              2. Kredensial &amp; Konfigurasi API Midtrans
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Hubungkan akun Midtrans resmi Anda melalui Merchant ID, Client Key, dan Server Key.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Environment Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Lingkungan Server Midtrans
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, is_production: false }))}
                  className={`py-2 px-3 text-xs font-sport font-black uppercase border rounded-none cursor-pointer transition-colors ${
                    !settings.is_production
                      ? 'bg-neutral-950 text-amber-400 border-neutral-950'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  Sandbox (Uji Coba)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, is_production: true }))}
                  className={`py-2 px-3 text-xs font-sport font-black uppercase border rounded-none cursor-pointer transition-colors ${
                    settings.is_production
                      ? 'bg-neutral-950 text-emerald-400 border-neutral-950'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-300 hover:bg-neutral-100'
                  }`}
                >
                  Produksi (Live)
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">
                {settings.is_production
                  ? 'Kunci produksi langsung memproses dana transaksi riil.'
                  : 'Mode sandbox aman untuk pengujian simulator tanpa uang sungguhan.'}
              </p>
            </div>

            {/* Merchant ID */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Merchant ID
              </label>
              <input
                type="text"
                value={settings.merchant_id || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
                placeholder="Contoh: G123456789"
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-mono"
              />
            </div>

            {/* Client Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Client Key (Kunci Publik Frontend)
              </label>
              <input
                type="text"
                value={settings.client_key || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, client_key: e.target.value }))}
                placeholder="SB-Mid-client-..."
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-mono text-neutral-900"
              />
              <p className="text-[10px] text-neutral-500">
                Digunakan untuk memuat script Snap JS secara aman di browser pembeli.
              </p>
            </div>

            {/* Server Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Server Key (Kunci Rahasia Backend)
              </label>
              <input
                type="password"
                value={settings.server_key}
                onChange={(e) => setSettings(prev => ({ ...prev, server_key: e.target.value }))}
                placeholder={settings.has_server_key ? '•••••••••••••••••••••••• (Kunci tersimpan aman)' : 'SB-Mid-server-...'}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-mono text-neutral-900"
              />
              <p className="text-[10px] text-neutral-500">
                Biarkan kosong jika Anda tidak ingin mengubah Server Key yang tersimpan.
              </p>
            </div>
          </div>

          {/* Webhook Endpoint Info Box */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-none text-xs space-y-1">
            <span className="font-sport font-black uppercase text-neutral-900 block">
              URL Webhook / Notification Handler Toko:
            </span>
            <code className="text-[11px] font-mono bg-white px-2 py-1 border border-neutral-300 block text-neutral-800">
              {window.location.origin}/api/webhooks/midtrans
            </code>
            <p className="text-[10px] text-neutral-500 mt-1">
              Pasang URL ini pada pengaturan <em>Payment Notification URL</em> di Dashboard Midtrans Anda untuk verifikasi otomatis instan.
            </p>
          </div>
        </div>

        {/* Section 3: Expiry & Channels */}
        <div className="bg-white rounded-none border border-neutral-300 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="border-b border-neutral-200 pb-3">
            <h2 className="font-sport font-black text-base uppercase text-neutral-950">
              3. Batas Waktu &amp; Kanal Pembayaran
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Atur toleransi waktu transfer dan kanal pembayaran yang diizinkan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Expiry Hours */}
            <div className="space-y-1.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Batas Waktu Kedaluwarsa Pesanan (Jam)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={settings.expiry_duration_hours || 24}
                onChange={(e) => setSettings(prev => ({ ...prev, expiry_duration_hours: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-none focus:outline-none focus:border-black font-mono"
              />
              <p className="text-[10px] text-neutral-500">
                Pesanan yang tidak dibayar dalam durasi ini akan dibatalkan otomatis dan stok dikembalikan.
              </p>
            </div>

            {/* Channels Checkboxes */}
            <div className="space-y-2.5">
              <label className="block text-xs font-sport font-black uppercase text-neutral-900">
                Kanal Pembayaran Aktif
              </label>
              
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.enable_va}
                  onChange={(e) => setSettings(prev => ({ ...prev, enable_va: e.target.checked }))}
                  className="accent-neutral-950"
                />
                <span className="font-medium text-neutral-900">Virtual Account (BCA, Mandiri, BNI, BRI, Permata)</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.enable_qris}
                  onChange={(e) => setSettings(prev => ({ ...prev, enable_qris: e.target.checked }))}
                  className="accent-neutral-950"
                />
                <span className="font-medium text-neutral-900">QRIS &amp; Dompet Digital (GoPay, ShopeePay, DANA)</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.enable_cc}
                  onChange={(e) => setSettings(prev => ({ ...prev, enable_cc: e.target.checked }))}
                  className="accent-neutral-950"
                />
                <span className="font-medium text-neutral-900">Kartu Kredit / Debit Online (Visa, Mastercard, JCB - 3D Secure)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving || isLoading}
            className="px-6 py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-none text-xs font-sport font-black uppercase tracking-wider shadow-md transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={15} className="text-amber-400" />
            <span>{isSaving ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
