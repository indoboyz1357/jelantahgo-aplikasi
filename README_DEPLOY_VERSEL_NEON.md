# Deploy: Vercel + Neon + GitHub (Auto)

This repo is ready for fully-automatic deploys using:
- Vercel (Next.js hosting, free tier)
- Neon (Postgres, free tier) using pooled connection string
- GitHub (CI/CD) via GitHub Actions for Prisma Migrate

## One-time Setup

1) Create Neon Postgres
- Create a project and database atooled connection string and copy it (required for serverless)
- Example: `postgresql://user:pass@ep-xxxx-pooler.us-east-2.aws.neon.tech/db?sslmode=require`

2) GitHub Secrets (repo settings)
- DATABASE_URL = your Neon pooled connection string
- VERCEL_DEPLOY_HOOK_URL = optional (create a Deploy Hook in Vercel Project Settings)

3) Vercel Project
- Import this repo into Vercel
- Project Settings → Environment Variables:
  - DATABASE_URL (same as above)
  - JWT_SECRET (strong secret)
  - NODE_ENV = production
  - NEXT_PUBLIC_API_URL = your Vercel domain or custom domain

4) First Deployment Flow
- Push to `main` → GitHub Action runs `prisma migrate deploy` to Neon
- Vercel builds and deploys automatically
- If using Deploy Hook, the Action will trigger it explicitly after migrate

## Notes
- Prisma schema is set to PostgreSQL
- Postinstall runs `prisma generate`
- If you need seed data, run locally against Neon: `DATABASE_URL=... npm run db:seed`
- Consider Prisma Accelerate or Neon pooling for better connection stability
