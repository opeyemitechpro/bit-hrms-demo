<?php

return [
    'agency' => [
        'name' => env('AGENCY_NAME', 'Bureau of Information Technology'),
        'government' => env('GOVERNMENT_NAME', 'Ogun State Government, Nigeria'),
    ],
    'pagination' => ['default_per_page' => 15],
    'retirement' => ['max_age_years' => 60, 'max_service_years' => 35],
];
