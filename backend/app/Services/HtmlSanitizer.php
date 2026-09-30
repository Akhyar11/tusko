<?php

namespace App\Services;

/**
 * HtmlSanitizer — allow-list sederhana untuk HTML kaya (WYSIWYG Tiptap, T36 Fase 2).
 *
 * Menghapus tag/atribut di luar daftar aman dan menolak URL `javascript:`/`data:`
 * pada tautan, sehingga konten yang disimpan aman dirender di storefront.
 */
class HtmlSanitizer
{
    /** @var array<string, array<int, string>> tag => atribut yang diizinkan */
    private const ALLOWED = [
        'p' => [],
        'br' => [],
        'strong' => [],
        'b' => [],
        'em' => [],
        'i' => [],
        'u' => [],
        's' => [],
        'h1' => [],
        'h2' => [],
        'h3' => [],
        'h4' => [],
        'ul' => [],
        'ol' => [],
        'li' => [],
        'blockquote' => [],
        'hr' => [],
        'code' => [],
        'pre' => [],
        'a' => ['href', 'title', 'target', 'rel'],
    ];

    /** Tag yang dibuang TOTAL (termasuk isinya) — tidak boleh di-unwrap. */
    private const DROP = [
        'script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template',
        'svg', 'math', 'form', 'input', 'button', 'link', 'meta', 'base', 'title', 'head',
    ];

    public function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return $html;
        }

        $doc = new \DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $doc->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $body = $doc->getElementsByTagName('body')->item(0);
        if ($body === null) {
            return trim(strip_tags($html, '<p><br><strong><em><ul><ol><li><h1><h2><h3><h4><blockquote><a>'));
        }

        $this->sanitizeChildren($body);

        $out = '';
        foreach ($body->childNodes as $child) {
            $out .= $doc->saveHTML($child);
        }

        return trim($out);
    }

    private function sanitizeChildren(\DOMNode $node): void
    {
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if (! $child instanceof \DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);

            if (in_array($tag, self::DROP, true)) {
                // Tag berbahaya: buang total (beserta isinya).
                $node->removeChild($child);
                continue;
            }

            if (! isset(self::ALLOWED[$tag])) {
                // Tag tidak diizinkan: lepas pembungkusnya, pertahankan teks/anak.
                while ($child->firstChild) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
                continue;
            }

            $allowedAttrs = self::ALLOWED[$tag];
            for ($i = $child->attributes->length - 1; $i >= 0; $i--) {
                $attr = $child->attributes->item($i);
                if ($attr === null) {
                    continue;
                }
                $name = strtolower($attr->name);

                if (! in_array($name, $allowedAttrs, true)) {
                    $child->removeAttribute($attr->name);
                    continue;
                }

                if ($name === 'href' && preg_match('/^\s*(javascript|data):/i', $attr->value)) {
                    $child->removeAttribute('href');
                }
            }

            $this->sanitizeChildren($child);
        }
    }
}
