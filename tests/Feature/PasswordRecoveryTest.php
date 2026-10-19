<?php

namespace Tests\Feature;

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

class PasswordRecoveryTest extends TestCase
{
    public function createApplication()
    {
        $app = require __DIR__ . '/../../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();
        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.url' => null,
            'cache.default' => 'array',
            'session.driver' => 'array',
            'app.url' => 'https://hrms.example.test',
        ]);
        DB::purge('sqlite');
        $this->artisan('migrate', ['--force' => true])->assertExitCode(0);
        Notification::fake();
        DB::table('roles')->insert(['id' => 1, 'name' => 'Administrator', 'code' => 'SUPER_ADMIN']);
        User::create([
            'name' => 'Test Administrator',
            'username' => 'superadmin',
            'email' => 'admin@example.test',
            'password' => Hash::make('existing-password'),
            'role_id' => 1,
            'status' => 'active',
        ]);
    }

    public function test_reset_request_sends_link_without_changing_credentials(): void
    {
        $user = User::first();
        $password = $user->password;
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        Notification::assertSentTo($user, ResetPasswordNotification::class, function ($notification) use ($user) {
            $url = $notification->toMail($user)->actionUrl;
            $this->assertStringStartsWith('https://hrms.example.test/?reset_token=', $url);
            $this->assertStringContainsString('email=admin%40example.test', $url);
            return true;
        });
        $this->assertSame($password, $user->fresh()->password);
    }

    public function test_unknown_and_inactive_accounts_receive_the_same_response(): void
    {
        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.test']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test']);
        $this->assertSame($known->json(), $unknown->json());
        Notification::fake();
        User::first()->update(['status' => 'suspended']);
        $inactive = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'admin@example.test']);
        $this->assertSame($known->json(), $inactive->json());
        Notification::assertNothingSent();
    }

    public function test_valid_reset_revokes_sessions_and_token_cannot_be_reused(): void
    {
        $user = User::first();
        $user->createToken('existing-session');
        $payload = [
            'email' => $user->email,
            'token' => Password::createToken($user),
            'password' => 'replacement-password',
            'password_confirmation' => 'replacement-password',
        ];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertOk();
        $this->assertTrue(Hash::check('replacement-password', $user->fresh()->password));
        $this->assertSame('superadmin', $user->fresh()->username);
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);
    }

    public function test_invalid_expired_and_unconfirmed_resets_do_not_change_password(): void
    {
        $user = User::first();
        $password = $user->password;
        $payload = [
            'email' => $user->email,
            'token' => 'invalid',
            'password' => 'replacement-password',
            'password_confirmation' => 'replacement-password',
        ];
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);
        $payload['token'] = Password::createToken($user);
        $payload['password_confirmation'] = 'different-password';
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertUnprocessable()->assertJsonValidationErrors('password');
        $payload['password_confirmation'] = $payload['password'];
        DB::table('password_reset_tokens')->update(['created_at' => now()->subMinutes(61)]);
        $this->postJson('/api/v1/auth/reset-password', $payload)->assertStatus(422);
        $this->assertSame($password, $user->fresh()->password);
    }

    public function test_recovery_requests_are_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test'])->assertOk();
        }
        $this->postJson('/api/v1/auth/forgot-password', ['email' => 'unknown@example.test'])->assertStatus(429);
    }

    public function test_existing_credentials_still_work_by_username_and_email(): void
    {
        foreach (['superadmin', 'admin@example.test'] as $identifier) {
            $this->postJson('/api/v1/auth/login', [
                'username' => $identifier,
                'password' => 'existing-password',
            ])->assertOk()->assertJsonPath('success', true);
        }
    }
}
