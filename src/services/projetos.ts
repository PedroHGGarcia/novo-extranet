import pb from '@/lib/pocketbase/client'

export interface Projeto {
  id: string
  nome: string
  descricao?: string
  cliente: string
  status: string
  user?: string
  created: string
  updated: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string; documento?: string }
    user?: { name: string; id: string }
  }
}

export const getProjetosPaginated = (page = 1, perPage = 50, filter = '', sort = '-created') =>
  pb.collection('projetos').getList<Projeto>(page, perPage, {
    sort,
    filter,
    expand: 'cliente,user',
  })

export const getProjeto = (id: string) =>
  pb.collection('projetos').getOne<Projeto>(id, { expand: 'cliente,user' })

export const createProjeto = (data: Partial<Projeto>) =>
  pb.collection('projetos').create<Projeto>(data)

export const updateProjeto = (id: string, data: Partial<Projeto>) =>
  pb.collection('projetos').update<Projeto>(id, data)

export const deleteProjeto = (id: string) => pb.collection('projetos').delete(id)

export const getProjetosByCliente = (clienteId: string) =>
  pb.collection('projetos').getFullList<Projeto>({
    filter: `cliente = "${clienteId}" && status = "Em Andamento"`,
    sort: 'nome',
  })

export interface ProposalCount {
  total: number
  bidding: number
}

export async function getProposalCountsForProjects(
  projetoIds: string[],
): Promise<Record<string, ProposalCount>> {
  if (projetoIds.length === 0) return {}
  const result: Record<string, ProposalCount> = {}
  for (const id of projetoIds) {
    result[id] = { total: 0, bidding: 0 }
  }

  const pageSize = 500
  let page = 1
  let hasMore = true

  const idFilter = projetoIds.map((id) => `projeto = "${id}"`).join(' || ')

  while (hasMore) {
    const res = await pb.collection('propostas').getList(page, pageSize, {
      filter: `(${idFilter}) && status != 'Excluída'`,
      fields: 'id,projeto,modelo_licitacao',
    })
    for (const item of res.items as any[]) {
      const pid = typeof item.projeto === 'string' ? item.projeto : item.projeto?.id
      if (pid && result[pid]) {
        result[pid].total++
        if (item.modelo_licitacao) result[pid].bidding++
      }
    }
    hasMore = res.page * res.perPage < res.totalItems
    page++
    if (page > 50) break
  }

  return result
}

export async function updateProjetoWithPropostas(
  projetoId: string,
  data: Partial<Projeto>,
  propostaIds: string[],
  currentPropostaIds: string[],
): Promise<{ linkedCount: number; unlinkedCount: number }> {
  const toLink = propostaIds.filter((id) => !currentPropostaIds.includes(id))
  const toUnlink = currentPropostaIds.filter((id) => !propostaIds.includes(id))

  try {
    const res = await pb.send('/backend/v1/projetos/update-with-propostas', {
      method: 'PUT',
      body: JSON.stringify({
        projetoId,
        nome: data.nome,
        descricao: data.descricao || '',
        cliente: data.cliente,
        status: data.status || 'Em Andamento',
        toLink,
        toUnlink,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return { linkedCount: res.linkedCount || 0, unlinkedCount: res.unlinkedCount || 0 }
  } catch (err: any) {
    if (err?.status === 404 || err?.status === 405) {
      await updateProjeto(projetoId, data)

      const linkedIds: string[] = []
      try {
        for (const id of toLink) {
          await pb.collection('propostas').update(id, { projeto: projetoId })
          linkedIds.push(id)
        }
        for (const id of toUnlink) {
          await pb.collection('propostas').update(id, { projeto: null })
        }
      } catch (linkErr: any) {
        for (const id of linkedIds) {
          try {
            await pb.collection('propostas').update(id, { projeto: null })
          } catch {
            /* best-effort rollback */
          }
        }
        throw linkErr
      }

      return { linkedCount: linkedIds.length, unlinkedCount: toUnlink.length }
    }
    throw err
  }
}

export async function createProjetoWithPropostas(
  data: Partial<Projeto>,
  propostaIds: string[],
): Promise<{ projeto: Projeto; linkedCount: number }> {
  try {
    const res = await pb.send('/backend/v1/projetos/create-with-propostas', {
      method: 'POST',
      body: JSON.stringify({
        nome: data.nome,
        descricao: data.descricao || '',
        cliente: data.cliente,
        status: data.status || 'Em Andamento',
        propostas: propostaIds || [],
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    return { projeto: res.projeto, linkedCount: res.linkedCount || 0 }
  } catch (err: any) {
    if (err?.status === 404 || err?.status === 405) {
      const projeto = await createProjeto(data)
      if (!propostaIds || propostaIds.length === 0) return { projeto, linkedCount: 0 }

      const linkedIds: string[] = []
      try {
        for (const id of propostaIds) {
          await pb.collection('propostas').update(id, { projeto: projeto.id })
          linkedIds.push(id)
        }
      } catch (linkErr: any) {
        try {
          await pb.collection('projetos').delete(projeto.id)
        } catch {
          /* rollback failed */
        }
        throw new Error(
          'Falha ao vincular propostas ao projeto. A criação do projeto foi cancelada.',
        )
      }
      return { projeto, linkedCount: linkedIds.length }
    }
    throw err
  }
}
