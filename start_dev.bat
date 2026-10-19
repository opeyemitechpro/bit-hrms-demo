@echo off
echo ========================================================
echo Starting BIT-HRMS Development Servers...
echo ========================================================
echo.
echo Launching Laravel API Backend on http://localhost:8000
start "BIT-HRMS Backend API" cmd /k "php artisan serve"

echo Launching React Frontend Portal on http://localhost:5173
start "BIT-HRMS Frontend UI" cmd /k "npm run dev"

echo.
echo Servers started successfully!
echo Open http://localhost:5173 in your browser.
echo ========================================================
