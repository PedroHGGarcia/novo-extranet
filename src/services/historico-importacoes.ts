import pb from '@/lib/pocketbase/client'

export interface HistoricoImportacao {
  id: string
  tipo: string
  arquivo_original: string
  quantidade_registros: number
  quantidade_sucesso: number
  quantidade_erro: number
  erros: Array<{ linha: number; motivo: string }>
  status: 'concluido' | 'parcial' | 'cancelado'
  usuario: string
  created: string
  updated: string
  created_ids?: string[]
}

export interface HistoricoImportacaoPaginated {
  items: HistoricoImportacao[]
  page: number
  totalPages: number
  totalItems: number
}

export const getHistoricoImportacoes = (
  page: number = 1,
  perPage: number = 20,
  filter: string = '',
) =>
  pb.collection('historico_importacoes').getList<HistoricoImportacao>(page, perPage, {
    sort: '-created',
    filter,
    expand: 'usuario',
  })

export const getHistoricoImportacao = (id: string) =>
  pb.collection('historico_importacoes').getOne<HistoricoImportacao>(id, { expand: 'usuario' })

export const createHistoricoImportacao = (data: Partial<HistoricoImportacao>) =>
  pb.collection('historico_importacoes').create<HistoricoImportacao>(data)

export const updateHistoricoImportacao = (id: string, data: Partial<HistoricoImportacao>) =>
  pb.collection('historico_importacoes').update<HistoricoImportacao>(id, data)

export const deleteHistoricoImportacao = (id: string) =>
  pb.collection('historico_importacoes').delete(id)

export const rollbackImportacao = async (historyId: string): Promise<{ deleted: number }> => {
  const record = await getHistoricoImportacao(historyId)
  const createdIds: string[] = (record as any).created_ids || []
  let deleted = 0

  for (const id of createdIds) {
    try {
      await pb.collection(record.tipo).delete(id)
      deleted++
    } catch {
      // best-effort
    }
  }

  await updateHistoricoImportacao(historyId, { status: 'cancelado' })
  return { deleted }
}

export const isWithin24h = (created: string): boolean => {
  const createdDate = new Date(created)
  const now = new Date()
  const diff = now.getTime() - createdDate.getTime()
  return diff < 24 * 60 * 60 * 1000
}
