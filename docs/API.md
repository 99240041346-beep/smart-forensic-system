# REST & SSE API Reference

Base URL: `http://localhost:3001`

### 1. ADB & Hardware Discovery

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/adb/status` | Check if ADB is installed, version, and server status |
| `GET` | `/api/adb/devices` | Enumerate connected devices (physical + demo) |
| `POST` | `/api/adb/refresh` | Trigger ADB hardware discovery and refresh devices |

---

### 2. Device Inspection

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/devices` | List registered devices from database |
| `GET` | `/api/devices/:serial` | Get detailed hardware & OS specifications |
| `GET` | `/api/devices/:serial/apps` | Enumerate installed applications and risk scores |
| `GET` | `/api/devices/:serial/contacts` | Retrieve authorized contacts (with permission check) |
| `GET` | `/api/devices/:serial/sms` | Retrieve authorized SMS messages and smishing flags |
| `GET` | `/api/devices/:serial/processes`| Enumerate running processes and task CPU/memory |
| `GET` | `/api/devices/:serial/security` | Compute device security posture score and indicators |

---

### 3. Forensic Scans & Live Pipeline

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scans` | Launch full forensic acquisition pipeline for a case |
| `GET` | `/api/scans/:id` | Get complete scan details and collected artifacts |
| `GET` | `/api/scans/:id/events` | Server-Sent Events (SSE) stream for real-time progress |
| `GET` | `/api/scans/:id/findings` | Get security findings and heuristic reasons |

---

### 4. Case Management & Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cases` | List all forensic investigation cases |
| `POST` | `/api/cases` | Create a new investigation case |
| `GET` | `/api/cases/:id` | Get case file and associated scan history |
| `GET` | `/api/reports/:scanId` | Get compiled forensic dossier |
| `GET` | `/api/reports/:scanId/export/json` | Export raw forensic JSON archive |
| `GET` | `/api/reports/:scanId/export/csv` | Export application and threat finding CSV |
| `GET` | `/api/audit` | Query tamper-evident forensic audit log |
| `GET` | `/api/settings` | Query current system settings |
| `POST` | `/api/settings` | Update system configuration parameters |
