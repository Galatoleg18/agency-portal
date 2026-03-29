import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const like = `%${q}%`

  const [
    { data: projects },
    { data: clients },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('projects').select('id, name, status, clients(name)').ilike('name', like).limit(5),
    supabase.from('clients').select('id, name, email, company').or(`name.ilike.${like},email.ilike.${like},company.ilike.${like}`).limit(5),
    supabase.from('invoices').select('id, title, amount, status').ilike('title', like).limit(5),
  ])

  const results = [
    ...(projects ?? []).map((p: any) => ({
      type: 'project', id: p.id, title: p.name,
      subtitle: (p.clients as any)?.[0]?.name ?? 'No client',
      status: p.status, href: `/projects/${p.id}`,
    })),
    ...(clients ?? []).map((c: any) => ({
      type: 'client', id: c.id, title: c.name,
      subtitle: c.company ?? c.email,
      href: `/clients`,
    })),
    ...(invoices ?? []).map((i: any) => ({
      type: 'invoice', id: i.id, title: i.title,
      subtitle: `$${i.amount} · ${i.status}`,
      status: i.status, href: `/invoices`,
    })),
  ]

  return NextResponse.json({ results })
}
