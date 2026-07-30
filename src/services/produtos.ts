import pb from '@/lib/pocketbase/client'
import { logAudit, getCurrentUserId } from '@/services/audit'

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
  descricao?: string
  especificacoes?: Record<string, string>
  fotos?: string[]
  created: string
  updated: string
  expand?: {
    categoria?: CategoriaProduto
  }
}

export const checkUniqueName = async (collection: string, nome: string, ignoreId?: string) => {
  try {
    const filter = ignoreId
      ? pb.filter('nome = {:nome} && id != {:id}', { nome, id: ignoreId })
      : pb.filter('nome = {:nome}', { nome })
    const result = await pb.collection(collection).getList(1, 1, { filter })
    return result.totalItems === 0
  } catch {
    return false
  }
}

export const getProdutoFotoUrl = (record: Produto, filename: string) => {
  return pb.files.getURL(record, filename)
}

export const getCategorias = () =>
  pb.collection('categorias_produtos').getFullList<CategoriaProduto>({ sort: '-created' })
export const createCategoria = async (data: FormData | Partial<CategoriaProduto>) => {
  const record = await pb.collection('categorias_produtos').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'categorias_produtos',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateCategoria = async (id: string, data: FormData | Partial<CategoriaProduto>) => {
  const record = await pb.collection('categorias_produtos').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'categorias_produtos',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteCategoria = async (id: string) => {
  const result = await pb.collection('categorias_produtos').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'categorias_produtos',
    recordId: id,
    data: {},
  })
  return result
}
export const getCategoriaLogoUrl = (record: CategoriaProduto) => {
  if (!record.logo) return null
  return pb.files.getURL(record, record.logo)
}

export const getMarcas = () => pb.collection('marcas').getFullList<Marca>({ sort: '-created' })
export const createMarca = async (data: Partial<Marca>) => {
  const record = await pb.collection('marcas').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'marcas',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateMarca = async (id: string, data: Partial<Marca>) => {
  const record = await pb.collection('marcas').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'marcas',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteMarca = async (id: string) => {
  const result = await pb.collection('marcas').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'marcas',
    recordId: id,
    data: {},
  })
  return result
}

export const getProdutos = () =>
  pb.collection('produtos').getFullList<Produto>({ sort: '-created', expand: 'categoria' })
export const createProduto = async (data: Partial<Produto> | FormData) => {
  const record = await pb.collection('produtos').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'produtos',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateProduto = async (id: string, data: Partial<Produto> | FormData) => {
  const record = await pb.collection('produtos').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'produtos',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteProduto = async (id: string) => {
  const result = await pb.collection('produtos').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'produtos',
    recordId: id,
    data: {},
  })
  return result
}

export interface Modelo {
  id: string
  nome: string
  produto: string
  marca: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
  expand?: {
    produto?: Produto
    marca?: Marca
  }
}

export interface Acessorio {
  id: string
  nome: string
  tipo: string
  moeda: string
  valor: number
  fator_nac: number
  status: 'Ativo' | 'Inativo'
  versoes: string | string[]
  versoes_new?: string | string[]
  especificacoes_tecnicas?: string
  valor_anterior?: number
  data_ultimo_reajuste?: string
  atualizado_por?: string
  created: string
  updated: string
  expand?: {
    versoes?: Versao | Versao[]
    atualizado_por?: { name: string; email: string }
  }
}

export const getAcessorios = () =>
  pb.collection('acessorios').getFullList<Acessorio>({ sort: '-created', expand: 'versoes' })

export const getAcessoriosPaginated = (page: number, perPage: number, search?: string) =>
  pb.collection('acessorios').getList<Acessorio>(page, perPage, {
    sort: '-created',
    expand: 'versoes,atualizado_por',
    filter: search ? pb.filter('nome ~ {:search}', { search }) : undefined,
  })
export const createAcessorio = async (data: Partial<Acessorio>) => {
  const record = await pb.collection('acessorios').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'acessorios',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateAcessorio = async (id: string, data: Partial<Acessorio>) => {
  const record = await pb.collection('acessorios').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'acessorios',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteAcessorio = async (id: string) => {
  const result = await pb.collection('acessorios').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'acessorios',
    recordId: id,
    data: {},
  })
  return result
}

export interface Versao {
  id: string
  modelo: string
  nome: string
  cod_erp?: string
  imagem_preview?: string
  moeda?: string
  valor?: number
  tem_fator?: boolean
  fator_nac?: number
  valor_anterior?: number
  data_ultimo_reajuste?: string

  nome_abreviado?: string
  tem_estoque?: boolean
  desconto_max_representante?: number
  desconto_max_bener?: number
  estoque_total?: number
  estoque_bloqueado?: number
  estoque_reservado?: number
  estoque_disponivel?: number
  alerta_estoque_minimo?: number
  acessorios_standards?: string
  caracteristicas_construtivas?: string
  especificacoes_tecnicas?: string
  tipos_proposta?: string[]

  atualizado_por?: string
  status: 'Ativo' | 'Inativo' | 'Fora de Linha' | 'Em Revisão' | 'Aprovado'
  created: string
  updated: string
  expand?: {
    modelo?: Modelo
    atualizado_por?: { name: string; email: string }
  }
}

export interface VersaoImagem {
  id: string
  titulo: string
  versao: string
  ordem?: number
  arquivo?: string
  status: 'Ativo' | 'Inativo'
  created: string
  updated: string
  expand?: {
    versao?: Versao
  }
}

export const getModelos = () =>
  pb.collection('modelos').getFullList<Modelo>({ sort: '-created', expand: 'produto,marca' })
export const createModelo = async (data: Partial<Modelo>) => {
  const record = await pb.collection('modelos').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'modelos',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateModelo = async (id: string, data: Partial<Modelo>) => {
  const record = await pb.collection('modelos').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'modelos',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteModelo = async (id: string) => {
  const result = await pb.collection('modelos').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'modelos',
    recordId: id,
    data: {},
  })
  return result
}

export const getVersoes = () =>
  pb
    .collection('versoes')
    .getFullList<Versao>({ sort: '-created', expand: 'modelo,atualizado_por' })
export const createVersao = async (data: Partial<Versao> | FormData) => {
  const record = await pb.collection('versoes').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'versoes',
    recordId: record.id,
    data: {},
  })
  return record
}
export const updateVersao = async (id: string, data: Partial<Versao> | FormData) => {
  const record = await pb.collection('versoes').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'versoes',
    recordId: id,
    data: {},
  })
  return record
}
export const deleteVersao = async (id: string) => {
  const result = await pb.collection('versoes').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'versoes',
    recordId: id,
    data: {},
  })
  return result
}
export const getVersaoImagemUrl = (record: Versao, filename: string) =>
  pb.files.getURL(record, filename)
