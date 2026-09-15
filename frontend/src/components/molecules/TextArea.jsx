import React from 'react';

/**
 * Molecule: TextArea
 * Textarea kanonis Tusko (aturan 25) — SATU-SATUNYA cara merender
 * <textarea> di halaman (DILARANG native <textarea> langsung di luar atoms/molecules).
 */
export default function TextArea({
  value = '',
  onChange = () => {},
  placeholder = '',
  rows = 3,
  required = false,
  disabled = false,
  readOnly = false,
  name = '',
  className = ''
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      name={name}
      className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    />
  );
}
