<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use RuntimeException;

trait HandlesServiceErrors
{
    protected function fromService(callable $callback, string $successMessage = 'OK', int $successStatus = 200): JsonResponse
    {
        try {
            $result = $callback();

            if (is_array($result) && array_key_exists('data', $result) && array_key_exists('meta', $result)) {
                return ApiResponse::ok($result['data'], $successMessage, $result['meta'], $successStatus);
            }

            return ApiResponse::ok($result, $successMessage, null, $successStatus);
        } catch (RuntimeException $e) {
            $code = $e->getCode();
            if ($code < 400 || $code > 599) {
                $code = 400;
            }

            return ApiResponse::fail($e->getMessage(), $code);
        }
    }

    /** @return array{data: mixed, meta: array<string, int>} */
    protected function paginated(callable $callback, int $page, int $perPage): array
    {
        [$items, $total] = $callback();

        return [
            'data' => $items,
            'meta' => \App\Support\PaginationMeta::make($page, $perPage, $total),
        ];
    }
}
