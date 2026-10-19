<?php

use Illuminate\Support\Facades\Route;

Route::get("/", function () {
    $spaIndex = public_path('build/index.html');

    if (is_file($spaIndex)) {
        return response()->file($spaIndex);
    }

    return response()->json(["system" => "BIT-HRMS API", "status" => "active"]);
});
