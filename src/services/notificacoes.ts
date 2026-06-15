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

export const markAsRead = (id: string) => {
  return pb.collection('notificacoes').update<Notificacao>(id, { lida: true })
}

export const markAllAsRead = async (unreadIds: string[]) => {
  await Promise.all(unreadIds.map((id) => markAsRead(id)))
}
