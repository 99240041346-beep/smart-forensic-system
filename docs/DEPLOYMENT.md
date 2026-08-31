# Deployment Architecture

## Local Forensic Station vs Cloud Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│                 CLOUD DASHBOARD / VERCEL                     │
│                (Next.js Web Frontend UI)                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Secure WebSocket
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 INVESTIGATOR LOCAL WORKSTATION               │
│                (Node.js Local Forensic Agent)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ child_process.execFile (USB/TCP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      LOCAL ADB DAEMON                        │
│                 (adb.exe on Windows / Linux)                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Physical USB Connection
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    TARGET ANDROID DEVICE                     │
└─────────────────────────────────────────────────────────────┘
```

> **Why ADB cannot run directly inside Vercel Serverless Functions:**
> ADB requires direct access to physical USB hardware drivers and socket connections to local ADB daemon instances. The web dashboard can be hosted in the cloud or locally, communicating with the investigator's Local Forensic Agent daemon running on `localhost:3001` (or a local network forensic server).
