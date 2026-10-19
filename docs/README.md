# Bureau of Information Technology Human Resource Management System (BIT-HRMS)
## Master Production Documentation

Welcome to the official developer and operational documentation for the **Bureau of Information Technology Human Resource Management System (BIT-HRMS)** developed for the **Ogun State Government, Nigeria**.

---

## 📚 Documentation Index

1. [Architecture & System Design](ARCHITECTURE.md)
2. [Database ERD & Schema Specification](DATABASE.md)
3. [RESTful API Gateway Documentation](API.md)
4. [Cybersecurity & Data Privacy (NDPC) Compliance](SECURITY.md)
5. [Role-Based Access Control (RBAC) Matrix](RBAC.md)
6. [Ogun State Server Deployment Guide](DEPLOYMENT.md)
7. [Nominal Roll Data Import Template](IMPORT_TEMPLATE.md)
8. [Developer Setup & Workflow Guide](DEVELOPMENT.md)
9. [Future Modules Architectural Roadmap](FUTURE_MODULES.md)

---

## ⚡ Quick Start for Developers

```bash
# 1. Clone repository & navigate to directory
cd c:\Users\HP\Desktop\BIT_HR

# 2. Setup environment configuration
cp .env.example .env

# 3. Install PHP & Node dependencies
composer install --no-security-blocking
npm install --legacy-peer-deps

# 4. Run Key Generation & Database Migrations
php artisan key:generate
php artisan migrate:fresh --seed

# 5. Launch Development Servers
php artisan serve          # API Gateway: http://localhost:8000
npm run dev               # React Portal: http://localhost:5173
```
