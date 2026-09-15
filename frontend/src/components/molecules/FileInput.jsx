import React, { useRef } from 'react';

/**
 * Molecule: FileInput
 * Pemilih berkas kanonis Tusko — SATU-SATUNYA cara merender <input type="file">
 * di halaman (DILARANG native file input langsung di luar atoms/molecules).
 * UI pemicu (dropzone/tombol) disuplai via children agar konsisten per konteks.
 *
 * @param {function} props.onChange - (file | File[]) => void (array bila multiple)
 */
export default function FileInput({
  accept = 'image/*',
  multiple = false,
  disabled = false,
  onChange = () => {},
  children
}) {
  const inputRef = useRef(null);

  const openPicker = () => {
    if (!disabled && inputRef.current) inputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    onChange(multiple ? files : files[0]);
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openPicker}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            openPicker();
          }
        }}
      >
        {children}
      </div>
    </>
  );
}
