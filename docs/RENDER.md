# Render Deployment Guide

This guide explains deploying the **Smart Forensic System** to **Render** using Infrastructure as Code (`render.yaml`).

## 1. Blueprint Deployment

1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New > Blueprint**.
3. Select your `smart-forensic-system` repository.
4. Render will parse `render.yaml` and provision:
   - **`smart-forensic-db`**: PostgreSQL managed database.
   - **`smart-forensic-api`**: Node.js backend & API service.
   - **`smart-forensic-web`**: Next.js 14 web forensic dashboard.

---

## 2. Local Agent Connection to Render Cloud

Because ADB communicates directly with physical USB hardware drivers, the **Local Forensic Agent** runs on the investigator's PC and bridges physical devices to the cloud backend.

On your investigator workstation:
```powershell
# Set your deployed Render API URL in .env
NEXT_PUBLIC_API_URL="https://smart-forensic-api.onrender.com"

# Launch local agent
powershell .\scripts\start-agent.ps1
```
