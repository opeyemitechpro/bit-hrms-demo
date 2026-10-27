# Restart Recovery Checklist

Last updated: 2026-10-27.

## Current Blocker

`bootstrap/app.php` is missing on disk. Its contents remained visible in VS Code, but both editor patching and file creation failed to persist it. The user confirmed that files cannot currently be created in `bootstrap` and plans to restart Windows. Do not retry writing into that folder until the user confirms the issue is resolved.

The recovery copy is [recovery/laravel-bootstrap-app.php](recovery/laravel-bootstrap-app.php). It preserves the editor contents, including trusted proxies, security headers, role middleware, routing, and JSON authentication errors. This is a recovery copy only: its relative paths are correct only after restoring it to `bootstrap/app.php`. Do not execute it from the recovery directory.

## Verified Work

- [x] Light/dark controls exist on sign-in and the authenticated header.
- [x] With no saved override, theme follows the device; live device-theme changes are tracked.
- [x] An explicit light/dark choice persists after reload; Use device theme removes that override.
- [x] Sidebar is fixed independently of the main page. Security and Sign Out remain visible at desktop heights of 768, 650, and 600 pixels. Core navigation fits without scrolling at those heights with Future Modules collapsed.
- [x] Staff creation validates duplicate Ogun employee numbers instead of passing them to a unique database constraint.
- [x] Staff creation applies existing title and station defaults when optional blank values become null.
- [x] The staff modal displays field-validation and general save errors without clearing entered data.
- [x] Browser checks with isolated fictional responses confirmed duplicate-number feedback (422), retained inputs and a visible server-error summary (500), and modal closure with success feedback (201). No real database records were written by these browser checks.
- [x] Before the bootstrap disappeared during verification, `php vendor/bin/phpunit tests/Feature` passed: 12 tests, 89 assertions. This includes valid staff creation, audit insertion, duplicate validation, and optional blank defaults using in-memory SQLite.
- [x] `npm run build` passed during this verification.

## Database Findings

The configured connection is PostgreSQL at `127.0.0.1:5433`. A read-only connection check failed before the bootstrap disappeared; the reason has not been conclusively identified. The Windows `postgresql-x64-18` service was running and TCP ports 5432 and 5433 accepted connections. Do not assume the service is stopped, change ports, reset credentials, create a replacement database, or run destructive migrations. Verify the configured database and credentials without printing secrets after restoring the bootstrap.

## Resume In Order

1. Confirm with the user that Windows was restarted and the bootstrap folder is writable. Inspect existing working-tree changes; do not revert unrelated work.
2. Check whether `bootstrap/app.php` has already been restored. If it exists, compare it with the recovery copy and preserve any newer user changes. If still absent, restore the recovery copy from the repository root using PowerShell:

   ```powershell
   Copy-Item .\docs\recovery\laravel-bootstrap-app.php .\bootstrap\app.php
   ```

3. Confirm the file exists on disk, then run `php -l bootstrap/app.php` and `php vendor/bin/phpunit tests/Feature`.
4. Bootstrap Laravel and run a read-only `select 1` database connection check. Report a sanitized failure category only. Check migration/table availability once the connection succeeds. Do not expose `.env` secrets or run `migrate:fresh`.
5. Start or reuse Laravel on port 8000 and Vite on port 5173. The frontend URL is `http://localhost:5173/build/`. Respect any updated VS Code Artisan environment settings.
6. Confirm valid staff creation through the real API and UI with the user, including visible success feedback and a persisted record. Existing automated tests cover saving and duplicate/blank handling, but live PostgreSQL verification remains outstanding.
7. Recheck theme controls on sign-in and the authenticated header, and the mobile sidebar if further UI edits are needed. Do not redo already passing work unless a relevant change requires it.
8. Remove temporary browser interception/test sessions and restore the user's theme preference. Keep this recovery copy until restoration and backend verification succeed.

## Relevant Files

- Theme: [../src/components/ThemeToggle.jsx](../src/components/ThemeToggle.jsx), [../src/theme.css](../src/theme.css), [../index.html](../index.html), [../src/main.jsx](../src/main.jsx).
- Sidebar and staff form: [../src/App.jsx](../src/App.jsx).
- Staff save rules: [../app/Http/Controllers/Api/V1/StaffController.php](../app/Http/Controllers/Api/V1/StaffController.php), [../app/Services/StaffService.php](../app/Services/StaffService.php).
- Regression tests: [../tests/Feature/RecordBrowsingTest.php](../tests/Feature/RecordBrowsingTest.php).
