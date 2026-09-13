import React from 'react';

/**
 * Atom: IconButton with Sharp Athletic Styling and Hover Tooltip
 */
export default function IconButton({
  icon: Icon,
  label,
  title,
  onClick,
  variant = 'secondary', // 'primary' | 'secondary' | 'dark' | 'outline'
  badge = null,
  disabled = false,
  className = '',
  type = 'button'
}) {
  const tooltipText = label || title;

  const variantClasses = {
    primary: 'bg-amber-400 hover:bg-amber-300 text-black border-amber-500 shadow-xs',
    secondary: 'bg-white hover:bg-neutral-100 text-neutral-900 border-neutral-300',
    dark: 'bg-neutral-950 hover:bg-neutral-900 text-white border-neutral-950 shadow-xs',
    outline: 'bg-transparent hover:bg-neutral-100 text-neutral-800 border-neutral-300'
  };

  return (
    <div className="relative group inline-flex shrink-0">
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltipText}
        className={`w-10 h-10 rounded-none border transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant] || variantClasses.secondary} ${className}`}
      >
        {Icon && <Icon size={18} strokeWidth={2.2} />}
        
        {/* Badge counter */}
        {badge !== null && badge !== undefined && Number(badge) > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-400 text-black text-[9px] font-mono font-black flex items-center justify-center rounded-none shadow-2xs border border-neutral-950 pointer-events-none">
            {badge}
          </span>
        )}
      </button>

      {/* Floating sharp tooltip */}
      {tooltipText && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-neutral-950 text-white text-[10px] font-sport font-black uppercase tracking-wider whitespace-nowrap shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-150 z-50 rounded-none border border-neutral-800">
          {tooltipText}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-950 rotate-45 border-t border-l border-neutral-800" />
        </div>
      )}
    </div>
  );
}
