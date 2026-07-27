import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/pocketbase/client', () => {
  const mockCollection = {
    getList: vi.fn(),
    getFullList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getFirstListItem: vi.fn(),
    send: vi.fn(),
  }
  return { default: { collection: vi.fn(() => mockCollection) } }
})

import pb from '@/lib/pocketbase/client'
import {
  getClientesPaginated,
  createCliente,
  updateCliente,
  deleteCliente,
  getByDocumento,
} from '@/services/cadastros'

describe('Clientes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch clients paginated', async () => {
    const mockData = {
      items: [{ id: '1', fantasia: 'Cliente A' }],
      page: 1,
      totalPages: 1,
      totalItems: 1,
    }
    vi.mocked(pb.collection('clientes').getList).mockResolvedValue(mockData as any)

    const result = await getClientesPaginated(1, 50, '')
    expect(result.items).toHaveLength(1)
    expect(result.items[0].fantasia).toBe('Cliente A')
  })

  it('should create client with stripped masks', async () => {
    vi.mocked(pb.collection('clientes').create).mockResolvedValue({ id: '1' } as any)

    await createCliente({ documento: '12.345.678/0001-90', fantasia: 'Test' })
    expect(pb.collection('clientes').create).toHaveBeenCalledWith(
      expect.objectContaining({ documento: '12345678000190' }),
    )
  })

  it('should update client', async () => {
    vi.mocked(pb.collection('clientes').update).mockResolvedValue({
      id: '1',
      fantasia: 'Updated',
    } as any)

    const result = await updateCliente('1', { fantasia: 'Updated' })
    expect(result.fantasia).toBe('Updated')
  })

  it('should delete client', async () => {
    vi.mocked(pb.collection('clientes').delete).mockResolvedValue(true as any)

    await deleteCliente('1')
    expect(pb.collection('clientes').delete).toHaveBeenCalledWith('1')
  })

  it('should find by documento', async () => {
    vi.mocked(pb.collection('clientes').getFirstListItem).mockResolvedValue({
      id: '1',
      documento: '123',
    } as any)

    const result = await getByDocumento('clientes', '123')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('1')
  })

  it('should return null when documento not found', async () => {
    vi.mocked(pb.collection('clientes').getFirstListItem).mockRejectedValue(new Error('not found'))

    const result = await getByDocumento('clientes', '999')
    expect(result).toBeNull()
  })
})
