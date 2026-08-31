# Database Architecture & PostgreSQL Configuration

The **Smart Forensic System** uses Prisma ORM with native support for both **SQLite** (instant zero-friction local development) and **PostgreSQL** (production multi-investigator deployments on Render or AWS).

## Schema Tables & Relationships

```
Users ──────< Cases ──────< Scans ──────< Applications
                            │      ├────< Contacts
                            │      ├────< SMS Messages
                            │      ├────< Running Processes
                            │      └────< Security Findings
                            └───────────< Audit Logs
```

### 1. Model Definitions
- **`User`**: Role-based access control (`ADMIN`, `INVESTIGATOR`, `VIEWER`), bcrypt password hashes.
- **`Device`**: Target Android endpoints, hardware IDs, masked serials, OS versions.
- **`Case`**: Formal investigative case files with case numbers (e.g. `CASE-2026-0001`), risk levels, tags, and investigator assignments.
- **`Scan`**: Point-in-time forensic snapshots, stage progress, and calculated security scores.
- **`AppScanRecord`**: Installed packages, APK paths, declared permissions, install origin, debuggable flags, and heuristic risk analysis.
- **`ContactRecord`**: Authorized address book records with duplicate tags.
- **`SmsRecord`**: Authorized SMS text messages with smishing risk tags.
- **`ProcessRecord`**: Running tasks, CPU %, and memory RSS.
- **`SecurityFindingRecord`**: Detailed heuristic security findings with evidence, confidence, and mitigations.
- **`AuditLog`**: Immutable chain-of-custody event log with privacy-sanitized details.
- **`SystemSetting`**: Dynamic configuration parameters (demo mode, retention windows).

---

## 2. PostgreSQL Production Setup

In Render or your cloud provider, provide:
```env
DATABASE_URL="postgresql://user:password@hostname:5432/smart_forensics?sslmode=require"
```

Apply migrations:
```bash
npx prisma migrate deploy
```
