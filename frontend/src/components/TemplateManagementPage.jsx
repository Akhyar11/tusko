import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Printer, 
  FileText, 
  Check, 
  Send, 
  Eye, 
  Save, 
  RotateCcw, 
  Smartphone, 
  Monitor, 
  Settings2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Truck,
  Sparkles,
  ExternalLink,
  HelpCircle,
  Barcode,
  QrCode,
  Tag,
  Palette,
  Bold,
  Italic,
  List,
  Sliders,
  FileCheck
} from 'lucide-react';
import { 
  initialEmailTemplates, 
  initialReceiptTemplate, 
  availablePlaceholders, 
  mockNotificationLogs 
} from '../data/mockTemplates';

export default function TemplateManagementPage({
  onBack = () => {},
  onShowToast = () => {}
}) {
  const [activeMainTab, setActiveMainTab] = useState('email'); // 'email' | 'receipt' | 'logs'
  
  // Email Template States
  const [emailTemplates, setEmailTemplates] = useState(initialEmailTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState('order_shipped');
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [testEmailAddress, setTestEmailAddress] = useState('budi.santoso@example.com');
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Receipt Template States
  const [receiptConfig, setReceiptConfig] = useState(initialReceiptTemplate);

  // Active email template object
  const currentEmailTemplate = emailTemplates.find(t => t.id === selectedTemplateId) || emailTemplates[0];

  // Helper to replace placeholders for live email preview
  const renderPreviewText = (text = '') => {
    if (!text) return '';
    return text
      .replace(/{customer_name}/g, 'Budi Santoso')
      .replace(/{order_number}/g, 'INV/20260907/TK/001')
      .replace(/{total_amount}/g, 'Rp 484.000')
      .replace(/{courier_name}/g, 'J&T Express')
      .replace(/{courier_service}/g, 'EZ (Reguler)')
      .replace(/{tracking_number}/g, 'TRK-98827391823')
      .replace(/{items_list}/g, '• 1x Tusko Pro Matchday Football Jersey (Size L) - Rp 349.000\n• 1x Kaos Kaki Tusko Anti-Slip - Rp 75.000')
      .replace(/{payment_method}/g, 'BCA Virtual Account')
      .replace(/{store_name}/g, currentEmailTemplate.fromName || 'Tusko Official Store');
  };

  // Update field of current email template
  const handleUpdateEmailField = (field, value) => {
    setEmailTemplates(prev => prev.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, [field]: value };
      }
      return t;
    }));
  };

  // Insert variable tag into body or active input
  const handleInsertPlaceholder = (placeholderKey) => {
    const currentBody = currentEmailTemplate.body || '';
    handleUpdateEmailField('body', currentBody + ' ' + placeholderKey);
    onShowToast(`Variabel ${placeholderKey} disisipkan ke pesan!`);
  };

  // Insert formatting snippet into email body
  const handleInsertFormat = (prefix, suffix = '') => {
    const currentBody = currentEmailTemplate.body || '';
    handleUpdateEmailField('body', currentBody + '\n' + prefix + 'Teks' + suffix);
  };

  // Handle Save Email Template
  const handleSaveEmailTemplate = () => {
    onShowToast(`Perubahan template "${currentEmailTemplate.name}" berhasil disimpan!`);
  };

  // Handle Save Receipt Template
  const handleSaveReceiptTemplate = () => {
    onShowToast('Format label resi thermal berhasil disimpan & diterapkan!');
  };

  // Handle Reset to Default Email Template
  const handleResetEmailTemplate = () => {
    const defaultTemplate = initialEmailTemplates.find(t => t.id === selectedTemplateId);
    if (defaultTemplate) {
      setEmailTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...defaultTemplate } : t));
      onShowToast('Template dikembalikan ke pengaturan awal pabrik.');
    }
  };

  // Handle Reset Receipt Template to Default
  const handleResetReceiptTemplate = () => {
    setReceiptConfig({ ...initialReceiptTemplate });
    onShowToast('Format label resi dikembalikan ke pengaturan default.');
  };

  // Send Test Email Simulation
  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      alert('Masukkan alamat email tujuan uji coba.');
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      setIsTestEmailModalOpen(false);
      onShowToast(`Email uji coba "${currentEmailTemplate.name}" berhasil dikirim ke ${testEmailAddress}!`);
    }, 700);
  };

  // Handle Test Print
  const handleTestPrintReceipt = () => {
    const originalTitle = document.title;
    document.title = `Resi_Thermal_Test_100x150`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Email theme color definitions
  const getThemeColors = (theme) => {
    switch (theme) {
      case 'blue':
        return {
          primary: 'bg-blue-600 hover:bg-blue-700',
          badge: 'bg-blue-100 text-blue-800',
          accent: 'text-blue-600',
          border: 'border-blue-500'
        };
      case 'purple':
        return {
          primary: 'bg-purple-600 hover:bg-purple-700',
          badge: 'bg-purple-100 text-purple-800',
          accent: 'text-purple-600',
          border: 'border-purple-500'
        };
      case 'rose':
        return {
          primary: 'bg-rose-600 hover:bg-rose-700',
          badge: 'bg-rose-100 text-rose-800',
          accent: 'text-rose-600',
          border: 'border-rose-500'
        };
      case 'emerald':
      default:
        return {
          primary: 'bg-emerald-600 hover:bg-emerald-700',
          badge: 'bg-emerald-100 text-emerald-800',
          accent: 'text-emerald-600',
          border: 'border-emerald-500'
        };
    }
  };

  const currentTheme = getThemeColors(currentEmailTemplate.colorTheme || 'emerald');

  // Barcode height mapping in CSS
  const getBarcodeHeightClass = (h) => {
    if (h === 'small') return 'h-10';
    if (h === 'large') return 'h-16';
    return 'h-12';
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Daftar Transaksi</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <span>Kelola Template Email & Resi</span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              Fulfillment & Notifikasi
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            Kustomisasi formulir pesan notifikasi email pembeli dan tata letak stiker label resi thermal kurir.
          </p>
        </div>

        {/* Main Navigation Tab Switches */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveMainTab('email')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeMainTab === 'email'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail size={15} className={activeMainTab === 'email' ? 'text-emerald-600' : ''} />
            <span>Template Email</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveMainTab('receipt')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeMainTab === 'receipt'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Printer size={15} className={activeMainTab === 'receipt' ? 'text-emerald-600' : ''} />
            <span>Format Resi Thermal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeMainTab === 'logs'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock size={15} className={activeMainTab === 'logs' ? 'text-emerald-600' : ''} />
            <span>Log Notifikasi</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: FORM EDIT TEMPLATE EMAIL ================= */}
      {activeMainTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Template Event List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 px-1 flex items-center justify-between">
              <span>Event Notifikasi ({emailTemplates.length})</span>
              <span className="text-[10px] text-gray-400 lowercase">otomatis terkirim</span>
            </h3>

            <div className="space-y-2">
              {emailTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        tpl.category === 'Shipping' ? 'bg-purple-100 text-purple-700' :
                        tpl.category === 'Billing' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {tpl.category}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        tpl.isActive ? 'text-emerald-700' : 'text-gray-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${tpl.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {tpl.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-900 leading-snug">
                      {tpl.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">
                      trigger: {tpl.event}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Variable Placeholders Helper Box */}
            <div className="bg-neutral-900 text-white p-4 rounded-2xl space-y-3 mt-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Sparkles size={15} />
                  <span>Variabel Data Dinamis</span>
                </div>
                <span className="text-[10px] text-neutral-400">Klik untuk salin</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Sistem akan secara otomatis mengganti kode variabel berikut dengan data aktual transaksi:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availablePlaceholders.map((ph) => (
                  <button
                    key={ph.key}
                    type="button"
                    onClick={() => handleInsertPlaceholder(ph.key)}
                    className="px-2 py-1 bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 rounded-lg text-[10.5px] font-mono border border-neutral-700 transition-all cursor-pointer shadow-2xs"
                    title={`Contoh isi: ${ph.example}`}
                  >
                    {ph.key}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Editor & Live Client Preview */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* Action Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={currentEmailTemplate.isActive}
                    onChange={(e) => handleUpdateEmailField('isActive', e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-800">
                    Aktifkan Notifikasi Otomatis
                  </span>
                </label>

                {/* Theme Color Picker */}
                <div className="flex items-center gap-1 pl-3 border-l border-gray-200">
                  <Palette size={14} className="text-gray-400" />
                  <span className="text-[11px] font-semibold text-gray-500 mr-1">Warna Aksen:</span>
                  {[
                    { id: 'emerald', bg: 'bg-emerald-600', name: 'Hijau' },
                    { id: 'blue', bg: 'bg-blue-600', name: 'Biru' },
                    { id: 'purple', bg: 'bg-purple-600', name: 'Ungu' },
                    { id: 'rose', bg: 'bg-rose-600', name: 'Merah' }
                  ].map((clr) => (
                    <button
                      key={clr.id}
                      type="button"
                      onClick={() => handleUpdateEmailField('colorTheme', clr.id)}
                      className={`w-5 h-5 rounded-full ${clr.bg} transition-all cursor-pointer ${
                        currentEmailTemplate.colorTheme === clr.id ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : 'opacity-60 hover:opacity-100'
                      }`}
                      title={`Tema ${clr.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestEmailModalOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send size={13} />
                  <span>Kirim Email Tes</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetEmailTemplate}
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  title="Kembalikan ke Default Pabrik"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmailTemplate}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save size={14} />
                  <span>Simpan Template</span>
                </button>
              </div>
            </div>

            {/* Form Fields Card */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <span>Formulir Edit Template: {currentEmailTemplate.name}</span>
                </h3>
                <span className="text-[11px] font-mono text-gray-400">
                  {currentEmailTemplate.event}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                
                {/* Sender Name & Reply-To */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Nama Pengirim (From Name)
                    </label>
                    <input
                      type="text"
                      value={currentEmailTemplate.fromName || 'Tusko Official Store'}
                      onChange={(e) => handleUpdateEmailField('fromName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Email Balasan (Reply-To)
                    </label>
                    <input
                      type="email"
                      value={currentEmailTemplate.replyTo || 'support@tusko.com'}
                      onChange={(e) => handleUpdateEmailField('replyTo', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-medium text-gray-900 focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* Subject Line with Character Counter */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700">
                      Subjek Email (Subject Line)
                    </label>
                    <span className={`text-[10.5px] font-medium ${
                      (currentEmailTemplate.subject || '').length > 65 ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      {(currentEmailTemplate.subject || '').length} / 70 karakter (optimal)
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentEmailTemplate.subject}
                    onChange={(e) => handleUpdateEmailField('subject', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                    placeholder="Contoh: Pesanan {order_number} Sedang Dikirim"
                  />
                </div>

                {/* Preheader & Headline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Preheader Text (Ringkasan di Inbox)
                    </label>
                    <input
                      type="text"
                      value={currentEmailTemplate.preheader}
                      onChange={(e) => handleUpdateEmailField('preheader', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                      placeholder="Snippet teks pratinjau inbox..."
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Judul Banner Email (Headline)
                    </label>
                    <input
                      type="text"
                      value={currentEmailTemplate.headline}
                      onChange={(e) => handleUpdateEmailField('headline', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                      placeholder="Judul besar dalam email..."
                    />
                  </div>
                </div>

                {/* Body Message with Quick Formatter Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-gray-700">
                      Isi Pesan Email (Body Content)
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('**', '**')}
                        className="p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded text-[11px] font-bold"
                        title="Tebal"
                      >
                        <Bold size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('*', '*')}
                        className="p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded text-[11px]"
                        title="Miring"
                      >
                        <Italic size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertFormat('• ')}
                        className="p-1 text-gray-600 hover:text-black hover:bg-gray-100 rounded text-[11px]"
                        title="Poin Daftar"
                      >
                        <List size={12} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={currentEmailTemplate.body}
                    onChange={(e) => handleUpdateEmailField('body', e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-sans text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs leading-relaxed"
                  />
                </div>

                {/* Call-to-action Button settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Teks Tombol Aksi (CTA)
                    </label>
                    <input
                      type="text"
                      value={currentEmailTemplate.buttonText}
                      onChange={(e) => handleUpdateEmailField('buttonText', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs"
                      placeholder="Contoh: Lacak Pengiriman"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Tautan Tombol Aksi (CTA URL)
                    </label>
                    <input
                      type="text"
                      value={currentEmailTemplate.buttonLink}
                      onChange={(e) => handleUpdateEmailField('buttonLink', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-xs font-mono"
                      placeholder="https://..."
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Live Client Email Preview */}
            <div className="bg-gray-100 p-5 rounded-2xl border border-gray-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-gray-600" />
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Pratinjau Nyata di Email Pembeli
                  </h3>
                </div>
                <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    title="Pratinjau Desktop"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-400 hover:text-gray-700'
                    }`}
                    title="Pratinjau Smartphone"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
              </div>

              {/* Email Client Shell */}
              <div className={`mx-auto bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden transition-all ${
                previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
              }`}>
                {/* Email Client Header bar */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Dari: <strong>{currentEmailTemplate.fromName}</strong> &lt;{currentEmailTemplate.replyTo}&gt;</span>
                    <span>Baru saja</span>
                  </div>
                  <p className="font-extrabold text-gray-900 truncate">
                    {renderPreviewText(currentEmailTemplate.subject)}
                  </p>
                </div>

                {/* Email HTML Body Render */}
                <div className="p-5 sm:p-6 space-y-5 text-gray-800">
                  {/* Brand Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-neutral-900 text-amber-400 rounded-lg flex items-center justify-center font-black text-xs">
                        T
                      </div>
                      <span className="font-black text-sm tracking-tight text-neutral-900">
                        {currentEmailTemplate.fromName}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      Notifikasi Resmi
                    </span>
                  </div>

                  {/* Headline */}
                  <div className="space-y-1">
                    <h2 className="text-base sm:text-lg font-black text-gray-900">
                      {renderPreviewText(currentEmailTemplate.headline)}
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {renderPreviewText(currentEmailTemplate.preheader)}
                    </p>
                  </div>

                  {/* Body Paragraphs */}
                  <div className="text-xs leading-relaxed text-gray-700 whitespace-pre-line bg-gray-50/60 p-4 rounded-xl border border-gray-100 font-sans">
                    {renderPreviewText(currentEmailTemplate.body)}
                  </div>

                  {/* Action CTA Button */}
                  <div className="text-center pt-2">
                    <a
                      href={currentEmailTemplate.buttonLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-block px-5 py-2.5 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors ${currentTheme.primary}`}
                    >
                      {currentEmailTemplate.buttonText}
                    </a>
                  </div>

                  {/* Email Footer */}
                  <div className="pt-4 border-t border-gray-100 text-[10.5px] text-gray-400 text-center space-y-1">
                    <p>&copy; 2026 {currentEmailTemplate.fromName}. Seluruh hak cipta dilindungi undang-undang.</p>
                    <p>Butuh bantuan? Hubungi {currentEmailTemplate.replyTo}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================= TAB 2: FORM EDIT TEMPLATE RESI THERMAL ================= */}
      {activeMainTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Edit Resi Thermal Settings */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 font-black text-sm text-gray-900">
                  <Sliders size={16} className="text-emerald-600" />
                  <span>Kustomisasi Format Resi Thermal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetReceiptTemplate}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg transition-colors cursor-pointer"
                    title="Kembalikan ke Default"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveReceiptTemplate}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              {/* Ukuran Kertas */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Ukuran Kertas Stiker Printer Thermal
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: '100x150', label: '100x150 mm', sub: 'Standar A6' },
                    { id: '100x100', label: '100x100 mm', sub: 'Kotak Ringkas' },
                    { id: 'a4', label: 'Lembar A4', sub: '4 Stiker' }
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setReceiptConfig(prev => ({ ...prev, paperSize: sz.id }))}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        receiptConfig.paperSize === sz.id
                          ? 'border-emerald-600 bg-emerald-50/70 font-bold text-emerald-900 ring-1 ring-emerald-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <span className="block text-xs">{sz.label}</span>
                      <span className="text-[10px] text-gray-400 block">{sz.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipe Barcode & Ukuran Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Tipe Barcode Resi
                  </label>
                  <select
                    value={receiptConfig.barcodeType}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, barcodeType: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-800"
                  >
                    <option value="code128">Code 128 (Standar Kurir)</option>
                    <option value="qrcode">QR Code 2D</option>
                    <option value="dual">Keduanya (Barcode + QR)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Tinggi Garis Barcode
                  </label>
                  <select
                    value={receiptConfig.barcodeHeight || 'medium'}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, barcodeHeight: e.target.value }))}
                    className="w-full px-2.5 py-2 bg-gray-50 border border-gray-300 rounded-xl font-semibold text-gray-800"
                  >
                    <option value="small">Rendah (40px)</option>
                    <option value="medium">Standar (55px)</option>
                    <option value="large">Tinggi (70px)</option>
                  </select>
                </div>
              </div>

              {/* Ukuran Font Alamat Penerima */}
              <div className="space-y-1.5">
                <label className="font-bold text-gray-700 block">
                  Ukuran Teks Alamat Penerima
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptConfig(prev => ({ ...prev, addressFontSize: 'normal' }))}
                    className={`py-1.5 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      receiptConfig.addressFontSize === 'normal'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Normal (11px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptConfig(prev => ({ ...prev, addressFontSize: 'large' }))}
                    className={`py-1.5 px-3 rounded-xl border text-center font-bold text-xs cursor-pointer ${
                      receiptConfig.addressFontSize === 'large'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    Besar & Tebal (12.5px)
                  </button>
                </div>
              </div>

              {/* Toggle Fitur Label */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-700 block">Elemen Cetak yang Diaktifkan</span>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptConfig.showItemsList}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, showItemsList: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tampilkan Daftar Barang & Checklist QC Gudang</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptConfig.showSortingCode}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, showSortingCode: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tampilkan Kotak Kode Sortir Hub Ekspedisi (Contoh: CGK)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptConfig.showCodBadge}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, showCodBadge: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tampilkan Badge Status Pembayaran (NON-COD / LUNAS)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiptConfig.showUnboxingNotice}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, showUnboxingNotice: e.target.checked }))}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Tampilkan Peringatan Wajib Video Unboxing di Footer</span>
                </label>
              </div>

              {/* Sender & Fulfillment Warehouse Details */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-700 block">Identitas Pengirim & Gudang Logistik</span>

                <div>
                  <label className="block text-gray-500 text-[11px] mb-0.5">Nama Toko / Hub Logistik</label>
                  <input
                    type="text"
                    value={receiptConfig.senderName}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, senderName: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[11px] mb-0.5">Nomor Telepon Hotline Pengirim</label>
                  <input
                    type="text"
                    value={receiptConfig.senderPhone}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, senderPhone: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[11px] mb-0.5">Alamat Gudang Pengirim</label>
                  <textarea
                    rows={2}
                    value={receiptConfig.senderAddress}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, senderAddress: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-gray-500 text-[11px] mb-0.5">Teks Catatan Kaki Resi</label>
                  <input
                    type="text"
                    value={receiptConfig.footerNote}
                    onChange={(e) => setReceiptConfig(prev => ({ ...prev, footerNote: e.target.value }))}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-xl text-xs italic"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Real-time Thermal Label Preview */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-gray-100 p-5 rounded-2xl border border-gray-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer size={16} className="text-gray-700" />
                  <h3 className="font-black text-sm text-gray-900">
                    Pratinjau Cetak Thermal ({receiptConfig.paperSize} mm)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleTestPrintReceipt}
                  className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer size={13} />
                  <span>Uji Cetak Thermal</span>
                </button>
              </div>

              {/* Thermal Label Card Container */}
              <div className="bg-white p-5 rounded-2xl shadow-xl border-2 border-black max-w-md mx-auto space-y-3 font-sans text-black">
                
                {/* Header Kurir Baris 1 */}
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-black text-white font-black text-lg tracking-wider rounded uppercase">
                      J&amp;T Express
                    </span>
                    <div>
                      <span className="px-2 py-0.5 border border-black text-black font-black text-[10px] rounded uppercase">
                        EZ (Reguler)
                      </span>
                      <span className="text-[9px] text-gray-700 block mt-0.5 font-medium">
                        {receiptConfig.courierBrandTag}
                      </span>
                    </div>
                  </div>

                  {receiptConfig.showSortingCode && (
                    <div className="text-right">
                      <div className="px-2.5 py-1 bg-black text-white font-mono font-black text-sm tracking-widest rounded text-center">
                        CGK
                      </div>
                      <span className="text-[8.5px] font-bold text-gray-600 block mt-0.5">KODE SORTIR</span>
                    </div>
                  )}
                </div>

                {/* Barcode & Tracking Number Area */}
                <div className="py-2.5 border-b-2 border-black flex flex-col items-center justify-center text-center space-y-1 bg-neutral-50/70 rounded-lg">
                  {receiptConfig.barcodeType !== 'qrcode' && (
                    <div className={`w-full max-w-[280px] ${getBarcodeHeightClass(receiptConfig.barcodeHeight)} flex items-stretch justify-center gap-[2px] px-2`}>
                      {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3].map((w, i) => (
                        <div key={i} className="bg-black h-full" style={{ width: `${w * 1.8}px` }} />
                      ))}
                    </div>
                  )}

                  {receiptConfig.barcodeType === 'qrcode' && (
                    <div className="w-16 h-16 border-2 border-black p-1 flex items-center justify-center bg-white">
                      <QrCode size={48} className="text-black" />
                    </div>
                  )}

                  {receiptConfig.barcodeType === 'dual' && (
                    <div className="pt-1">
                      <QrCode size={28} className="text-black inline-block" />
                    </div>
                  )}

                  <span className="font-mono font-black text-sm tracking-widest text-black">
                    TRK-98827391823
                  </span>
                  <span className="text-[9px] font-bold tracking-wider text-gray-600 uppercase">
                    NO. RESI KURIR PENGIRIMAN
                  </span>
                </div>

                {/* Sender & Recipient Address Columns */}
                <div className="grid grid-cols-2 gap-3 border-b-2 border-black pb-3 text-xs">
                  <div className="pr-2 border-r border-black/30 space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 block">
                      KEPADA (PENERIMA):
                    </span>
                    <p className={`font-black text-black ${receiptConfig.addressFontSize === 'large' ? 'text-sm font-extrabold' : 'text-xs'}`}>
                      Budi Santoso
                    </p>
                    <p className="font-mono font-bold text-[11px] text-black">0812-3456-7890</p>
                    <p className={`text-gray-800 leading-tight ${receiptConfig.addressFontSize === 'large' ? 'text-[11.5px]' : 'text-[10px]'}`}>
                      Jl. Sudirman No. 45, RT 01/RW 02, Kebayoran Baru, Jakarta Selatan
                    </p>
                    <div className="inline-block mt-1 px-1.5 py-0.2 border border-black font-mono font-bold text-[10px] rounded bg-gray-50">
                      KODEPOS: 12190
                    </div>
                  </div>

                  <div className="pl-1 space-y-0.5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 block">
                      DARI (PENGIRIM):
                    </span>
                    <p className="font-black text-xs text-black">{receiptConfig.senderName}</p>
                    <p className="font-mono text-[10.5px] text-gray-800">{receiptConfig.senderPhone}</p>
                    <p className="text-[10px] text-gray-800 leading-tight">
                      {receiptConfig.senderAddress}
                    </p>
                  </div>
                </div>

                {/* Items & Checklist */}
                {receiptConfig.showItemsList && (
                  <div className="space-y-1.5 border-b-2 border-black pb-3 text-[10.5px]">
                    <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1.5 rounded border border-black/20 text-center font-bold text-[10px]">
                      <div>
                        <span className="text-[8px] text-gray-600 block">INVOICE</span>
                        <span className="font-mono text-[9.5px]">INV/2026/001</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-600 block">BERAT</span>
                        <span>1.0 Kg</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-gray-600 block">STATUS</span>
                        <span className="text-emerald-700">LUNAS</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[9px] font-black text-gray-700 uppercase block">
                        ISI PAKET (2 ITEM):
                      </span>
                      <div className="divide-y divide-gray-200 border-t border-b border-gray-200 py-0.5">
                        <div className="py-0.5 flex justify-between items-center text-[10px]">
                          <span className="truncate">1x Tusko Pro Matchday Football Jersey (L)</span>
                          <span className="font-mono font-bold shrink-0">[ &check; ]</span>
                        </div>
                        <div className="py-0.5 flex justify-between items-center text-[10px]">
                          <span className="truncate">1x Tusko Kaos Kaki Anti-Slip Sport</span>
                          <span className="font-mono font-bold shrink-0">[ &check; ]</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Note */}
                {receiptConfig.showUnboxingNotice && (
                  <div className="pt-0.5 flex items-center justify-between text-[9px] text-gray-700">
                    <span className="italic">{receiptConfig.footerNote}</span>
                    <span className="font-bold text-black uppercase">Tusko v1.0</span>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB 3: LOG RIWAYAT NOTIFIKASI ================= */}
      {activeMainTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm text-gray-900">
                Riwayat Pengiriman Notifikasi Pelanggan
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pencatatan riwayat email notifikasi otomatis yang dikirimkan ke pembeli.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
              {mockNotificationLogs.length} Terkirim
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">ID Log</th>
                  <th className="px-4 py-3">Waktu Kirim</th>
                  <th className="px-4 py-3">No. Invoice</th>
                  <th className="px-4 py-3">Penerima (Email)</th>
                  <th className="px-4 py-3">Subjek Notifikasi</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockNotificationLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-gray-500 font-bold text-[11px]">
                      {log.id}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                      {log.sentAt}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-gray-900">
                      {log.orderNumber}
                    </td>
                    <td className="px-4 py-3.5 text-gray-800 font-medium">
                      {log.recipient}
                    </td>
                    <td className="px-4 py-3.5 text-gray-700 max-w-xs truncate">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                        <CheckCircle2 size={11} />
                        <span>Terkirim</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Email Modal Popup */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Kirim Email Uji Coba
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Uji rendering template pada klien email nyata
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Email Tujuan Uji Coba:
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="nama@email.com"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-800 text-[11px] space-y-1">
                <p className="font-bold">Template yang Dikirim:</p>
                <p className="italic">{currentEmailTemplate.name}</p>
                <p className="text-[10.5px] text-blue-600">
                  Subjek: {renderPreviewText(currentEmailTemplate.subject)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTestEmailModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send size={13} />
                <span>{isSendingTest ? 'Mengirim...' : 'Kirim Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
