# GitHub Setup & CI/CD Workflow

## 1. Initializing Git & Pushing to GitHub

```bash
# Initialize git repository
git init

# Stage all files
git add .

# Initial commit
git commit -m "feat: complete smart android forensic and security analysis system"

# Add remote
git remote add origin https://github.com/<YOUR_USERNAME>/smart-forensic-system.git

# Push to main branch
git branch -M main
git push -u origin main
```

---

## 2. GitHub Actions CI Pipeline

The repository includes `.github/workflows/ci.yml` which automatically:
- Installs monorepo dependencies.
- Builds all workspace packages (`@smart-forensic/shared`, `@smart-forensic/security-engine`, `@smart-forensic/database`, `@smart-forensic/adb-client`, `@smart-forensic/forensic-plugins`).
- Runs Prisma schema validation and migration push.
- Executes automated heuristic scoring unit tests.
- Builds the API server and Next.js frontend with 0 type errors.
