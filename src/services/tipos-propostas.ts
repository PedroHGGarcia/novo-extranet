import pb from '@/lib/pocketbase/client'

export interface TipoProposta {
  id: string
  nome: string
  tem_fator: boolean
  status: 'Ativo' | 'Inativo'
  comissao?: number
  frase_preco?: string
  frase_comissao?: string
  prazo_entrega?: string
  condicoes_pagamento?: string
  garantia?: string
  assistencia_tecnica?: string
  treinamento_tecnico?: string
  transporte_seguro?: string
  validade_oferta?: string
  imposto_ipi?: string
  imposto_icms?: string
  formas_pagamento_selecionadas?: string[]
  acessorios_default?: Array<{ acessorio_id: string; nome: string; estado: string }>
  mostrar_pagamento_brasil?: boolean
  created: string
  updated: string
}

export const getTiposPropostaPaginated = async (
  page = 1,
  perPage = 50,
  sort = 'nome',
  filter = '',
) => {
  return pb.collection('tipos_proposta').getList<TipoProposta>(page, perPage, { sort, filter })
}

export const getTiposProposta = async () => {
  return pb.collection('tipos_proposta').getFullList<TipoProposta>({ sort: 'nome' })
}

export const getTipoProposta = async (id: string) => {
  return pb.collection('tipos_proposta').getOne<TipoProposta>(id)
}

export const createTipoProposta = async (data: Partial<TipoProposta>) => {
  return pb.collection('tipos_proposta').create<TipoProposta>(data)
}

export const updateTipoProposta = async (id: string, data: Partial<TipoProposta>) => {
  return pb.collection('tipos_proposta').update<TipoProposta>(id, data)
}

export const deleteTipoProposta = async (id: string) => {
  return pb.collection('tipos_proposta').delete(id)
}
