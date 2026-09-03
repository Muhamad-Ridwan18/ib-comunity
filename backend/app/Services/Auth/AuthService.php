<?php

namespace App\Services\Auth;

use App\Models\OnboardingProgress;
use App\Models\Profile;
use App\Models\RefreshToken;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthService
{
    public function register(string $email, string $password, string $fullName): array
    {
        $role = Role::query()->where('name', 'member')->firstOrFail();

        $user = User::query()->create([
            'email' => strtolower($email),
            'password' => $password,
            'role_id' => $role->id,
            'status' => User::STATUS_REGISTERED,
        ]);

        Profile::query()->create([
            'user_id' => $user->id,
            'full_name' => $fullName,
            'timezone' => 'UTC',
        ]);

        OnboardingProgress::query()->create([
            'user_id' => $user->id,
            'current_step' => 1,
        ]);

        return $this->issueTokens($user);
    }

    public function login(string $email, string $password): ?array
    {
        $user = User::query()->where('email', strtolower($email))->first();
        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        if ($user->status === User::STATUS_LOCKED) {
            return null;
        }

        $user->forceFill(['last_login_at' => now()])->save();

        return $this->issueTokens($user);
    }

    public function issueTokens(User $user): array
    {
        $user->tokens()->where('name', 'access')->delete();

        $accessToken = $user->createToken('access', ['*'], now()->addMinutes((int) config('santara.jwt_access_ttl_minutes', 15)))->plainTextToken;

        $refreshPlain = Str::random(64);
        RefreshToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $refreshPlain),
            'expires_at' => now()->addDays((int) config('santara.jwt_refresh_ttl_days', 30)),
            'user_agent' => request()->userAgent(),
            'ip' => request()->ip(),
        ]);

        return [
            'user' => $user->fresh(['profile', 'role', 'memberLevel', 'currentSubscription.plan'])->toApiArray(),
            'tokens' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshPlain,
                'token_type' => 'Bearer',
                'expires_in' => (int) config('santara.jwt_access_ttl_minutes', 15) * 60,
            ],
        ];
    }

    public function refresh(string $refreshToken): ?array
    {
        $row = RefreshToken::query()
            ->where('token_hash', hash('sha256', $refreshToken))
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->first();

        if (! $row) {
            return null;
        }

        $row->forceFill(['revoked_at' => now()])->save();

        return $this->issueTokens($row->user);
    }

    public function logout(User $user, ?string $refreshToken = null): void
    {
        $user->currentAccessToken()?->delete();

        if ($refreshToken) {
            RefreshToken::query()
                ->where('user_id', $user->id)
                ->where('token_hash', hash('sha256', $refreshToken))
                ->update(['revoked_at' => now()]);
        }
    }
}
