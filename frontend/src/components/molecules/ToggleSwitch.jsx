import React from 'react';

/**
 * Molecule: ToggleSwitch
 * Sakelar on/off kanonis Tusko (aturan 25) — sudut siku `rounded-none`, aksen amber.
 * Dipakai untuk field boolean (mis. aktif/nonaktif menu, tampilkan section).
 *
 * @param {boolean} props.checked
 * @param {function} props.onChange - (checked:boolean) => void
 * @param {boolean} props.disabled
 * @param {string} props.ariaLabel
 */
export default function ToggleSwitch({
  checked = false,
  onChange = () => {},
  disabled = false,
  ariaLabel = '',
  className = '',
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-6 w-11 shrink-0 rounded-none border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-amber-400 border-amber-500' : 'bg-neutral-200 border-neutral-300'
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-none transform transition-transform ${
          checked ? 'translate-x-6 bg-neutral-950' : 'translate-x-1 bg-white'
        }`}
      />
    </button>
  );
}
