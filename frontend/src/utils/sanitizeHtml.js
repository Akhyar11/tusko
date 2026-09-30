/**
 * Sanitasi HTML sisi klien (allow-list) — pertahanan berlapis sebelum dirender
 * via dangerouslySetInnerHTML. Backend juga menyaring (HtmlSanitizer) saat simpan.
 */
const ALLOWED = {
  P: [], BR: [], STRONG: [], B: [], EM: [], I: [], U: [], S: [],
  H1: [], H2: [], H3: [], H4: [], UL: [], OL: [], LI: [],
  BLOCKQUOTE: [], HR: [], CODE: [], PRE: [], A: ['href', 'title', 'target', 'rel'],
};

const DROP = ['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'MATH', 'FORM', 'INPUT', 'BUTTON', 'LINK', 'META', 'BASE'];

export function isHtmlContent(value) {
  return /<\/?(p|h[1-6]|ul|ol|li|blockquote|strong|em|a|br|code|pre)\b/i.test(String(value || ''));
}

export function sanitizeHtml(html) {
  const raw = String(html || '');
  if (raw === '') return '';
  if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return '';

  const doc = new window.DOMParser().parseFromString(`<div>${raw}</div>`, 'text/html');
  const root = doc.body.firstChild;
  if (!root) return '';

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType !== 1) return;
      const tag = child.tagName;
      if (DROP.includes(tag)) {
        child.remove();
        return;
      }
      if (!ALLOWED[tag]) {
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      [...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (!ALLOWED[tag].includes(name)) {
          child.removeAttribute(attr.name);
        } else if (name === 'href' && /^\s*(javascript|data):/i.test(attr.value)) {
          child.removeAttribute('href');
        }
      });
      walk(child);
    });
  };

  walk(root);
  return root.innerHTML;
}
