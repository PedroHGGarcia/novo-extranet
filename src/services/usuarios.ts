import pb from '@/lib/pocketbase/client'

export interface Usuario {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  can_issue_bidding_proposals?: boolean
  created: string
  updated: string
}

export const getUsuarios = () => pb.collection('users').getFullList<Usuario>({ sort: 'name' })

export const createUsuario = (
  data: Partial<Usuario> & { password?: string; passwordConfirm?: string },
) => {
  const payload = { ...data }
  if (payload.password && !payload.passwordConfirm) {
    payload.passwordConfirm = payload.password
  }
  return pb.collection('users').create<Usuario>(payload)
}

export const updateUsuario = (
  id: string,
  data: Partial<Usuario> & { password?: string; passwordConfirm?: string },
) => {
  const payload = { ...data }
  if (payload.password && !payload.passwordConfirm) {
    payload.passwordConfirm = payload.password
  }
  return pb.collection('users').update<Usuario>(id, payload)
}

export const deleteUsuario = (id: string) => pb.collection('users').delete(id)
