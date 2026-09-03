<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Upload\UploadService;
use Illuminate\Http\Request;

class UploadController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private UploadService $uploads) {}

    public function store(Request $request)
    {
        $request->validate(['file' => ['required', 'file']]);

        return $this->fromService(
            fn () => $this->uploads->store(
                $request->file('file'),
                $request->query('purpose', 'temp'),
                false
            ),
            'Uploaded',
            201
        );
    }

    public function storeAdmin(Request $request)
    {
        $request->validate(['file' => ['required', 'file']]);

        return $this->fromService(
            fn () => $this->uploads->store(
                $request->file('file'),
                $request->query('purpose', 'temp'),
                true
            ),
            'Uploaded',
            201
        );
    }
}
