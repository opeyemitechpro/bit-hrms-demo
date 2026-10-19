<?php

use Illuminate\Support\Facades\Route;

Route::get("/", function () {
    return response()->json(["system" => "BIT-HRMS API", "status" => "active"]);
});
