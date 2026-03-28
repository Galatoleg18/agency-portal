# DOT IT Agency Portal

A client-facing project management portal for DOT IT web development agency. Built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- 🔐 **Auth** — email/password login via Supabase Auth
- 👤 **Admin dashboard** — manage clients, projects, phases, tasks, invoices
- 📊 **Project tracker** — phases with progress bars, tasks, deliverables
- ✅ **Client approval** — clients approve/reject deliverables from their portal
- 💬 **Comments** — per-project messaging between team and client
- 🧾 **Invoices** — track billing status per project
- 🏠 **Client portal** — clients see only their own projects

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Icons**: lucide-react
- **Hosting**: Hostinger Node.js / Vercel

## Setup

### 1. Install dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr lucide-react clsx tailwind-merge
```

### 2. Environment variables

Copy `.env.local` — already configured with your Supabase project.

### 3. Set up the database

1. Go to your Supabase dashboard → **SQL Editor**
2. Open `supabase/schema.sql`
3. Paste the entire contents and click **Run**

### 4. Create your admin user

1. Go to Supabase → **Authentication → Users → Add user**
2. Enter your email + password
3. Go to **Table Editor → profiles**
4. Find your user and set `role` to `admin`

### 5. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` → redirects to `/login`

### 6. Deploy

Push to GitHub → Hostinger auto-deploys from the `main` branch.

Add environment variables in Hostinger dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## Project Structure

```
src/
  app/
    login/              — Login page
    auth/callback/      — Supabase auth callback
    (dashboard)/        — Admin routes (protected)
      dashboard/        — Overview stats
      clients/          — Client management
      projects/         — Project list + detail
      invoices/         — Invoice tracking
      settings/         — Settings
    (client)/           — Client portal routes
      portal/           — Client project list
      portal/[id]/      — Client project detail
  components/           — Shared components
  lib/supabase/         — Supabase client helpers
  middleware.ts         — Route protection
supabase/
  schema.sql            — Full database schema + RLS policies
```

## Roles

| Role | Access |
|------|--------|
| `admin` | Full access to all data |
| `client` | Own projects, portal only |
| `team` | Projects they're assigned to |

## Adding a Client

1. Admin logs in → Clients → Add Client
2. Fill in name, email, company
3. Create a project and assign to the client
4. Invite the client via Supabase Auth (Authentication → Users → Invite)
5. Client logs in → sees their portal at `/portal`
