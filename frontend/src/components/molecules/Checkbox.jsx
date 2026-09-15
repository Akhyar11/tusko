import React from 'react';

/**
 * Molecule: Checkbox
 * Checkbox kanonis Tusko (aturan 25) — SATU-SATUNYA cara merender
 * <input type="checkbox"> di halaman (DILARANG native checkbox langsung di luar atoms/molecules).
 */
export default function Checkbox({
  checked = false,
  onChange = () => {},
  disabled = false,
  name = '',
  ariaLabel = '',
  inputRef = null,
  className = ''
}) {
  return (
    <input
      type="checkbox"
      ref={inputRef}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      name={name}
      aria-label={ariaLabel || undefined}
      className={`rounded-none border-neutral-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
}
