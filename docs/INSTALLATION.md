# Installation & Setup Guide

This guide walks through configuring and running the **Smart Android Forensic & Security Analysis System** on Windows.

## Prerequisites

1. **Node.js**: Version 18.x, 20.x, or 24.x (LTS recommended)
2. **Android Platform Tools (ADB)**: Available in PATH or configured via `ADB_PATH` in `.env`.
3. **PowerShell 5.1+ / 7+** (Windows environment)

---

## 1. Quick Start (Windows PowerShell)

Open PowerShell and navigate to the project directory:

```powershell
cd C:\Users\VARDHAN\.gemini\antigravity\scratch\smart-forensic-system

# 1. Install dependencies
npm install

# 2. Run the full developer stack (API on 3001, Web Dashboard on 3000)
powershell .\scripts\start-dev.ps1
```

Once started:
- Open your browser to **`http://localhost:3000`** to access the Web Forensic Dashboard.
- API and Local Agent daemon runs on **`http://127.0.0.1:3001`**.

---

## 2. Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```ini
NODE_ENV=development
PORT=3001
HOST=127.0.0.1
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-investigator-jwt-token-replace-in-prod"
LOCAL_AGENT_TOKEN="forensic-agent-token-local-auth"
ADB_PATH="C:\\Users\\VARDHAN\\Downloads\\platform-tools-latest-windows\\platform-tools\\adb.exe"
THREAT_INTELLIGENCE_API_KEY=""
THREAT_INTELLIGENCE_PROVIDER="offline_heuristics"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 3. Database Initialization

```bash
# Generate Prisma Client
npm run prisma:generate

# Push schema and create SQLite local database
npm run prisma:push

# Populate default seed cases, demo devices, and admin credentials
npm run prisma:seed --workspace=apps/api
```

Default Admin Credentials:
- **Email**: `admin@smartforensic.local`
- **Password**: `AdminPassword123!`
