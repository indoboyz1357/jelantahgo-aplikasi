# 🛢️ JelantahGO - Platform Daur Ulang Minyak Jelantah

JelantahGO adalah platform digital untuk mengelola pengumpulan dan daur ulang minyak jelantah dengan sistem multi-role (Customer, Courier, Warehouse, Admin) yang dilengkapi program referral dan komisi.

## ✨ Fitur Utama

### 👥 Multi-Role System
- **Customer**: Request pickup minyak jelantah, tracking status, riwayat pickup
- **Courier**: Terima dan proses pickup, kelola delivery, dapatkan komisi
- **Warehouse**: Kelola stok, verifikasi pickup, tracking inventory
- **Admin**: Dashboard lengkap, manage users, kelola sistem

### 💰 Sistem Komisi & Referral
- Komisi otomatis untuk courier setiap pickup selesai
- Program referral untuk customer dengan bonus kredit
- Tracking komisi dan pembayaran real-time

### 📱 Fitur Lengkap
- Real-time notifications
- Messaging system antar user
- Bill management & payment tracking
- Dashboard analytics
- Responsive design (mobile-friendly)

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Icons**: Lucide React

## 📋 Prerequisites

Pastikan sudah terinstall:
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

## 🔧 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd jelantahgo
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database

Buat database PostgreSQL:
```bash
createdb jelantahgo
```

Atau melalui psql:
```sql
CREATE DATABASE jelantahgo;
```

### 4. Configure Environment
Copy `.env.example` ke `.env` dan sesuaikan:
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/jelantahgo?schema=public"
JWT_SECRET="your-super-secret-key-change-this"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 5. Run Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Seed Database
```bash
npm run seed
```

### 7. Start Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

## 👤 Demo Accounts

Setelah seeding, gunakan akun berikut untuk testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jelantahgo.com | demo123 |
| Customer 1 | customer1@jelantahgo.com | demo123 |
| Customer 2 | customer2@jelantahgo.com | demo123 |
| Courier | courier@jelantahgo.com | demo123 |
| Warehouse | warehouse@jelantahgo.com | demo123 |

## 📁 Project Structure

```
jelantahgo/
├── app/
│   ├── api/                 # API Routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── pickups/        # Pickup management
│   │   ├── bills/          # Bill & payment
│   │   ├── commissions/    # Commission tracking
│   │   ├── messages/       # Messaging system
│   │   ├── notifications/  # Notifications
│   │   ├── users/          # User management (Admin)
│   │   ├── profile/        # User profile
│   │   └── dashboard/      # Dashboard stats
│   ├── login/              # Login page
│   ├── register/           # Registration page
│   └── dashboard/          # Protected dashboard (to be built)
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.js            # Database seeder
│   └── migrations/         # Migration history
├── lib/
│   ├── auth.ts            # Auth utilities
│   └── prisma.ts          # Prisma client
└── components/            # React components (to be built)
```

## 🗄️ Database Schema

### Main Tables
- **User**: Customer, Courier, Warehouse, Admin
- **Pickup**: Request pickup minyak jelantah
- **Bill**: Tagihan dan pembayaran
- **Commission**: Komisi courier & affiliate
- **Message**: Chat antar user
- **Notification**: System notifications

### Relationships
- User dapat memiliki banyak Pickup (sebagai customer/courier/warehouse)
- Pickup menghasilkan Bill dan Commission
- User dapat saling berkirim Message
- Setiap aksi penting membuat Notification

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user

### Pickups
- `GET /api/pickups` - List pickups (filtered by role)
- `POST /api/pickups` - Create pickup request
- `GET /api/pickups/[id]` - Get pickup detail
- `PATCH /api/pickups/[id]` - Update pickup status

### Bills
- `GET /api/bills` - List bills
- `PATCH /api/bills/[id]` - Update bill status (payment)

### Commissions
- `GET /api/commissions` - List commissions

### Messages
- `GET /api/messages?pickupId=xxx` - Get messages
- `POST /api/messages` - Send message

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Mark as read

### Profile
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile

### Dashboard
- `GET /api/dashboard` - Get statistics

### Users (Admin only)
- `GET /api/users` - List all users

## 🌐 Deployment (Production)

1) Switch database to PostgreSQL (done in schema)
- Set DATABASE_URL in your hosting platform (Neon/Supabase/Railway/RDS). Example:
  postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
- Run migrations on deploy: npx prisma migrate deploy

2) Environment variables
- JWT_SECRET: strong secret
- DATABASE_URL: Postgres URL
- NEXT_PUBLIC_API_URL: your production domain

3) Vercel deployment
- Connect repo → Vercel, set envs (DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_API_URL)
- Build: next build (postinstall runs prisma generate)
- Start: handled by Vercel

4) Docker deployment (Render/Railway/VM)
- docker build -t jelantahgo .
- docker run -p 3000:3000 -e DATABASE_URL=... -e JWT_SECRET=... jelantahgo

5) Prisma in production
- Use prisma migrate deploy in CI/CD before app start
- Consider connection pooling (pgbouncer/Neon pooling)

6) Seeding (optional)
- npm run db:seed with DATABASE_URL pointing to the target DB

---

## 🎯 Next Steps

Untuk melengkapi aplikasi, Anda perlu membuat:

1. **Frontend Dashboard**
