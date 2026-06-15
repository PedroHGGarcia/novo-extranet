import pb from '@/lib/pocketbase/client'

export interface CategoriaProduto {
  id: string
  nome: string
  logo?: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
}

export interface Marca {
  id: string
  nome: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
}

export interface Produto {
  id: string
  nome: string
  categoria: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
  expand?: {
    categoria?: CategoriaProduto
  }
}

export const getCategorias = () =>
  pb.collection('categorias_produtos').getFullList<CategoriaProduto>({ sort: '-created' })
export const createCategoria = (data: FormData | Partial<CategoriaProduto>) =>
  pb.collection('categorias_produtos').create(data)
export const updateCategoria = (id: string, data: FormData | Partial<CategoriaProduto>) =>
  pb.collection('categorias_produtos').update(id, data)
export const deleteCategoria = (id: string) => pb.collection('categorias_produtos').delete(id)
export const getCategoriaLogoUrl = (record: CategoriaProduto) => {
  if (!record.logo) return null
  return pb.files.getURL(record, record.logo)
}

export const getMarcas = () => pb.collection('marcas').getFullList<Marca>({ sort: '-created' })
export const createMarca = (data: Partial<Marca>) => pb.collection('marcas').create(data)
export const updateMarca = (id: string, data: Partial<Marca>) =>
  pb.collection('marcas').update(id, data)
export const deleteMarca = (id: string) => pb.collection('marcas').delete(id)

export const getProdutos = () =>
  pb.collection('produtos').getFullList<Produto>({ sort: '-created', expand: 'categoria' })
export const createProduto = (data: Partial<Produto>) => pb.collection('produtos').create(data)
export const updateProduto = (id: string, data: Partial<Produto>) =>
  pb.collection('produtos').update(id, data)
export const deleteProduto = (id: string) => pb.collection('produtos').delete(id)
