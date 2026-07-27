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
import { getPropostasPaginated, getProposta, updateProposta } from '@/services/propostas'

describe('Propostas Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch proposals paginated', async () => {
    const mockData = {
      items: [{ id: '1', numero_proposta: '001' }],
      page: 1,
      totalPages: 1,
      totalItems: 1,
    }
    vi.mocked(pb.collection('propostas').getList).mockResolvedValue(mockData as any)

    const result = await getPropostasPaginated(1, 50)
    expect(pb.collection).toHaveBeenCalledWith('propostas')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].numero_proposta).toBe('001')
  })

  it('should fetch single proposal by id', async () => {
    const mockProposta = { id: 'abc', numero_proposta: '002' }
    vi.mocked(pb.collection('propostas').getOne).mockResolvedValue(mockProposta as any)

    const result = await getProposta('abc')
    expect(result.id).toBe('abc')
    expect(result.numero_proposta).toBe('002')
  })

  it('should update proposal', async () => {
    vi.mocked(pb.collection('propostas').update).mockResolvedValue({
      id: '1',
      status: 'Aprovada',
    } as any)

    const result = await updateProposta('1', { status: 'Aprovada' })
    expect(result.status).toBe('Aprovada')
  })

  it('should handle errors on fetch', async () => {
    vi.mocked(pb.collection('propostas').getList).mockRejectedValue(new Error('Network error'))

    await expect(getPropostasPaginated()).rejects.toThrow('Network error')
  })
})
