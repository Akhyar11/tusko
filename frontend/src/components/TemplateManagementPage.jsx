import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Printer,
  FileText,
  Send,
  Eye,
  Save,
  RotateCcw,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  Sliders,
  Bold,
  Italic,
  List as ListIcon,
} from 'lucide-react';
import IconButton from './atoms/IconButton';
import TextInput from './molecules/TextInput';
import TextArea from './molecules/TextArea';
import Checkbox from './molecules/Checkbox';
import ServerSideSelect from './molecules/ServerSideSelect';
import { availablePlaceholders } from '../data/referenceData';
import { templateService } from '../services/templateService';

const mapEmailTemplate = (t) => ({
  id: t.id,
  key: t.key,
  name: t.name,
  event: t.event,
  category: t.category,
  fromName: t.from_name,
  replyTo: t.reply_to,
  colorTheme: t.color_theme,
  subject: t.subject,
  preheader: t.preheader,
  headline: t.headline,
  body: t.body,
  buttonText: t.button_text,
  buttonLink: t.button_link,
  isActive: Boolean(t.is_active),
});

const mapReceiptTemplate = (t) => ({
  paperSize: t.paper_size,
  barcodeType: t.barcode_type,
  barcodeHeight: t.barcode_height,
  addressFontSize: t.address_font_size,
  showItemsList: Boolean(t.show_items_list),
  showBuyerNotes: Boolean(t.show_buyer_notes),
  showSortingCode: Boolean(t.show_sorting_code),
  showUnboxingNotice: Boolean(t.show_unboxing_notice),
  showCodBadge: Boolean(t.show_cod_badge),
  senderName: t.sender_name,
  senderPhone: t.sender_phone,
  senderAddress: t.sender_address,
  footerNote: t.footer_note,
  courierBrandTag: t.courier_brand_tag,
});

const SECTIONS = [
  { id: 'email', label: 'Template Email', icon: Mail, desc: 'Formulir notifikasi email pembeli' },
  { id: 'receipt', label: 'Format Resi Thermal', icon: Printer, desc: 'Tata letak stiker label resi kurir' },
  { id: 'logs', label: 'Log Notifikasi', icon: Clock, desc: 'Riwayat pengiriman notifikasi' },
];

const BARCODE_TYPE_OPTIONS = [
  { value: 'code128', label: 'Code 128 (Standar Kurir)' },
  { value: 'qrcode', label: 'QR Code 2D' },
  { value: 'dual', label: 'Keduanya (Barcode + QR)' },
];

const BARCODE_HEIGHT_OPTIONS = [
  { value: 'small', label: 'Rendah (40px)' },
  { value: 'medium', label: 'Standar (55px)' },
  { value: 'large', label: 'Tinggi (70px)' },
];

const PAPER_OPTIONS = [
  { id: '100x150', label: '100x150 mm', sub: 'Standar A6' },
  { id: '100x100', label: '100x100 mm', sub: 'Kotak Ringkas' },
  { id: 'a4', label: 'Lembar A4', sub: '4 Stiker' },
];

