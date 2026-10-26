# Bureau of Information Technology (BIT) - HRMS
## Ogun State Government, Nigeria

Enterprise Human Resource Management System built for the Bureau of Information Technology.

### Technology Stack
- **Backend:** Laravel 12.x RESTful API
- **Frontend:** React + Tailwind CSS
- **Database:** MySQL 8.0+ / PostgreSQL 15+

### Modules Active in Version 1
1. **Nominal Roll Engine:** Filterable, searchable active staff record.
2. **Staff Directory:** Categorized profile directory.
3. **Authentication & RBAC:** Role-based access control with granular policies.
4. **Data Import & Export:** Excel/CSV row validation & printable PDF generation.
5. **Audit Logging:** Immutable append-only operation tracking.
6. **Executive Dashboard:** Aggregate statistical metrics.

---

## Quick Start for Development & Testing

### 1. Install Dependencies
```bash
# From the repository root; first create a database and configure its credentials below
cp .env.example .env
composer install --no-security-blocking
npm install --legacy-peer-deps
```

Edit `.env` and set `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` for a local MySQL or PostgreSQL database. The database must already exist and the configured account must be allowed to create tables.

### 2. Migrate & Seed Test Data
```bash
php artisan key:generate
php artisan migrate:fresh --seed
```

> `migrate:fresh` drops every table in the configured database before rebuilding it. Use only with a disposable local/test database; never run it against data you need to retain.

The seeders create test accounts. The Super Administrator test login is username `superadmin` (or email `superadmin@bit.ogunstate.gov.ng`) and password `password123`. These are test credentials; do not use them on a publicly accessible deployment.

### 3. Start Development Servers
Open two terminals at the repository root and leave each running:
```bash
php artisan serve
```

```bash
npm run dev
```

### 4. Access the Application
- **Frontend Portal:** Open http://localhost:5173 in your browser
- **BIT-HRMS API:** The API endpoints are available at http://localhost:8000/api/v1

### 5. Local Testing & Debugging
```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
```

Laravel application errors are written to `storage/logs/laravel.log`. The local `.env.example` uses file-backed sessions; if using the database session driver, the included sessions migration creates the required table.

### 7. Audit Log Search & Pagination
Audit entries record the actor's username and request IP address alongside action, module, timestamp, record reference, and change details. A separate User Name column shows the linked account's name, or "Not available" for an unavailable account. Search includes account names, usernames, IPs, actions, modules, and record references. Action quick filters, module/date filters, and adjustable pagination are available.

Staff Nominal Roll, Bureau Staff Registry, and Staff Directory Cards share server-side search, department/grade/status filters, cadre quick filters, and pagination across the entire matching dataset. Milestones, user accounts, import errors, personnel documents, and posting history also support search, relevant quick filters, and pagination. Filters reset pagination to the first matching page.

The Vite development proxy forwards the connecting client's IP, and Laravel trusts loopback proxies by default. Restart Vite and Laravel after changing proxy configuration. For a production reverse proxy, set `TRUSTED_PROXIES` to a comma-separated list of its actual IP addresses or CIDR ranges. The proxy must sanitize incoming forwarded headers and append the real connecting address. Do not trust all internet clients. IPs identify the network address visible to the trusted proxy; a client behind NAT or a VPN may share a public address. Old loopback audit entries cannot be reconstructed and are left unchanged.

### 8. Nominal Roll CSV Downloads
The Export CSV action downloads matching staff records, respecting the current text, department, and grade filters. CSV Template downloads the import template. Both requests use the logged-in API token and require an authenticated account; template access is shown to users with import permission.

### 9. Common Issues

**Login Issues:**
- Ensure `.env` file matches local settings (e.g., `DB_HOST`, `DB_DATABASE`)
- Run migrations after updating Laravel versions or application structure

**Session Expiry:**
- Switch to `database` driver in `.env` if filesystem permissions are limited
- Ensure `SESSION_SECURE_COOKIE` matches your protocol (use `false` for `http://localhost`)

**CSV download fails:**
- Sign in again if the API token has expired.
- Confirm the Apache/Nginx site routes `/api/*` requests to Laravel's `public/index.php` and that the latest frontend build and backend routes are deployed together.

---

## Support
For technical issues, consult the [Developer Setup & Workflow Guide](docs/DEVELOPMENT.md) or contact the development team.
