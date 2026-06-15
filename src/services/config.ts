import pb from '@/lib/pocketbase/client'

export interface Auditoria {
  id: string
  user: string
  acao: string
  tabela: string
  registro_id: string
  dados: any
  created: string
  expand?: {
    user?: {
      name: string
      email: string
    }
  }
}

export interface ConfigDashboard {
  id: string
  perfil: 'admin' | 'user'
  componente: string
  visivel: boolean
}

export const getAuditoria = () =>
  pb.collection('auditoria').getList<Auditoria>(1, 100, { sort: '-created', expand: 'user' })

export const getConfigDashboard = () =>
  pb.collection('configuracoes_dashboard').getFullList<ConfigDashboard>()

export const updateConfigDashboard = (id: string, visivel: boolean) =>
  pb.collection('configuracoes_dashboard').update<ConfigDashboard>(id, { visivel })

export const inviteUser = (email: string, role: string) =>
  pb.send('/backend/v1/invite', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
    headers: { 'Content-Type': 'application/json' },
  })
