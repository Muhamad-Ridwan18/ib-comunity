<?php

namespace App\Services\Content;

use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Smalot\PdfParser\Parser;

class PdfArticleExtractor
{
    public function htmlFromKey(string $key): string
    {
        if (! Storage::disk('public')->exists($key)) {
            throw new RuntimeException('PDF file not found', 404);
        }

        $absolute = Storage::disk('public')->path($key);
        $parser = new Parser;
        $pdf = $parser->parseFile($absolute);
        $text = trim($pdf->getText() ?? '');

        if ($text === '') {
            throw new RuntimeException('PDF has no extractable text. Try a text-based PDF or paste the article manually.', 422);
        }

        return $this->textToHtml($text);
    }

    private function textToHtml(string $text): string
    {
        // Normalize line endings and collapse excessive blank lines.
        $normalized = str_replace(["\r\n", "\r"], "\n", $text);
        $normalized = preg_replace("/[ \t]+/u", ' ', $normalized) ?? $normalized;
        $normalized = preg_replace("/\n{3,}/u", "\n\n", $normalized) ?? $normalized;

        $blocks = preg_split("/\n{2,}/u", trim($normalized)) ?: [];
        $html = [];

        foreach ($blocks as $block) {
            $lines = array_values(array_filter(array_map('trim', explode("\n", $block)), fn ($l) => $l !== ''));
            if ($lines === []) {
                continue;
            }

            // Short single-line blocks look like headings.
            if (count($lines) === 1 && mb_strlen($lines[0]) <= 90 && ! preg_match('/[.!?]$/u', $lines[0])) {
                $html[] = '<h2>'.e($lines[0]).'</h2>';
                continue;
            }

            $html[] = '<p>'.e(implode(' ', $lines)).'</p>';
        }

        if ($html === []) {
            throw new RuntimeException('PDF has no extractable text. Try a text-based PDF or paste the article manually.', 422);
        }

        return implode("\n", $html);
    }
}
