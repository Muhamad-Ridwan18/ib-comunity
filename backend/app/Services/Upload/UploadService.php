<?php

namespace App\Services\Upload;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class UploadService
{
    /** @var array<string, array{max: int}> */
    private const PURPOSES = [
        'proof' => ['max' => 10 * 1024 * 1024],
        'avatar' => ['max' => 2 * 1024 * 1024],
        'thumbnail' => ['max' => 5 * 1024 * 1024],
        'attachment' => ['max' => 10 * 1024 * 1024],
        'temp' => ['max' => 5 * 1024 * 1024],
    ];

    private const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    public function store(UploadedFile $file, string $purpose = 'temp'): array
    {
        $purpose = strtolower(trim($purpose));
        if (! isset(self::PURPOSES[$purpose])) {
            throw new RuntimeException('Invalid upload purpose', 400);
        }

        $max = self::PURPOSES[$purpose]['max'];
        if ($file->getSize() <= 0 || $file->getSize() > $max) {
            throw new RuntimeException(sprintf('File too large (max %dMB)', $max / (1024 * 1024)), 422);
        }

        $ext = strtolower($file->getClientOriginalExtension());
        if ($ext === 'jpeg') {
            $ext = 'jpg';
        }
        if (! in_array($ext, self::ALLOWED_EXT, true)) {
            throw new RuntimeException('Unsupported file type', 422);
        }

        $filename = Str::uuid().'_'.time().'.'.$ext;
        $key = "uploads/{$purpose}/{$filename}";
        Storage::disk('public')->putFileAs("uploads/{$purpose}", $file, $filename);

        return [
            'key' => $key,
            'url' => $this->urlForKey($key),
        ];
    }

    public function urlForKey(?string $key): ?string
    {
        if (! $key) {
            return null;
        }

        return Storage::disk('public')->url($key);
    }
}
