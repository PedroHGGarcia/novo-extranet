import pb from '@/lib/pocketbase/client'

export interface PreferenciaTabela {
  id: string
  user: string
  tabela_id: string
  colunas_visiveis: string[]
  created: string
  updated: string
}

export const getPreferenciasTabela = async (tabela_id: string, userId: string) => {
  try {
    const records = await pb.collection('preferencias_tabela').getFullList<PreferenciaTabela>({
      filter: `user = "${userId}" && tabela_id = "${tabela_id}"`,
    })
    return records[0] || null
  } catch {
    return null
  }
}

export const savePreferenciasTabela = async (
  tabela_id: string,
  userId: string,
  colunas_visiveis: string[],
  existingId?: string,
) => {
  const data = { user: userId, tabela_id, colunas_visiveis }
  if (existingId) {
    return await pb.collection('preferencias_tabela').update<PreferenciaTabela>(existingId, data)
  } else {
    return await pb.collection('preferencias_tabela').create<PreferenciaTabela>(data)
  }
}
