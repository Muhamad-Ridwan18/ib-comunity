<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Verification\VerificationService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private VerificationService $verification) {}

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        $query = User::query()->with(['profile', 'role', 'memberLevel']);
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($q = $request->query('q')) {
            $query->where('email', 'like', '%'.$q.'%');
        }

        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (User $u) => $u->toApiArray())
            ->all();

        return $this->fromService(fn () => $this->paginated(fn () => [$items, $total], $page, $perPage));
    }

    public function show(string $id)
    {
        $user = User::query()->with(['profile', 'role', 'memberLevel', 'currentSubscription.plan'])->find($id);
        if (! $user) {
            return \App\Support\ApiResponse::fail('Not found', 404);
        }

        return $this->fromService(fn () => $user->toApiArray());
    }

    public function update(Request $request, string $id)
    {
        $user = User::query()->find($id);
        if (! $user) {
            return \App\Support\ApiResponse::fail('Not found', 404);
        }

        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'role' => ['nullable', 'string'],
        ]);

        if (isset($data['role'])) {
            if ($request->user()->role?->name !== 'super_admin') {
                return \App\Support\ApiResponse::fail('Forbidden', 403);
            }
            $role = \App\Models\Role::query()->where('name', $data['role'])->first();
            if ($role) {
                $user->role_id = $role->id;
            }
        }

        if (isset($data['status'])) {
            $user->status = $data['status'];
        }

        $user->save();

        return $this->fromService(fn () => $user->fresh(['profile', 'role', 'memberLevel'])->toApiArray(), 'User updated');
    }

    public function lock(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->verification->lockUser($id);

            return null;
        }, 'User locked');
    }

    public function unlock(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->verification->unlockUser($id);

            return null;
        }, 'User unlocked');
    }
}
