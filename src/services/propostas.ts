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
  status?: string
  data_alteracao_status?: string
  created: string
  updated: string
  ultimo_usuario_status?: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string }
    versao?: {
      id: string
      nome: string
      imagem_preview?: string
      expand?: {
        modelo?: {
          expand?: {
            marca?: { nome: string }
            produto?: { expand?: { categoria?: { nome: string } } }
          }
        }
      }
    }
    representante?: { fantasia: string; sigla?: string }
    gerente?: { nome: string }
    user?: { name: string; assinatura?: string; id: string }
    tipo_proposta?: TipoProposta
    ultimo_usuario_status?: { name: string; email: string; id: string }
  }
}

export const getPropostasPaginated = async (
  page = 1,
  perPage = 50,
  sort = '-created',
  filter = '',
) => {
  return pb.collection('propostas').getList<Proposta>(page, perPage, {
    sort,
    filter,
    expand:
      'cliente,versao.modelo.marca,versao.modelo.produto.categoria,representante,gerente,user,tipo_proposta,ultimo_usuario_status',
  })
}

export const getProposta = async (id: string) => {
  return pb.collection('propostas').getOne<Proposta>(id, {
    expand:
      'cliente,versao.modelo.marca,versao.modelo.produto.categoria,representante,gerente,user,tipo_proposta,ultimo_usuario_status',
  })
}

export const updateProposta = async (id: string, data: Partial<Proposta>) => {
  return pb.collection('propostas').update<Proposta>(id, data)
}

export const uploadAssinaturaCliente = async (id: string, file: Blob) => {
  const formData = new FormData()
  formData.append('assinatura_cliente', file, 'assinatura-cliente.png')
  formData.append('status', 'Aprovada')
  return pb.collection('propostas').update<Proposta>(id, formData)
}
