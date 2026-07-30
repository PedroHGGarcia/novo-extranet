import pb from '@/lib/pocketbase/client'
import { logAudit, getCurrentUserId } from '@/services/audit'

export interface Usuario {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  can_issue_bidding_proposals?: boolean
  menu_access?: Record<string, boolean>
  setor?: string
  created: string
  updated: string
}

export const getUsuarios = () => pb.collection('users').getFullList<Usuario>({ sort: 'name' })

export const createUsuario = async (
  data: Partial<Usuario> & { password?: string; passwordConfirm?: string },
) => {
  const payload = { ...data }
  if (payload.password && !payload.passwordConfirm) {
    payload.passwordConfirm = payload.password
  }
  const record = await pb.collection('users').create<Usuario>(payload)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'users',
    recordId: record.id,
    data: { after: { ...payload, password: undefined, passwordConfirm: undefined } },
  })
  return record
}

export const updateUsuario = async (
  id: string,
  data: Partial<Usuario> & { password?: string; passwordConfirm?: string },
) => {
  const payload = { ...data }
  if (payload.password && !payload.passwordConfirm) {
    payload.passwordConfirm = payload.password
  }
  const record = await pb.collection('users').update<Usuario>(id, payload)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'users',
    recordId: id,
    data: { after: { ...payload, password: undefined, passwordConfirm: undefined } },
  })
  return record
}

export const deleteUsuario = async (id: string) => {
  const result = await pb.collection('users').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'users',
    recordId: id,
    data: { deletedAt: new Date().toISOString() },
  })
  return result
}
