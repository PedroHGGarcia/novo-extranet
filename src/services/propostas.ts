import pb from '@/lib/pocketbase/client'

export interface Proposta {
  id: string
  numero_proposta: string
  revisao?: string
  cliente: string
  contato: string
  telefone: string
  versao: string
  representante: string
  gerente?: string
  moeda?: string
  valor_sem_desconto?: number
  valor_atual?: number
  valor_final?: number
  prazo_entrega?: string
  condicoes_pagamento?: string
  acessorios_proposta?: any
  nota_rep: number
  dt_cad: string
  user: string
  created: string
  updated: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string }
    versao?: { nome: string }
    representante?: { fantasia: string; sigla?: string }
    gerente?: { nome: string }
    user?: { name: string }
  }
}

export const getPropostasPaginated = async (page = 1, perPage = 50) => {
  return pb.collection('propostas').getList<Proposta>(page, perPage, {
    sort: '-created',
    expand: 'cliente,versao,representante,gerente,user',
  })
}

export const getProposta = async (id: string) => {
  return pb.collection('propostas').getOne<Proposta>(id, {
    expand: 'cliente,versao,representante,gerente,user',
  })
}

export const updateProposta = async (id: string, data: Partial<Proposta>) => {
  return pb.collection('propostas').update<Proposta>(id, data)
}
