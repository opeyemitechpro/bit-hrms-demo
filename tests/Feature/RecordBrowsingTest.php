<?php

namespace Tests\Feature;

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\TestCase;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RecordBrowsingTest extends TestCase
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
        ]);
        DB::purge('sqlite');
        $this->artisan('migrate', ['--force' => true])->assertExitCode(0);
        DB::table('roles')->insert(['id' => 1, 'name' => 'Administrator', 'code' => 'SUPER_ADMIN']);
        $this->actingAs(User::create([
            'name' => 'Ada Demo Administrator',
            'username' => 'demo-admin',
            'email' => 'admin@example.test',
            'password' => bcrypt('test-password'),
            'role_id' => 1,
            'status' => 'active',
        ]));
        DB::table('departments')->insert(['id' => 1, 'name' => 'Infrastructure', 'code' => 'BIT-INF']);
        DB::table('units')->insert(['id' => 1, 'name' => 'Software', 'code' => 'BIT-INF-SWE', 'department_id' => 1]);
        DB::table('grade_levels')->insert(['id' => 1, 'name' => 'GL 08', 'level_number' => 8]);
        DB::table('designations')->insert([
            ['id' => 1, 'name' => 'Programme Analyst II', 'code' => 'PA2', 'cadre_name' => 'Programme Analyst Officer Cadre'],
            ['id' => 2, 'name' => 'Accountant II', 'code' => 'ACC2', 'cadre_name' => 'Accountant Officer Cadre'],
        ]);
        DB::table('employment_statuses')->insert([
            ['id' => 1, 'name' => 'Active', 'code' => 'ACTIVE'],
            ['id' => 2, 'name' => 'Posted', 'code' => 'POSTED'],
        ]);
        $records = [];
        for ($number = 1; $number <= 120; $number++) {
            $records[] = [
                'staff_number' => sprintf('TEST/%03d', $number),
                'surname' => $number === 120 ? 'BeyondLimit' : 'Officer',
                'first_name' => 'Demo',
                'gender' => $number % 2 ? 'Male' : 'Female',
                'date_of_birth' => '1990-01-01',
                'official_email' => "staff{$number}@example.test",
                'department_id' => 1,
                'unit_id' => 1,
                'designation_id' => $number % 2 ? 1 : 2,
                'grade_level_id' => 1,
                'employment_status_id' => $number <= 90 ? 1 : 2,
                'date_of_first_appointment' => '2015-01-01',
                'date_of_present_appointment' => '2022-01-01',
                'expected_retirement_date' => '2050-01-01',
            ];
        }
        DB::table('staff')->insert($records);
    }

    public function test_staff_form_saves_a_record_and_reports_duplicate_employee_numbers(): void
    {
        $payload = [
            'staff_number' => 'TEST/NEW',
            'ogun_employee_number' => 'OG/NEW/001',
            'title' => 'Ms.',
            'surname' => 'NewOfficer',
            'first_name' => 'Demo',
            'middle_name' => '',
            'gender' => 'Female',
            'date_of_birth' => '1994-06-15',
            'official_email' => 'new-officer@example.test',
            'department_id' => 1,
            'unit_id' => 1,
            'designation_id' => 1,
            'grade_level_id' => 1,
            'step' => 1,
            'employment_status_id' => 1,
            'current_station' => 'BIT Headquarters',
            'date_of_first_appointment' => '2018-09-01',
            'date_of_confirmation' => '',
            'date_of_present_appointment' => '2024-01-15',
        ];
        $this->postJson('/api/v1/staff', $payload)->assertCreated()->assertJsonPath('success', true);
        $this->assertDatabaseHas('staff', ['staff_number' => 'TEST/NEW', 'expected_retirement_date' => '2053-09-01']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'STAFF_CREATED', 'username' => 'demo-admin']);
        $payload['staff_number'] = 'TEST/ANOTHER';
        $payload['official_email'] = 'another-officer@example.test';
        $this->postJson('/api/v1/staff', $payload)->assertUnprocessable()->assertJsonValidationErrors('ogun_employee_number');
        $payload['ogun_employee_number'] = '';
        $payload['current_station'] = '';
        $payload['title'] = '';
        $this->postJson('/api/v1/staff', $payload)->assertCreated();
        $this->assertDatabaseHas('staff', [
            'staff_number' => 'TEST/ANOTHER',
            'current_station' => 'BIT Headquarters, Abeokuta',
            'title' => 'Mr.',
        ]);
    }

    public function test_staff_pagination_reaches_records_beyond_the_old_limit(): void
    {
        $first = $this->getJson('/api/v1/staff?per_page=25')->assertOk()->assertJsonCount(25, 'data')
            ->assertJsonPath('meta.total', 120)->assertJsonPath('meta.last_page', 5);
        $last = $this->getJson('/api/v1/staff?per_page=25&page=5')->assertOk()->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.current_page', 5);
        $this->assertEmpty(array_intersect(array_column($first->json('data'), 'id'), array_column($last->json('data'), 'id')));
        $this->getJson('/api/v1/staff?search=BeyondLimit&search_field=name')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.staff_number', 'TEST/120');
    }

    public function test_staff_filters_are_applied_before_pagination(): void
    {
        $this->getJson('/api/v1/staff?quick_filter=PROGRAM_ANALYST&per_page=10')->assertOk()
            ->assertJsonPath('meta.total', 60)->assertJsonCount(10, 'data');
        $this->getJson('/api/v1/staff?quick_filter=ACCOUNTANT&status=POSTED')->assertOk()
            ->assertJsonPath('meta.total', 15);
        $this->getJson('/api/v1/staff?search=beyondlimit%20demo&search_field=name')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/staff?search=BeyondLimit&search_field=ogun_no')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/staff/nominal-roll?search=beyondlimit')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.staff_number', 'TEST/120');
        $this->getJson('/api/v1/staff?per_page=999')->assertOk()->assertJsonCount(100, 'data');
    }

    public function test_audit_logs_include_and_search_the_actor_name(): void
    {
        AuditLogService::log('STAFF_CREATED', 'STAFF_MANAGEMENT');
        $this->getJson('/api/v1/admin/audit-logs?search=ada')->assertOk()
            ->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.username', 'demo-admin')
            ->assertJsonPath('data.0.user.name', 'Ada Demo Administrator');
        $this->getJson('/api/v1/admin/audit-logs?search=Unmatched')->assertOk()->assertJsonPath('meta.total', 0);
    }

    public function test_user_search_status_filters_and_pagination(): void
    {
        User::create([
            'name' => 'Suspended Operator',
            'username' => 'operator',
            'email' => 'operator@example.test',
            'password' => bcrypt('test-password'),
            'role_id' => 1,
            'status' => 'suspended',
        ]);
        $this->getJson('/api/v1/admin/users?status=suspended&search=suspended&per_page=10')->assertOk()
            ->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.username', 'operator');
        $this->getJson('/api/v1/admin/users?per_page=1&page=2')->assertOk()
            ->assertJsonPath('data.total', 2)->assertJsonPath('data.current_page', 2)->assertJsonCount(1, 'data.data');
    }

    public function test_auditing_uses_trusted_proxy_ip_and_ignores_untrusted_forwarded_headers(): void
    {
        foreach (
            [
                ['127.0.0.1', '192.168.1.44', '192.168.1.44'],
                ['::1', '2001:db8::123', '2001:db8::123'],
                ['203.0.113.25', '198.51.100.99', '203.0.113.25'],
                ['127.0.0.1', '198.51.100.99, 192.168.1.44', '192.168.1.44'],
            ] as [$remote, $forwarded, $expected]
        ) {
            $request = Request::create('/api/v1/staff', 'POST', [], [], [], [
                'REMOTE_ADDR' => $remote,
                'HTTP_X_FORWARDED_FOR' => $forwarded,
            ]);
            $this->app->instance('request', $request);
            \Illuminate\Support\Facades\Request::clearResolvedInstance('request');
            (new TrustProxies)->handle($request, function () use ($expected) {
                AuditLogService::log('IP_CHECK', 'TEST');
                $this->assertSame($expected, AuditLog::latest('id')->first()->ip_address);
                return new Response;
            });
        }
    }
}
