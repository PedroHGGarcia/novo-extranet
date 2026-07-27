import pb from '@/lib/pocketbase/client'

export interface Notificacao {
  id: string
  user: string
  titulo: string
  mensagem: string
  lida: boolean
  tipo: 'info' | 'alerta' | 'sucesso'
  created: string
  updated: string
}

export const getNotificacoes = () => {
  return pb.collection('notificacoes').getFullList<Notificacao>({
    sort: '-created',
  })
}

export const getNotificacoesPaginated = (
  page: number = 1,
  perPage: number = 20,
  filter: string = '',
) => {
  return pb.collection('notificacoes').getList<Notificacao>(page, perPage, {
    sort: '-created',
    filter,
  })
}

export const markAsRead = (id: string) => {
  return pb.collection('notificacoes').update<Notificacao>(id, { lida: true })
}

export const markAllAsRead = async (unreadIds: string[]) => {
  await Promise.all(unreadIds.map((id) => markAsRead(id)))
}

export const createNotificacao = (data: {
  user: string
  titulo: string
  mensagem: string
  tipo?: 'info' | 'alerta' | 'sucesso'
  lida?: boolean
}) => {
  return pb.collection('notificacoes').create<Notificacao>({
    tipo: 'info',
    lida: false,
    ...data,
  })
}

export const subscribeToColecao = (colecao: string, callback: (e: any) => void) => {
  return pb.collection(colecao).subscribe('*', callback)
}

export const subscribeToNotificacoes = (usuarioId: string, callback: (e: any) => void) => {
  return pb.collection('notificacoes').subscribe('*', (e) => {
    if (e.record?.user === usuarioId) {
      callback(e)
    }
  })
}

export const unsubscribeAll = async (subscriptions: Array<(() => Promise<void>) | undefined>) => {
  for (const unsub of subscriptions) {
    if (unsub) {
      try {
        await unsub()
      } catch {
        // ignore
      }
    }
  }
}
