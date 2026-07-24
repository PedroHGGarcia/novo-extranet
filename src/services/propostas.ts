import pb from '@/lib/pocketbase/client'
import type { TipoProposta } from './tipos-propostas'

export interface Proposta {
  id: string
  numero_proposta: string
  revisao?: string
  cliente: string
  modelo_licitacao?: boolean
  descricao_proposta?: string
  especificacoes_tecnicas?: string
  materiais_utilizados?: string
  certificacoes?: string
  normas_aplicaveis?: string
  certificacoes_seguranca?: string
  normas_seguranca?: string
  cobertura_garantia?: string
  assistencia_tecnica_detalhada?: string
  criterios_aceitacao?: string
  garantia_acessorios?: string
  validade_oferta?: string
  secoes_adicionais?: Array<{ titulo: string; descricao: string; imagem?: string }>
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
  projeto?: string
  status?: string
  data_alteracao_status?: string
  created: string
  updated: string
  ultimo_usuario_status?: string
  assinatura_cliente?: string
  assinatura_representante?: string
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
    gerente?: {
      nome: string
      usuario?: string
      expand?: { usuario?: { id: string; name: string; assinatura?: string } }
    }
    user?: { name: string; assinatura?: string; id: string }
    tipo_proposta?: TipoProposta
    ultimo_usuario_status?: { name: string; email: string; id: string }
    projeto?: { id: string; nome: string; status?: string }
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
      'cliente,versao.modelo.marca,versao.modelo.produto.categoria,representante,gerente.usuario,user,tipo_proposta,ultimo_usuario_status,projeto',
  })
}

export const getProposta = async (id: string) => {
  return pb.collection('propostas').getOne<Proposta>(id, {
    expand:
      'cliente,versao.modelo.marca,versao.modelo.produto.categoria,representante,gerente.usuario,user,tipo_proposta,ultimo_usuario_status,projeto',
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

const getNextRevision = (current?: string): string => {
  if (!current || current === 'A') return 'B'
  if (current === 'Z') return 'AA'
  return String.fromCharCode(current.charCodeAt(0) + 1)
}

export const createPropostaRevision = async (id: string): Promise<Proposta> => {
  const original = await pb.collection('propostas').getOne<Proposta>(id)

  const currentRev = original.revisao || 'A'
  const nextRev = getNextRevision(currentRev)
  const numPart = original.numero_proposta.split('-')[0]

  const excludeFields = new Set([
    'id',
    'created',
    'updated',
    'collectionId',
    'collectionName',
    'expand',
    'assinatura_cliente',
    'assinatura_representante',
    'numero_proposta',
    'revisao',
    'status',
    'data_alteracao_status',
    'ultimo_usuario_status',
  ])

  const cloneData: Record<string, any> = {}
  for (const [key, value] of Object.entries(original)) {
    if (!excludeFields.has(key) && value !== undefined && value !== null) {
      cloneData[key] = value
    }
  }

  cloneData.numero_proposta = `${numPart}-${nextRev}`
  cloneData.revisao = nextRev
  cloneData.status = 'Em Análise'

  return pb.collection('propostas').create<Proposta>(cloneData)
}

export const getUnlinkedPropostasPaginated = async (query: string, page: number) => {
  const perPage = 20
  const baseFilter = '(projeto = "" || projeto = null)'
  const escapedQuery = query.replace(/"/g, '\\"')
  const filter = query.trim()
    ? `${baseFilter} && (numero_proposta ~ "${escapedQuery}" || cliente.fantasia ~ "${escapedQuery}")`
    : baseFilter
  const res = await pb.collection('propostas').getList(page, perPage, {
    filter,
    expand: 'cliente',
    sort: '-created',
  })
  return {
    items: res.items as Proposta[],
    hasMore: res.page * res.perPage < res.totalItems,
  }
}
