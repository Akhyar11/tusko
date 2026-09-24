import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

/**
 * RowActionMenu — dropdown aksi baris tabel yang di-portal ke `document.body`
 * dengan `position: fixed` (Aturan 31: dropdown wajib keluar dari container
 * tabel agar tidak ter-clip `overflow`). Children berupa render-prop `(close) => ...`.
 */
export default function RowActionMenu({ buttonTitle = 'Menu Aksi', children, width = 208 }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, openUp: false });
  const buttonRef = useRef(null);

  const computePosition = () => {
    const el = buttonRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const estimatedHeight = 240;
    const openUp = rect.bottom + estimatedHeight > window.innerHeight;
    const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));

    setPosition({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left,
      openUp,
    });
  };

  const handleToggle = (event) => {
    event.stopPropagation();
    if (!open) computePosition();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return undefined;

    const close = () => setOpen(false);
    window.addEventListener('click', close);
    window.addEventListener('resize', close);

    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={`p-1.5 rounded-none border transition-colors cursor-pointer ${
          open
            ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs'
            : 'text-neutral-700 hover:text-black hover:bg-neutral-100 border-neutral-300 bg-white shadow-2xs'
        }`}
        title={buttonTitle}
      >
        <MoreVertical size={16} />
      </button>

      {open && createPortal(
        <div
          className="fixed w-52 bg-white border border-neutral-300 rounded-none shadow-xl z-[120] py-1 text-left animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: position.top,
            left: position.left,
            transform: position.openUp ? 'translateY(-100%)' : 'none',
          }}
          onClick={(event) => event.stopPropagation()}
        >
          {children(() => setOpen(false))}
        </div>,
        document.body
      )}
    </>
  );
}
