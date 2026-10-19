# System Architecture Specification

## Architectural Overview
The **BIT-HRMS** application is designed around a clean 4-tier enterprise architecture separating UI presentation, API gateway routing, domain service logic, and database persistence.

```
React Frontend (Vite SPA) 
       │
       ▼ (HTTPS / JSON REST API)
Laravel REST API Controllers
       │
       ▼ (Form Requests & Policies)
Domain & Service Layer (StaffService, AuditLogService, DataImportService)
       │
       ▼ (Eloquent ORM & Migrations)
Relational Storage (MySQL 8.0+ / PostgreSQL 15+)
```

---

## Key Design Principles
1. **Strict Version 1 Scope Discipline**: Core foundation focusing on Nominal Roll + Directory + RBAC + Organisation Structure + Audit Log + Import/Export.
2. **Normalized Relational Schema**: Department, Designation, Grade Level (GL 01–17), Cadre, and Employment Status entities are fully relational, enabling SQL indexing, filtering, and server-side pagination.
3. **Career History Tracking**: Department transfers (`staff_department_history`) and status changes (`staff_status_history`) append historical movement records rather than overwriting.
4. **Government HR Regulations**: Automatic retirement calculation based on `min(DOB + 60 Years, DOFA + 35 Years)`.
5. **NDPC Privacy Compliance**: Personal contact data (address, phone, DOB, LGA) are permission-scoped and filtered via `StaffResource`.
