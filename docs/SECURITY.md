# Cybersecurity & NDPC Privacy Specification

## Data Protection Principles
In accordance with the **Nigeria Data Protection Commission (NDPC)** regulations and Ogun State Government cybersecurity standards, the BIT-HRMS enforces:

1. **Purpose Limitation & Minimisation**: Only employee data approved by official public service authority is collected.
2. **Field-Level Access Control**: Sensitive fields (`residential_address`, `phone_number`, `personal_email`, `date_of_birth`) are restricted to authorized HR Officers and Super Administrators.
3. **Password Security**: Standard passwords hashed with Argon2id / Bcrypt. Plaintext passwords are never stored or returned in API responses.
4. **Immutable Audit Logging**: Administrative write operations generate append-only logs in `audit_logs` storing actor, action, timestamp, IP address, and JSON diffs.

---

## Security Middleware Headers
All HTTP responses enforce:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
