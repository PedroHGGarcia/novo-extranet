import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase/client', () => {
  const mockCollection = {
    getFullList: vi.fn(),
    getList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return {
    default: { collection: vi.fn(() => mockCollection), filter: vi.fn((s: string, p: any) => s) },
  }
})

import pb from '@/lib/pocketbase/client'
import {
  getCategorias,
  createCategoria,
  getMarcas,
  getProdutos,
  createProduto,
} from '@/services/produtos'

describe('Produtos Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch categorias', async () => {
    const mockData = [{ id: '1', nome: 'Equipamentos' }]
    vi.mocked(pb.collection('categorias_produtos').getFullList).mockResolvedValue(mockData as any)

    const result = await getCategorias()
    expect(result).toHaveLength(1)
    expect(result[0].nome).toBe('Equipamentos')
  })

  it('should create categoria', async () => {
    vi.mocked(pb.collection('categorias_produtos').create).mockResolvedValue({
      id: '1',
      nome: 'Nova',
    } as any)

    const result = await createCategoria({ nome: 'Nova', status: 'Ativo' })
    expect(result.id).toBe('1')
  })

  it('should fetch marcas', async () => {
    vi.mocked(pb.collection('marcas').getFullList).mockResolvedValue([
      { id: '1', nome: 'Bener' },
    ] as any)

    const result = await getMarcas()
    expect(result[0].nome).toBe('Bener')
  })

  it('should fetch produtos with expand', async () => {
    vi.mocked(pb.collection('produtos').getFullList).mockResolvedValue([
      { id: '1', nome: 'Produto A', expand: { categoria: { nome: 'Cat' } } },
    ] as any)

    const result = await getProdutos()
    expect(result[0].expand?.categoria?.nome).toBe('Cat')
  })

  it('should create produto', async () => {
    vi.mocked(pb.collection('produtos').create).mockResolvedValue({
      id: '1',
      nome: 'Novo Produto',
    } as any)

    const result = await createProduto({ nome: 'Novo Produto', categoria: 'cat1', status: 'Ativo' })
    expect(result.nome).toBe('Novo Produto')
  })
})
