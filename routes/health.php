<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

Route::get('/health', function () {
    $health = [
        'status' => 'healthy',
        'timestamp' => now()->toISO8601String(),
        'services' => []
    ];

    $isHealthy = true;

    // Check database connection
    try {
        DB::connection()->getPdo();
        $health['services'][] = [
            'name' => 'database',
            'status' => 'healthy'
        ];
    } catch (\Exception $e) {
        $health['services'][] = [
            'name' => 'database',
            'status' => 'unhealthy',
            'error' => $e->getMessage()
        ];
        $isHealthy = false;
    }

    // Check Redis connection
    try {
        Redis::connection()->ping();
        $health['services'][] = [
            'name' => 'redis',
            'status' => 'healthy'
        ];
    } catch (\Exception $e) {
        $health['services'][] = [
            'name' => 'redis',
            'status' => 'unhealthy',
            'error' => $e->getMessage()
        ];
        $isHealthy = false;
    }

    // Check cache
    try {
        Cache::store()->put('health_check', 'ok', 1);
        $health['services'][] = [
            'name' => 'cache',
            'status' => 'healthy'
        ];
    } catch (\Exception $e) {
        $health['services'][] = [
            'name' => 'cache',
            'status' => 'unhealthy',
            'error' => $e->getMessage()
        ];
        $isHealthy = false;
    }

    // Check disk space
    try {
        $diskSpace = disk_free_space("/");
        $health['services'][] = [
            'name' => 'disk_space',
            'status' => $diskSpace > (100 * 1024 * 1024) ? 'healthy' : 'warning',
            'free_mb' => round($diskSpace / (1024 * 1024), 2)
        ];
    } catch (\Exception $e) {
        $health['services'][] = [
            'name' => 'disk_space',
            'status' => 'unknown',
            'error' => $e->getMessage()
        ];
    }

    // Return appropriate HTTP status code
    $statusCode = $isHealthy ? 200 : 503;

    return response()->json($health, $statusCode);
})->name('health');
