<?php

namespace Tests\Feature;

use App\Services\HtmlSanitizer;
use Tests\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_strips_disallowed_tags_and_dangerous_attributes(): void
    {
        $sanitizer = new HtmlSanitizer();

        $out = $sanitizer->clean(
            '<p onclick="evil()">Halo <script>alert(1)</script><strong>tebal</strong> '
            . '<a href="javascript:alert(1)" onclick="x()">tautan</a> '
            . '<iframe src="http://evil"></iframe></p>'
        );

        $this->assertStringNotContainsString('script', $out);
        $this->assertStringNotContainsString('iframe', $out);
        $this->assertStringNotContainsString('onclick', $out);
        $this->assertStringNotContainsString('javascript:', $out);
        $this->assertStringContainsString('<strong>tebal</strong>', $out);
        $this->assertStringContainsString('tautan', $out);
    }

    public function test_keeps_allowed_formatting_tags(): void
    {
        $sanitizer = new HtmlSanitizer();

        $html = '<h2>Judul</h2><ul><li>Satu</li><li>Dua</li></ul><p><em>miring</em> <a href="https://tusko.test">tautan</a></p>';
        $out = $sanitizer->clean($html);

        $this->assertStringContainsString('<h2>Judul</h2>', $out);
        $this->assertStringContainsString('<li>Satu</li>', $out);
        $this->assertStringContainsString('<em>miring</em>', $out);
        $this->assertStringContainsString('href="https://tusko.test"', $out);
    }

    public function test_plain_text_is_preserved(): void
    {
        $sanitizer = new HtmlSanitizer();

        $this->assertSame('Halo dunia', $sanitizer->clean('Halo dunia'));
    }
}
