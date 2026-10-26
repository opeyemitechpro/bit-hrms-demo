# Cybersecurity & NDPC Privacy Specification

## Data Protection Principles
In accordance with the **Nigeria Data Protection Commission (NDPC)** regulations and Ogun State Government cybersecurity standards, the BIT-HRMS enforces:

1. **Purpose Limitation & Minimisation**: Only employee data approved by official public service authority is collected.
2. **Field-Level Access Control**: Sensitive fields (`residential_address`, `phone_number`, `personal_email`, `date_of_birth`) are restricted to authorized HR Officers and Super Administrators.
3. **Password Security**: Standard passwords hashed with Argon2id / Bcrypt. Plaintext passwords are never stored or returned in API responses.
4. **Immutable Audit Logging**: Administrative write operations generate append-only logs in `audit_logs` storing actor, action, timestamp, IP address, and JSON diffs.

## Client IPs Behind Proxies

Laravel accepts forwarded client IPs only from `TRUSTED_PROXIES` (comma-separated IP addresses or CIDRs; default `127.0.0.1,::1`). Configure production ingress addresses explicitly. Restrict direct backend access where possible, and ensure the ingress overwrites untrusted forwarded headers or appends the actual peer address. The Vite development proxy overwrites `X-Forwarded-For` with the connecting socket address. Untrusted direct clients cannot choose the audit IP through a forged forwarded header.

Audit account names come from the linked user account and reflect its current name; missing accounts display "Not available". Previously logged loopback IPs remain unchanged because their original client addresses are unavailable.

---

## Security Middleware Headers
All HTTP responses enforce:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
