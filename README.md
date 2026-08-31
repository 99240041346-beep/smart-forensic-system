# Smart Android Forensic & Security Analysis System

A comprehensive, production-grade **Smart Android Forensic & Security Analysis System** that connects Android devices to a web dashboard through **ADB (Android Debug Bridge)** and displays authorized forensic/security intelligence with transparent heuristic analysis, case management, and multi-format reporting.

---

## Key Capabilities

- **Real ADB Integration**: Safe, parameterized process execution against physical devices and emulators via `adb.exe`.
- **Prominent "REFRESH ADB" Button**: Real-time device discovery, status detection (`READY`, `UNAUTHORIZED`, `OFFLINE`), and automatic hardware synchronization.
- **Transparent Heuristic Security Engine**: Explainable 0–100 risk scoring evaluating dangerous permission clustering, sideload status, debug builds, and security/testing tools without false definitive claims.
- **Authorized Artifact Collection**:
  - **Applications**: Enumerates packages, install sources, permissions, and risk levels (`SAFE`, `INFORMATIONAL`, `SUSPICIOUS`, `HIGH_RISK`, `CRITICAL`).
  - **Contacts**: Authorized address book inspection with duplicate detection.
  - **SMS Forensics**: Smishing/phishing triage and 2FA OTP solicitation analysis.
  - **Running Processes**: Legitimate non-invasive task auditing via standard ADB interfaces.
  - **Security Posture**: Verified boot state, root detection, encryption verification, and security patch age analysis.
- **Forensic Case Management & Audit Trail**: Case files, investigator assignment, notes, and tamper-evident sanitized audit logs.
- **Multi-Format Export Center**: One-click exports in **PDF** (printable court-ready dossier), **JSON** (full structured archive), and **CSV** (application & evidence spreadsheets).
- **Dedicated Demo Mode**: High-fidelity synthetic devices (Google Pixel 8 Pro & Samsung Galaxy S24 Ultra) allowing complete end-to-end testing without a physical phone plugged in.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL ANDROID DEVICE                   │
│   (USB Debugging Enabled + Kotlin Companion Agent App)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ USB / ADB Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ANDROID DEBUG BRIDGE                    │
│      (C:\...\platform-tools\adb.exe - Version 1.0.41)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ child_process.execFile (Safe args)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              LOCAL FORENSIC AGENT & BACKEND API              │
│  - AdbManager (safe execution, status & device discovery)   │
│  - Security & Heuristic Rule Engine                         │
│  - Plugin System (DeviceInfo, Apps, SMS, Contacts, etc.)    │
│  - Real-time Events (SSE / WebSocket for live scan pipeline) │
│  - Prisma ORM (Cases, Devices, Scans, Findings, Audit Logs) │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / SSE (localhost:3001)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             SMART WEB FORENSIC DASHBOARD (Next.js)           │
│  - Cybersecurity Dark Theme (Tailwind CSS, Lucide, Recharts)│
│  - "REFRESH ADB" one-click hardware discovery               │
│  - Device Dashboard, Apps Analyzer, Contacts, SMS, Processes│
│  - Heuristic Explanations, Risk Scoring (0-100), Audit Logs │
│  - JSON / CSV / PDF Forensic Case Exporter                  │
│  - Instant DEMO MODE Toggle                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start Guide (Windows)

1. **Install Root & Workspace Dependencies**:
   ```powershell
   npm install
   ```

2. **Verify Environment & ADB**:
   ```powershell
   powershell .\scripts\check-adb.ps1
   ```

3. **Start Full Stack Developer Station**:
   ```powershell
   powershell .\scripts\start-dev.ps1
   ```

4. **Access the Dashboard**:
   - Web Dashboard: **`http://localhost:3000`**
   - API & Agent: **`http://127.0.0.1:3001`**

---

## Documentation

- [Installation Guide](docs/INSTALLATION.md)
- [ADB Setup & USB Authorization](docs/ADB_SETUP.md)
- [Android Companion App Setup](docs/ANDROID_SETUP.md)
- [Development & Plugins Guide](docs/DEVELOPMENT.md)
- [Security & Compliance Policy](docs/SECURITY.md)
- [Deployment Architecture](docs/DEPLOYMENT.md)
- [REST & SSE API Reference](docs/API.md)

---

## License

Apache-2.0 License. Designed for authorized security investigations and defensive triage.
