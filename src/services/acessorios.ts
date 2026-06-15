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
  created: string
  updated: string
  expand?: {
    versoes?: Versao[]
  }
}

export const getAcessorios = () =>
  pb.collection('acessorios').getFullList<Acessorio>({ sort: '-created', expand: 'versoes' })
export const createAcessorio = (data: Partial<Acessorio>) =>
  pb.collection('acessorios').create(data)
export const updateAcessorio = (id: string, data: Partial<Acessorio>) =>
  pb.collection('acessorios').update(id, data)
export const deleteAcessorio = (id: string) => pb.collection('acessorios').delete(id)
