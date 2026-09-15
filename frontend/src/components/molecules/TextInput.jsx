import React from 'react';

/**
 * Molecule: TextInput
 * Input teks/angka/tanggal kanonis Tusko (aturan 25) — SATU-SATUNYA cara merender
 * <input> di halaman (DILARANG native <input> langsung di luar atoms/molecules).
 *
 * @param {string} props.type - text | number | date | password | email | tel | url | time
 * @param {string} props.weight - medium (teks biasa) | mono (kode/angka/SKU) | bold (penekanan)
 */
const WEIGHT_CLASSES = {
  medium: 'font-medium',
  mono: 'font-mono',
  bold: 'font-bold'
};

export default function TextInput({
  type = 'text',
  value = '',
  onChange = () => {},
  placeholder = '',
  required = false,
  disabled = false,
  readOnly = false,
  name = '',
  min,
  max,
  step,
  weight = 'medium',
  prefix = null,
  suffix = null,
  title = '',
  className = ''
}) {
  const inputEl = (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      name={name}
      min={min}
      max={max}
      step={step}
      title={title}
      className={`w-full h-[42px] ${prefix ? 'pl-9 pr-3.5' : suffix ? 'pl-3.5 pr-12' : 'px-3.5'} py-2.5 text-xs sm:text-sm bg-neutral-50 focus:bg-white border border-neutral-300 focus:outline-none focus:border-amber-500 text-neutral-950 rounded-none disabled:opacity-50 disabled:cursor-not-allowed ${WEIGHT_CLASSES[weight] || WEIGHT_CLASSES.medium} ${className}`}
    />
  );

  if (prefix || suffix) {
    return (
      <div className="relative w-full">
        {prefix && (
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono font-bold text-neutral-400 select-none pointer-events-none z-10">
            {prefix}
          </span>
        )}
        {inputEl}
        {suffix && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-mono font-bold text-neutral-500 select-none pointer-events-none z-10">
            {suffix}
          </span>
        )}
      </div>
    );
  }

  return inputEl;
}
