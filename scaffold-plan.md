# DOT IT Agency Portal — Scaffold Plan

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (auth + DB + storage)
- Stripe (invoices)
- Resend (email)

## Supabase Project
- URL: https://btxfsouofjhidjfosljc.supabase.co
- Anon key: TBD (waiting from Oleg)

## Hostinger
- Temp domain: beige-cod-855308.hostingersite.com
- GitHub repo: https://github.com/Galatoleg18/agency-portal

## Pages Structure
/app
  /(auth)
    /login
    /forgot-password
  /(dashboard)
    /dashboard          — admin overview
    /clients            — client list
    /clients/[id]       — client detail
    /projects           — all projects
    /projects/[id]      — project detail
    /projects/[id]/tasks
    /projects/[id]/files
    /projects/[id]/messages
    /invoices
    /invoices/[id]
    /settings
  /(client)
    /portal             — client dashboard (their projects only)
    /portal/[projectId] — client project view
    /portal/[projectId]/files
    /portal/[projectId]/messages

## DB Tables
- profiles (id, email, role: admin|client|team, full_name, avatar_url, company)
- clients (id, name, logo_url, primary_email, phone, address, created_by)
- projects (id, client_id, name, description, status, start_date, due_date, created_by)
- phases (id, project_id, name, order_index, status, completion_pct)
- tasks (id, phase_id, title, description, assignee_id, due_date, completed, priority)
- deliverables (id, phase_id, title, description, file_url, version, status: pending|approved|changes_requested)
- comments (id, project_id, deliverable_id, user_id, body, created_at)
- invoices (id, project_id, client_id, amount_cents, status, stripe_payment_intent_id, due_date, paid_at)
- invoice_items (id, invoice_id, description, quantity, unit_price_cents)
