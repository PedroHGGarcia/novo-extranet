import pb from '@/lib/pocketbase/client'

export async function fetchEmailSuggestions(): Promise<string[]> {
  const emails = new Set<string>()

  const currentEmail = pb.authStore.record?.email

  try {
    const users = await pb.collection('users').getFullList({ fields: 'email' })
    users.forEach((u: any) => {
      if (u.email && u.email !== currentEmail) emails.add(u.email)
    })
  } catch {
    /* intentionally ignored */
  }

  try {
    const clientes = await pb.collection('clientes').getFullList({ fields: 'email,email_fiscal' })
    clientes.forEach((c: any) => {
      if (c.email) emails.add(c.email)
      if (c.email_fiscal) emails.add(c.email_fiscal)
    })
  } catch {
    /* intentionally ignored */
  }

  try {
    const prepostos = await pb.collection('prepostos').getFullList({ fields: 'email' })
    prepostos.forEach((p: any) => {
      if (p.email) emails.add(p.email)
    })
  } catch {
    /* intentionally ignored */
  }

  try {
    const gerentes = await pb.collection('gerentes').getFullList({ fields: 'email' })
    gerentes.forEach((g: any) => {
      if (g.email) emails.add(g.email)
    })
  } catch {
    /* intentionally ignored */
  }

  try {
    const reps = await pb.collection('representantes').getFullList({ fields: 'emails' })
    reps.forEach((r: any) => {
      if (r.emails) {
        r.emails
          .split(/[\n,;]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
          .forEach((s: string) => emails.add(s))
      }
    })
  } catch {
    /* intentionally ignored */
  }

  return Array.from(emails).sort()
}
