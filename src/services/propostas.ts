import pb from '@/lib/pocketbase/client'

export interface Proposta {
  id: string
  numero_proposta: string
  cliente: string
  contato: string
  telefone: string
  versao: string
  representante: string
  nota_rep: number
  dt_cad: string
  user: string
  created: string
  updated: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string }
    versao?: { nome: string }
    representante?: { fantasia: string; sigla?: string }
    user?: { name: string }
  }
}

export const getPropostasPaginated = async (page = 1, perPage = 50) => {
  return pb.collection('propostas').getList<Proposta>(page, perPage, {
    sort: '-created',
    expand: 'cliente,versao,representante,user',
  })
}
