import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
} from 'lucide-react';

/**
 * Molecule: RichTextEditor (WYSIWYG Tiptap) — untuk field teks panjang (legal/about/FAQ).
 * Output HTML. Backend menyaring (sanitize) sebelum disimpan.
 */
export default function RichTextEditor({ value = '', onChange = () => {}, placeholder = 'Tulis konten...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: { class: 'tusko-rte-content focus:outline-none min-h-[160px] px-3.5 py-3 text-xs sm:text-sm text-neutral-950' },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  if (!editor) {
    return <div className="border border-neutral-300 rounded-none bg-neutral-50 h-[200px]" />;
  }

  const Btn = ({ icon: Icon, action, active = false, title }) => (
    <button
      type="button"
      onClick={action}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-none border transition-colors cursor-pointer ${
        active ? 'bg-neutral-950 text-amber-400 border-neutral-950' : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-100'
      }`}
    >
      <Icon size={15} />
    </button>
  );

  const buttons = [
    { icon: Bold, title: 'Tebal', action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') },
    { icon: Italic, title: 'Miring', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') },
    { icon: Underline, title: 'Garis Bawah', action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline') },
    { icon: Strikethrough, title: 'Coret', action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike') },
    { icon: Heading2, title: 'Judul 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
    { icon: Heading3, title: 'Judul 3', action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) },
    { icon: List, title: 'Daftar Poin', action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
    { icon: ListOrdered, title: 'Daftar Nomor', action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
    { icon: Quote, title: 'Kutipan', action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
    { icon: Undo2, title: 'Batalkan', action: () => editor.chain().focus().undo().run() },
    { icon: Redo2, title: 'Ulangi', action: () => editor.chain().focus().redo().run() },
  ];

  return (
    <div className="border border-neutral-300 rounded-none bg-white">
      <style>{`
        .tusko-rte-content p { margin: 0 0 0.6rem; line-height: 1.6; }
        .tusko-rte-content h2 { font-size: 1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; margin: 0.8rem 0 0.5rem; }
        .tusko-rte-content h3 { font-size: 0.9rem; font-weight: 800; margin: 0.7rem 0 0.4rem; }
        .tusko-rte-content ul { list-style: disc; padding-left: 1.25rem; margin: 0 0 0.6rem; }
        .tusko-rte-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0 0 0.6rem; }
        .tusko-rte-content li { margin: 0.15rem 0; }
        .tusko-rte-content blockquote { border-left: 3px solid #d4d4d4; padding-left: 0.75rem; color: #525252; margin: 0.5rem 0; }
        .tusko-rte-content a { color: #b45309; text-decoration: underline; }
        .tusko-rte-content strong { font-weight: 700; }
        .tusko-rte-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #a3a3a3; float: left; height: 0; pointer-events: none; }
      `}</style>

      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
        {buttons.map((b, i) => (
          <Btn key={i} {...b} />
        ))}
      </div>

      <EditorContent editor={editor} data-placeholder={placeholder} />
    </div>
  );
}
