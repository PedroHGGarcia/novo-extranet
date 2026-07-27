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
  return { default: { collection: vi.fn(() => mockCollection) } }
})

import pb from '@/lib/pocketbase/client'
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from '@/services/usuarios'

describe('Usuarios Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch users sorted by name', async () => {
    vi.mocked(pb.collection('users').getFullList).mockResolvedValue([
      { id: '1', name: 'Admin' },
    ] as any)

    const result = await getUsuarios()
    expect(result[0].name).toBe('Admin')
    expect(pb.collection('users').getFullList).toHaveBeenCalledWith({ sort: 'name' })
  })

  it('should create user with passwordConfirm', async () => {
    vi.mocked(pb.collection('users').create).mockResolvedValue({
      id: '1',
      name: 'User',
      email: 'test@test.com',
    } as any)

    await createUsuario({ name: 'User', email: 'test@test.com', password: '12345678' })
    expect(pb.collection('users').create).toHaveBeenCalledWith(
      expect.objectContaining({ password: '12345678', passwordConfirm: '12345678' }),
    )
  })

  it('should update user', async () => {
    vi.mocked(pb.collection('users').update).mockResolvedValue({ id: '1', name: 'Updated' } as any)

    const result = await updateUsuario('1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
  })

  it('should delete user', async () => {
    vi.mocked(pb.collection('users').delete).mockResolvedValue(true as any)

    await deleteUsuario('1')
    expect(pb.collection('users').delete).toHaveBeenCalledWith('1')
  })
})
