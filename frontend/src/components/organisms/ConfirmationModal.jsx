import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Trash2, 
  Check, 
  Loader2 
} from 'lucide-react';

export default function ConfirmationModal({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  title = 'Konfirmasi Tindakan',
  subtitle = 'Tindakan ini tidak dapat dibatalkan.',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  icon: CustomIcon = null,
  children = null,
  secondaryAction = null, // { label: string, icon: Component, onClick: func, title?: string }
  isLoading = false
}) {
  if (!isOpen) return null;

  const IconComponent = CustomIcon || (
    variant === 'danger' ? AlertTriangle :
    variant === 'warning' ? AlertCircle : Info
  );

  const iconContainerClass = 
    variant === 'danger' ? 'bg-rose-600/20 border-rose-500/40 text-rose-400' :
    variant === 'warning' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' :
    'bg-neutral-700/50 border-neutral-600 text-neutral-300';

  const confirmButtonClass = 
    variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs' :
    variant === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs' :
    'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-none border border-neutral-300 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 bg-neutral-900 text-white border-b border-neutral-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-none border flex items-center justify-center shrink-0 ${iconContainerClass}`}>
              <IconComponent size={22} />
            </div>
            <div>
              <h3 className="text-sm font-sport font-black uppercase tracking-wider text-white">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-neutral-400 font-sport">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-neutral-400 hover:text-white p-1 rounded-none hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {message && (
            <p className="text-xs text-neutral-700 leading-relaxed font-sport">
              {message}
            </p>
          )}

          {children}
        </div>

        {/* Action Footer Buttons */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 text-xs font-sport">
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={isLoading}
              className="px-3.5 py-2 text-neutral-800 bg-white hover:bg-neutral-200 border border-neutral-300 font-bold rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              title={secondaryAction.title || ''}
            >
              {secondaryAction.icon && <secondaryAction.icon size={14} />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-neutral-700 bg-white hover:bg-neutral-200 border border-neutral-300 font-bold rounded-none transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 font-black uppercase tracking-wider rounded-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${confirmButtonClass}`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                {variant === 'danger' && <Trash2 size={14} />}
                {variant === 'warning' && <AlertCircle size={14} />}
                {variant === 'info' && <Check size={14} />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
