import pb from '@/lib/pocketbase/client'

export interface Projeto {
  id: string
  nome: string
  descricao?: string
  cliente: string
  status: string
  user?: string
  ooo?: string
  created: string
  updated: string
  expand?: {
    cliente?: { fantasia: string; razao_social?: string }
    user?: { name: string; id: string }
  }
}

export const getProjetosPaginated = (page = 1, perPage = 50, filter = '', sort = '-created') =>
  pb.collection('projetos').getList<Projeto>(page, perPage, {
    sort,
    filter,
    expand: 'cliente,user',
  })

export const getProjeto = (id: string) =>
  pb.collection('projetos').getOne<Projeto>(id, { expand: 'cliente,user' })

export const createProjeto = (data: Partial<Projeto>) =>
  pb.collection('projetos').create<Projeto>(data)

export const updateProjeto = (id: string, data: Partial<Projeto>) =>
  pb.collection('projetos').update<Projeto>(id, data)

export const deleteProjeto = (id: string) => pb.collection('projetos').delete(id)
