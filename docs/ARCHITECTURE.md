# Complete System Architecture & DFIR Dataflow

```
┌─────────────────────────────────────────────────────────────┐
│                    PHYSICAL ANDROID DEVICE                   │
│   (USB Debugging Enabled + Kotlin Companion Agent App)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ USB Cable / ADB Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      ANDROID DEBUG BRIDGE                    │
│      (C:\...\platform-tools\adb.exe - Version 1.0.41)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ child_process.execFile (Allowlisted args)
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

## Security Design Tenets
1. **Defensive Non-Invasive Forensics**: No screen-lock bypasses, no root exploits, no stealth backdoors.
2. **Explicit Consent & Android Permission Compliance**: Requests runtime permissions cleanly via official APIs.
3. **Data Minimization & Privacy**: Masked serials, zero SMS logging in audit trails, configurable purge retention windows.
