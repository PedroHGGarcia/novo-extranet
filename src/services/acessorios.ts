import pb from '@/lib/pocketbase/client'
import { Versao } from './produtos'

export interface Acessorio {
  id: string
  nome: string
  tipo: 'Opcional' | 'Standard' | 'Opcional Standard'
  moeda?: string
  valor?: number
  fator_nac?: number
  status: 'Ativo' | 'Inativo'
  versoes?: string[]
  valor_anterior?: number
  data_ultimo_reajuste?: string
  atualizado_por?: string
  created: string
  updated: string
  expand?: {
    versoes?: Versao[]
    atualizado_por?: { name: string; email: string }
  }
}

export const getAcessorios = () =>
  pb
    .collection('acessorios')
    .getFullList<Acessorio>({ sort: '-created', expand: 'versoes,atualizado_por' })
export const createAcessorio = (data: Partial<Acessorio>) =>
  pb.collection('acessorios').create(data)
export const updateAcessorio = (id: string, data: Partial<Acessorio>) =>
  pb.collection('acessorios').update(id, data)
export const deleteAcessorio = (id: string) => pb.collection('acessorios').delete(id)
