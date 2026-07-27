import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase/client', () => {
  const mockCollection = {
    getList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
  return { default: { collection: vi.fn(() => mockCollection) } }
})

import pb from '@/lib/pocketbase/client'
import {
  getProjetosPaginated,
  getProjeto,
  createProjeto,
  updateProjeto,
  deleteProjeto,
} from '@/services/projetos'

describe('Projetos Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch projetos paginated', async () => {
    const mockData = {
      items: [{ id: '1', nome: 'Projeto A' }],
      page: 1,
      totalPages: 1,
      totalItems: 1,
    }
    vi.mocked(pb.collection('projetos').getList).mockResolvedValue(mockData as any)

    const result = await getProjetosPaginated(1, 50)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].nome).toBe('Projeto A')
  })

  it('should fetch single projeto', async () => {
    vi.mocked(pb.collection('projetos').getOne).mockResolvedValue({
      id: '1',
      nome: 'Projeto X',
    } as any)

    const result = await getProjeto('1')
    expect(result.nome).toBe('Projeto X')
  })

  it('should create projeto', async () => {
    vi.mocked(pb.collection('projetos').create).mockResolvedValue({
      id: '1',
      nome: 'Novo',
      status: 'Em Andamento',
    } as any)

    const result = await createProjeto({ nome: 'Novo', cliente: 'c1' })
    expect(result.id).toBe('1')
  })

  it('should update projeto status', async () => {
    vi.mocked(pb.collection('projetos').update).mockResolvedValue({
      id: '1',
      status: 'Concluído',
    } as any)

    const result = await updateProjeto('1', { status: 'Concluído' })
    expect(result.status).toBe('Concluído')
  })

  it('should delete projeto', async () => {
    vi.mocked(pb.collection('projetos').delete).mockResolvedValue(true as any)

    await deleteProjeto('1')
    expect(pb.collection('projetos').delete).toHaveBeenCalledWith('1')
  })
})