export default function TemplateManagementPage({
  onBack = () => {},
  onShowToast = () => {},
}) {
  const [activeSection, setActiveSection] = useState('email');

  // Email template state
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Receipt template state
  const [receiptConfig, setReceiptConfig] = useState({});
  const [notificationLogs, setNotificationLogs] = useState([]);

  // T45.3: muat template email/resi & log notifikasi dari API.
  useEffect(() => {
    let active = true;

    templateService.getEmailTemplates()
      .then((list) => {
        if (!active) return;
        const mapped = (list || []).map(mapEmailTemplate);
        setEmailTemplates(mapped);
        setSelectedTemplateId((prev) => (prev && mapped.some((m) => m.id === prev) ? prev : (mapped[0]?.id ?? '')));
      })
      .catch(() => {});

    templateService.getReceiptTemplate()
      .then((t) => { if (active && t) setReceiptConfig(mapReceiptTemplate(t)); })
      .catch(() => {});

    templateService.getEmailLogs()
      .then((res) => {
        if (!active) return;
        const rows = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        setNotificationLogs(rows.map((l) => ({
          id: l.id,
          sentAt: l.sent_at ? new Date(l.sent_at).toLocaleString('id-ID') : '-',
          orderNumber: l.order_id ? `#${l.order_id}` : '-',
          recipient: l.recipient_email,
          subject: l.subject,
          status: l.status,
        })));
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  const currentEmailTemplate =
    emailTemplates.find((t) => t.id === selectedTemplateId) || emailTemplates[0] || {
      id: selectedTemplateId,
      name: 'Template',
      fromName: '',
      subject: '',
      preheader: '',
      headline: '',
      body: '',
      buttonText: '',
      buttonLink: '',
    };

  const paperSizeCss =
    receiptConfig.paperSize === 'a4'
      ? 'A4'
      : receiptConfig.paperSize === '100x100'
        ? '100mm 100mm'
        : '100mm 150mm';

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

  const handleUpdateEmailField = (field, value) => {
    setEmailTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? { ...t, [field]: value } : t))
    );
  };

  const handleInsertPlaceholder = (placeholderKey) => {
    handleUpdateEmailField('body', `${currentEmailTemplate.body || ''} ${placeholderKey}`);
    onShowToast(`Variabel ${placeholderKey} disisipkan ke pesan.`);
  };

  const handleInsertFormat = (prefix, suffix = '') => {
    handleUpdateEmailField('body', `${currentEmailTemplate.body || ''}\n${prefix}Teks${suffix}`);
  };

  const handleSaveEmailTemplate = async () => {
    try {
      await templateService.updateEmailTemplate(currentEmailTemplate.id ?? currentEmailTemplate.key, {
        name: currentEmailTemplate.name,
        event: currentEmailTemplate.event,
        category: currentEmailTemplate.category,
        from_name: currentEmailTemplate.fromName,
        reply_to: currentEmailTemplate.replyTo,
        color_theme: currentEmailTemplate.colorTheme,
        subject: currentEmailTemplate.subject,
        preheader: currentEmailTemplate.preheader,
        headline: currentEmailTemplate.headline,
        body: currentEmailTemplate.body,
        button_text: currentEmailTemplate.buttonText,
        button_link: currentEmailTemplate.buttonLink,
        is_active: Boolean(currentEmailTemplate.isActive),
      });
      onShowToast(`Perubahan template "${currentEmailTemplate.name}" berhasil disimpan.`);
    } catch (err) {
      onShowToast(err?.message || 'Gagal menyimpan template.', { type: 'error' });
    }
  };

  const handleResetEmailTemplate = async () => {
    try {
      await templateService.resetEmailTemplates();
      const list = await templateService.getEmailTemplates();
      const mapped = (list || []).map(mapEmailTemplate);
      setEmailTemplates(mapped);
      onShowToast('Template dikembalikan ke pengaturan awal server.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal mengembalikan template.', { type: 'error' });
    }
  };

  const handleSaveReceiptTemplate = async () => {
    try {
      await templateService.saveReceiptTemplate({
        paper_size: receiptConfig.paperSize,
        barcode_type: receiptConfig.barcodeType,
        barcode_height: receiptConfig.barcodeHeight,
        address_font_size: receiptConfig.addressFontSize,
        show_items_list: Boolean(receiptConfig.showItemsList),
        show_buyer_notes: Boolean(receiptConfig.showBuyerNotes),
        show_sorting_code: Boolean(receiptConfig.showSortingCode),
        show_unboxing_notice: Boolean(receiptConfig.showUnboxingNotice),
        show_cod_badge: Boolean(receiptConfig.showCodBadge),
        sender_name: receiptConfig.senderName,
        sender_phone: receiptConfig.senderPhone,
        sender_address: receiptConfig.senderAddress,
        footer_note: receiptConfig.footerNote,
        courier_brand_tag: receiptConfig.courierBrandTag,
      });
      onShowToast('Format label resi thermal berhasil disimpan & diterapkan.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal menyimpan format resi.', { type: 'error' });
    }
  };

  const handleResetReceiptTemplate = async () => {
    try {
      await templateService.resetReceiptTemplate();
      const t = await templateService.getReceiptTemplate();
      if (t) setReceiptConfig(mapReceiptTemplate(t));
      onShowToast('Format label resi dikembalikan ke pengaturan default.');
    } catch (err) {
      onShowToast(err?.message || 'Gagal mengembalikan format resi.', { type: 'error' });
    }
  };

  const handleSendTestEmail = () => {
    if (!testEmailAddress) {
      onShowToast('Masukkan alamat email tujuan uji coba.', { type: 'error' });
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      setIsTestEmailModalOpen(false);
      onShowToast(`Email uji coba "${currentEmailTemplate.name}" dikirim ke ${testEmailAddress}.`);
    }, 700);
  };

  const getBarcodeHeightClass = (h) => {
    if (h === 'small') return 'h-10';
    if (h === 'large') return 'h-16';
    return 'h-12';
  };

  const handleTestPrintReceipt = () => {
    const originalTitle = document.title;
    document.title = `Resi_Thermal_${receiptConfig.paperSize}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  const labelClass = 'block text-xs font-sport font-black uppercase tracking-wider text-neutral-900 mb-1.5';
  const sectionTitleClass = 'text-sm font-black font-sport text-neutral-950 uppercase tracking-wider flex items-center gap-2 border-b border-neutral-200 pb-3';
  const submitClass = 'w-full py-2.5 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 text-xs font-sport font-black uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer rounded-none';

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #thermal-print-area, #thermal-print-area * { visibility: visible !important; }
          #thermal-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            border: 2px solid #000 !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          @page { size: ${paperSizeCss}; margin: 4mm; }
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header modul kanonis (aturan 22/26) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-none border border-neutral-300 shadow-2xs">
        <div className="min-w-0">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Mail size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-950 font-sport tracking-tight uppercase leading-tight">
                Kelola Template Email & Resi
              </h1>
              <p className="text-xs text-neutral-600 mt-0.5">
                Kustomisasi notifikasi email pembeli dan tata letak stiker label resi thermal kurir.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={ArrowLeft} onClick={onBack} title="Kembali ke Dashboard" variant="outline" />
        </div>
      </div>

      {/* Navigasi SECTION (aturan 14: bukan tab multi-modul) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <aside className="xl:col-span-1 space-y-2">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-none border text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white border-neutral-950'
                    : 'bg-white text-neutral-800 border-neutral-300 hover:border-neutral-400'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-amber-400 shrink-0' : 'text-neutral-500 shrink-0'} />
                <div className="min-w-0">
                  <span className="block text-xs font-sport font-black uppercase tracking-wider">
                    {section.label}
                  </span>
                  <span className={`block text-[11px] truncate ${isActive ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {section.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <div className="xl:col-span-3 space-y-6">
          {/* ================= SECTION: TEMPLATE EMAIL ================= */}
          {activeSection === 'email' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-4 space-y-3">
                <h3 className="text-xs font-sport font-black uppercase tracking-wider text-neutral-500 px-1">
                  Event Notifikasi ({emailTemplates.length})
                </h3>
                <div className="space-y-2">
                  {emailTemplates.map((tpl) => {
                    const isSelected = tpl.id === selectedTemplateId;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(tpl.id)}
                        className={`w-full text-left p-3.5 rounded-none border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500'
                            : 'bg-white border-neutral-300 hover:border-neutral-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-none bg-neutral-100 text-neutral-700 uppercase">
                            {tpl.category}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${tpl.isActive ? 'text-emerald-700' : 'text-neutral-400'}`}>
                            <span className={`w-2 h-2 rounded-none ${tpl.isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
                            {tpl.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                        <h4 className="font-black text-sm text-neutral-900 leading-snug">{tpl.name}</h4>
                        <p className="text-[11px] text-neutral-500 truncate mt-0.5 font-mono">trigger: {tpl.event}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-neutral-950 text-white p-4 rounded-none space-y-3 mt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Sparkles size={15} />
                    <span>Variabel Data Dinamis</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Klik untuk menyisipkan kode variabel ke isi pesan:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePlaceholders.map((ph) => (
                      <button
                        key={ph.key}
                        type="button"
                        onClick={() => handleInsertPlaceholder(ph.key)}
                        className="px-2 py-1 bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 rounded-none text-[10.5px] font-mono border border-neutral-700 transition-all cursor-pointer"
                        title={`Contoh isi: ${ph.example}`}
                      >
                        {ph.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-8 space-y-5">
                <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
                  <h2 className={sectionTitleClass}>
                    <FileText size={16} className="text-amber-500" />
                    <span>Formulir Template: {currentEmailTemplate.name}</span>
                  </h2>

                  <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                    <Checkbox
                      checked={Boolean(currentEmailTemplate.isActive)}
                      onChange={(checked) => handleUpdateEmailField('isActive', checked)}
                      ariaLabel="Aktifkan notifikasi otomatis"
                    />
                    <span className="text-xs font-bold text-neutral-800">Aktifkan Notifikasi Otomatis</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Nama Pengirim (From Name)</label>
                      <TextInput
                        value={currentEmailTemplate.fromName || ''}
                        onChange={(v) => handleUpdateEmailField('fromName', v)}
                        placeholder="Tusko Official Store"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email Balasan (Reply-To)</label>
                      <TextInput
                        type="email"
                        value={currentEmailTemplate.replyTo || ''}
                        onChange={(v) => handleUpdateEmailField('replyTo', v)}
                        placeholder="support@tusko.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass}>Subjek Email</label>
                      <span className={`text-[10.5px] font-bold ${(currentEmailTemplate.subject || '').length > 65 ? 'text-rose-600' : 'text-neutral-400'}`}>
                        {(currentEmailTemplate.subject || '').length} / 70
                      </span>
                    </div>
                    <TextInput
                      value={currentEmailTemplate.subject || ''}
                      onChange={(v) => handleUpdateEmailField('subject', v)}
                      placeholder="Contoh: Pesanan {order_number} Sedang Dikirim"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Preheader (Ringkasan Inbox)</label>
                      <TextInput
                        value={currentEmailTemplate.preheader || ''}
                        onChange={(v) => handleUpdateEmailField('preheader', v)}
                        placeholder="Snippet pratinjau inbox..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Judul Banner (Headline)</label>
                      <TextInput
                        value={currentEmailTemplate.headline || ''}
                        onChange={(v) => handleUpdateEmailField('headline', v)}
                        placeholder="Judul besar dalam email..."
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass}>Isi Pesan (Body)</label>
                      <div className="flex items-center gap-1">
                        <IconButton icon={Bold} onClick={() => handleInsertFormat('**', '**')} title="Tebal" variant="outline" className="w-7 h-7" />
                        <IconButton icon={Italic} onClick={() => handleInsertFormat('*', '*')} title="Miring" variant="outline" className="w-7 h-7" />
                        <IconButton icon={ListIcon} onClick={() => handleInsertFormat('• ')} title="Poin Daftar" variant="outline" className="w-7 h-7" />
                      </div>
                    </div>
                    <TextArea
                      rows={6}
                      value={currentEmailTemplate.body || ''}
                      onChange={(v) => handleUpdateEmailField('body', v)}
                      placeholder="Tulis isi pesan email..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Teks Tombol CTA</label>
                      <TextInput
                        value={currentEmailTemplate.buttonText || ''}
                        onChange={(v) => handleUpdateEmailField('buttonText', v)}
                        placeholder="Contoh: Lacak Pengiriman"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tautan Tombol (CTA URL)</label>
                      <TextInput
                        type="url"
                        weight="mono"
                        value={currentEmailTemplate.buttonLink || ''}
                        onChange={(v) => handleUpdateEmailField('buttonLink', v)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Warna Aksen Email</label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'emerald', bg: 'bg-emerald-600', name: 'Hijau' },
                        { id: 'amber', bg: 'bg-amber-500', name: 'Kuning' },
                        { id: 'rose', bg: 'bg-rose-600', name: 'Merah' },
                        { id: 'neutral', bg: 'bg-neutral-900', name: 'Hitam' },
                      ].map((clr) => (
                        <button
                          key={clr.id}
                          type="button"
                          onClick={() => handleUpdateEmailField('colorTheme', clr.id)}
                          className={`w-7 h-7 rounded-none ${clr.bg} transition-all cursor-pointer border ${
                            currentEmailTemplate.colorTheme === clr.id
                              ? 'border-amber-500 ring-2 ring-amber-300'
                              : 'border-neutral-300 opacity-70 hover:opacity-100'
                          }`}
                          title={`Tema ${clr.name}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={handleResetEmailTemplate} className="w-full sm:w-auto py-2 px-4 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2">
                      <RotateCcw size={14} />
                      <span>Reset Default</span>
                    </button>
                    <button type="button" onClick={handleSaveEmailTemplate} className={submitClass}>
                      <Save size={15} />
                      <span>Simpan Template</span>
                    </button>
                    <button type="button" onClick={() => setIsTestEmailModalOpen(true)} className="w-full sm:w-auto py-2 px-4 bg-neutral-950 hover:bg-neutral-800 border border-neutral-950 text-white text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2">
                      <Send size={14} />
                      <span>Kirim Tes</span>
                    </button>
                  </div>
                </div>

                {/* Pratinjau email */}
                <div className="bg-neutral-100 p-5 rounded-none border border-neutral-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-800">
                      <Eye size={16} />
                      <h3 className="font-sport font-black text-sm uppercase tracking-wider">Pratinjau Email Pembeli</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton icon={Monitor} onClick={() => setPreviewDevice('desktop')} title="Pratinjau Desktop" variant={previewDevice === 'desktop' ? 'primary' : 'outline'} className="w-8 h-8" />
                      <IconButton icon={Smartphone} onClick={() => setPreviewDevice('mobile')} title="Pratinjau Smartphone" variant={previewDevice === 'mobile' ? 'primary' : 'outline'} className="w-8 h-8" />
                    </div>
                  </div>

                  <div className={`mx-auto bg-white rounded-none border border-neutral-300 overflow-hidden transition-all ${previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'}`}>
                    <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                        <span>Dari: <strong>{currentEmailTemplate.fromName}</strong> {`<${currentEmailTemplate.replyTo}>`}</span>
                        <span>Baru saja</span>
                      </div>
                      <p className="font-black text-neutral-900 truncate">{renderPreviewText(currentEmailTemplate.subject)}</p>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5 text-neutral-800">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-neutral-900 text-amber-400 rounded-none flex items-center justify-center font-black text-xs">T</div>
                          <span className="font-black text-sm tracking-tight text-neutral-900">{currentEmailTemplate.fromName}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 font-mono">Notifikasi Resmi</span>
                      </div>

                      <div className="space-y-1">
                        <h2 className="text-base sm:text-lg font-black text-neutral-900">{renderPreviewText(currentEmailTemplate.headline)}</h2>
                        <p className="text-[11px] text-neutral-500">{renderPreviewText(currentEmailTemplate.preheader)}</p>
                      </div>

                      <div className="text-xs leading-relaxed text-neutral-700 whitespace-pre-line bg-neutral-50 p-4 rounded-none border border-neutral-100">
                        {renderPreviewText(currentEmailTemplate.body)}
                      </div>

                      <div className="text-center pt-2">
                        <span className="inline-block px-5 py-2.5 bg-neutral-900 text-white font-black text-xs rounded-none">
                          {currentEmailTemplate.buttonText}
                        </span>
                      </div>

                      <div className="pt-4 border-t border-neutral-100 text-[10.5px] text-neutral-400 text-center space-y-1">
                        <p>© 2026 {currentEmailTemplate.fromName}. Seluruh hak cipta dilindungi.</p>
                        <p>Butuh bantuan? Hubungi {currentEmailTemplate.replyTo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: FORMAT RESI THERMAL ================= */}
          {activeSection === 'receipt' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-5 space-y-4">
                <div className="bg-white p-5 sm:p-6 border border-neutral-300 rounded-none shadow-2xs space-y-5">
                  <h2 className={sectionTitleClass}>
                    <Sliders size={16} className="text-amber-500" />
                    <span>Kustomisasi Resi Thermal</span>
                  </h2>

                  <div>
                    <label className={labelClass}>Ukuran Kertas Stiker Thermal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PAPER_OPTIONS.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => setReceiptConfig((prev) => ({ ...prev, paperSize: sz.id }))}
                          className={`p-2 rounded-none border text-center transition-all cursor-pointer ${
                            receiptConfig.paperSize === sz.id
                              ? 'border-amber-500 bg-amber-50 font-bold text-neutral-900'
                              : 'border-neutral-300 hover:border-neutral-400 text-neutral-600'
                          }`}
                        >
                          <span className="block text-xs">{sz.label}</span>
                          <span className="text-[10px] text-neutral-400 block">{sz.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Tipe Barcode Resi</label>
                      <ServerSideSelect
                        value={receiptConfig.barcodeType}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, barcodeType: v }))}
                        options={BARCODE_TYPE_OPTIONS}
                        placeholder="Pilih tipe barcode..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tinggi Garis Barcode</label>
                      <ServerSideSelect
                        value={receiptConfig.barcodeHeight || 'medium'}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, barcodeHeight: v }))}
                        options={BARCODE_HEIGHT_OPTIONS}
                        placeholder="Pilih tinggi barcode..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Ukuran Teks Alamat Penerima</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptConfig((prev) => ({ ...prev, addressFontSize: 'normal' }))}
                        className={`py-2 px-3 rounded-none border text-center font-bold text-xs cursor-pointer ${
                          receiptConfig.addressFontSize === 'normal'
                            ? 'border-amber-500 bg-amber-50 text-neutral-900'
                            : 'border-neutral-300 text-neutral-600'
                        }`}
                      >
                        Normal (11px)
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptConfig((prev) => ({ ...prev, addressFontSize: 'large' }))}
                        className={`py-2 px-3 rounded-none border text-center font-bold text-xs cursor-pointer ${
                          receiptConfig.addressFontSize === 'large'
                            ? 'border-amber-500 bg-amber-50 text-neutral-900'
                            : 'border-neutral-300 text-neutral-600'
                        }`}
                      >
                        Besar & Tebal (12.5px)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-200">
                    <span className={labelClass}>Elemen Cetak yang Diaktifkan</span>
                    {[
                      { key: 'showItemsList', text: 'Daftar Barang & Checklist QC Gudang' },
                      { key: 'showSortingCode', text: 'Kotak Kode Sortir Hub Ekspedisi (mis. CGK)' },
                      { key: 'showCodBadge', text: 'Badge Status Pembayaran (LUNAS / COD)' },
                      { key: 'showUnboxingNotice', text: 'Peringatan Wajib Video Unboxing di Footer' },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer p-3 bg-neutral-50 border border-neutral-200 rounded-none">
                        <Checkbox
                          checked={Boolean(receiptConfig[opt.key])}
                          onChange={(checked) => setReceiptConfig((prev) => ({ ...prev, [opt.key]: checked }))}
                          ariaLabel={opt.text}
                        />
                        <span className="text-xs text-neutral-700">{opt.text}</span>
                      </label>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-neutral-200">
                    <span className={labelClass}>Identitas Pengirim & Gudang</span>
                    <div>
                      <label className={labelClass}>Nama Toko / Hub Logistik</label>
                      <TextInput
                        value={receiptConfig.senderName || ''}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, senderName: v }))}
                        placeholder="Tusko Official Store"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Nomor Telepon Pengirim</label>
                      <TextInput
                        weight="mono"
                        value={receiptConfig.senderPhone || ''}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, senderPhone: v }))}
                        placeholder="0811-9876-5432"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Alamat Gudang Pengirim</label>
                      <TextArea
                        rows={2}
                        value={receiptConfig.senderAddress || ''}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, senderAddress: v }))}
                        placeholder="Alamat lengkap gudang..."
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Catatan Kaki Resi</label>
                      <TextInput
                        value={receiptConfig.footerNote || ''}
                        onChange={(v) => setReceiptConfig((prev) => ({ ...prev, footerNote: v }))}
                        placeholder="Wajib rekam video unboxing..."
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={handleResetReceiptTemplate} className="w-full sm:w-auto py-2 px-4 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-800 text-xs font-sport font-black uppercase tracking-wider transition-colors cursor-pointer rounded-none flex items-center justify-center gap-2">
                      <RotateCcw size={14} />
                      <span>Reset Default</span>
                    </button>
                    <button type="button" onClick={handleSaveReceiptTemplate} className={submitClass}>
                      <Save size={15} />
                      <span>Simpan Format</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="xl:col-span-7 space-y-4">
                <div className="bg-neutral-100 p-5 rounded-none border border-neutral-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-neutral-800">
                      <Printer size={16} />
                      <h3 className="font-sport font-black text-sm uppercase tracking-wider">
                        Pratinjau Cetak Thermal ({receiptConfig.paperSize} mm)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleTestPrintReceipt}
                      className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white font-sport font-black text-xs uppercase tracking-wider rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Uji Cetak</span>
                    </button>
                  </div>

                  {/* Label area tercetak (id dipakai oleh @media print) */}
                  <div
                    id="thermal-print-area"
                    className={`bg-white p-5 rounded-none shadow-xl border-2 border-black mx-auto space-y-3 text-black ${
                      receiptConfig.paperSize === '100x100' ? 'max-w-sm' : receiptConfig.paperSize === 'a4' ? 'max-w-md' : 'max-w-md'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b-2 border-black pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-black text-white font-black text-lg tracking-wider rounded-none uppercase">J&T Express</span>
                        <div>
                          <span className="px-2 py-0.5 border border-black text-black font-black text-[10px] rounded-none uppercase">EZ (Reguler)</span>
                          <span className="text-[9px] text-neutral-700 block mt-0.5 font-medium">{receiptConfig.courierBrandTag}</span>
                        </div>
                      </div>
                      {receiptConfig.showSortingCode && (
                        <div className="text-right">
                          <div className="px-2.5 py-1 bg-black text-white font-mono font-black text-sm tracking-widest rounded-none text-center">CGK</div>
                          <span className="text-[8.5px] font-bold text-neutral-600 block mt-0.5">KODE SORTIR</span>
                        </div>
                      )}
                    </div>

                    <div className="py-2.5 border-b-2 border-black flex flex-col items-center justify-center text-center space-y-1 bg-neutral-50 rounded-none">
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
                      <span className="font-mono font-black text-sm tracking-widest text-black">TRK-98827391823</span>
                      <span className="text-[9px] font-bold tracking-wider text-neutral-600 uppercase">No. Resi Kurir Pengiriman</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-b-2 border-black pb-3 text-xs">
                      <div className="pr-2 border-r border-black/30 space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-600 block">Kepada (Penerima):</span>
                        <p className={`font-black text-black ${receiptConfig.addressFontSize === 'large' ? 'text-sm' : 'text-xs'}`}>Budi Santoso</p>
                        <p className="font-mono font-bold text-[11px] text-black">0812-3456-7890</p>
                        <p className={`text-neutral-800 leading-tight ${receiptConfig.addressFontSize === 'large' ? 'text-[11.5px]' : 'text-[10px]'}`}>
                          Jl. Sudirman No. 45, RT 01/RW 02, Kebayoran Baru, Jakarta Selatan
                        </p>
                        <div className="inline-block mt-1 px-1.5 py-0.5 border border-black font-mono font-bold text-[10px] rounded-none bg-neutral-50">
                          KODEPOS: 12190
                        </div>
                      </div>
                      <div className="pl-1 space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-wider text-neutral-600 block">Dari (Pengirim):</span>
                        <p className="font-black text-xs text-black">{receiptConfig.senderName}</p>
                        <p className="font-mono text-[10.5px] text-neutral-800">{receiptConfig.senderPhone}</p>
                        <p className="text-[10px] text-neutral-800 leading-tight">{receiptConfig.senderAddress}</p>
                      </div>
                    </div>

                    {receiptConfig.showItemsList && (
                      <div className="space-y-1.5 border-b-2 border-black pb-3 text-[10.5px]">
                        <div className="grid grid-cols-3 gap-2 bg-neutral-50 p-1.5 rounded-none border border-black/20 text-center font-bold text-[10px]">
                          <div>
                            <span className="text-[8px] text-neutral-600 block">INVOICE</span>
                            <span className="font-mono text-[9.5px]">INV/2026/001</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-neutral-600 block">BERAT</span>
                            <span>1.0 Kg</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-neutral-600 block">STATUS</span>
                            <span className="text-emerald-700">{receiptConfig.showCodBadge ? 'LUNAS' : 'COD'}</span>
                          </div>
                        </div>
                        <div className="space-y-1 pt-1">
                          <span className="text-[9px] font-black text-neutral-700 uppercase block">Isi Paket (2 Item):</span>
                          <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200 py-0.5">
                            <div className="py-0.5 flex justify-between items-center text-[10px]">
                              <span className="truncate">1x Tusko Pro Matchday Football Jersey (L)</span>
                              <span className="font-mono font-bold shrink-0">[ ✓ ]</span>
                            </div>
                            <div className="py-0.5 flex justify-between items-center text-[10px]">
                              <span className="truncate">1x Tusko Kaos Kaki Anti-Slip Sport</span>
                              <span className="font-mono font-bold shrink-0">[ ✓ ]</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {receiptConfig.showUnboxingNotice && (
                      <div className="pt-0.5 flex items-center justify-between text-[9px] text-neutral-700">
                        <span className="italic">{receiptConfig.footerNote}</span>
                        <span className="font-bold text-black uppercase font-sport">Tusko Fulfillment</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10.5px] text-neutral-500 text-center">
                    Klik <strong>Uji Cetak</strong> untuk mencetak hanya label ini. Pada dialog print browser pilih <strong>Destination: Thermal Printer</strong> dan <strong>Margins: None</strong>. Ukuran kertas mengikuti pilihan di atas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= SECTION: LOG NOTIFIKASI ================= */}
          {activeSection === 'logs' && (
            <div className="bg-white rounded-none border border-neutral-300 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-sport font-black text-sm uppercase tracking-wider text-neutral-950">Riwayat Pengiriman Notifikasi</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Pencatatan email notifikasi otomatis yang dikirim ke pembeli.</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-none border border-emerald-200 shrink-0">
                  {notificationLogs.length} Terkirim
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-neutral-50 text-neutral-500 font-sport font-black uppercase text-[10px] tracking-wider border-b border-neutral-200">
                    <tr>
                      <th className="px-4 py-3">ID Log</th>
                      <th className="px-4 py-3">Waktu Kirim</th>
                      <th className="px-4 py-3">No. Invoice</th>
                      <th className="px-4 py-3">Penerima (Email)</th>
                      <th className="px-4 py-3">Subjek Notifikasi</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {notificationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-neutral-500 font-bold text-[11px]">{log.id}</td>
                        <td className="px-4 py-3.5 text-neutral-600 whitespace-nowrap">{log.sentAt}</td>
                        <td className="px-4 py-3.5 font-mono font-bold text-neutral-900">{log.orderNumber}</td>
                        <td className="px-4 py-3.5 text-neutral-800 font-medium">{log.recipient}</td>
                        <td className="px-4 py-3.5 text-neutral-700 max-w-xs truncate">{log.subject}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-none font-bold text-[10px]">
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
        </div>
      </div>

      {/* Dialog kirim email tes (aksi satu-langkah, bukan form entitas) */}
      {isTestEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-none max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-300 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none bg-neutral-950 text-amber-400 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-sport font-black text-sm uppercase tracking-wider text-neutral-950">Kirim Email Uji Coba</h3>
                  <p className="text-[11px] text-neutral-500">Uji rendering template pada klien email nyata</p>
                </div>
              </div>
              <IconButton icon={ArrowLeft} onClick={() => setIsTestEmailModalOpen(false)} title="Tutup" variant="outline" className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelClass}>Email Tujuan Uji Coba</label>
                <TextInput
                  type="email"
                  value={testEmailAddress}
                  onChange={setTestEmailAddress}
                  placeholder="nama@email.com"
                />
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-none text-neutral-700 text-[11px] space-y-1">
                <p className="font-bold">Template yang dikirim:</p>
                <p className="italic">{currentEmailTemplate.name}</p>
                <p className="text-[10.5px] text-neutral-500">Subjek: {renderPreviewText(currentEmailTemplate.subject)}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsTestEmailModalOpen(false)} className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-sport font-black text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer">
                Batal
              </button>
              <button type="button" onClick={handleSendTestEmail} disabled={isSendingTest} className="px-5 py-2 bg-amber-400 hover:bg-amber-300 border border-amber-500 text-neutral-950 font-sport font-black text-xs uppercase tracking-wider rounded-none transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
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
