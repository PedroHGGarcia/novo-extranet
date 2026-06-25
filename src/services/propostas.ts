import pb from '@/lib/pocketbase/client'
import type { TipoProposta } from './tipos-propostas'

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
  percentual_desconto?: number
  valor_atual?: number
  valor_final?: number
  prazo_entrega?: string
  condicoes_pagamento?: string
  acessorios_proposta?: any
  cliente_original?: string
  versao_original?: string
  representante_original?: string
  gerente_original?: string
  nota_rep: number
  dt_cad: string
  user: string
  tipo_proposta?: string
  created: string
  updated: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string }
    versao?: { nome: string }
    representante?: { fantasia: string; sigla?: string }
    gerente?: { nome: string }
    user?: { name: string }
    tipo_proposta?: TipoProposta
  }
}

export const getPropostasPaginated = async (page = 1, perPage = 50, sort = '-created') => {
  return pb.collection('propostas').getList<Proposta>(page, perPage, {
    sort,
    expand: 'cliente,versao,representante,gerente,user,tipo_proposta',
  })
}

export const getProposta = async (id: string) => {
  return pb.collection('propostas').getOne<Proposta>(id, {
    expand: 'cliente,versao,representante,gerente,user,tipo_proposta',
  })
}

export const updateProposta = async (id: string, data: Partial<Proposta>) => {
  return pb.collection('propostas').update<Proposta>(id, data)
}
