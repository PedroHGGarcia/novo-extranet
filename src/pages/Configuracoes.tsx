import { useEffect, useState } from 'react'
import { Settings, Shield, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { getConfigDashboard, updateConfigDashboard, type ConfigDashboard } from '@/services/config'
import { useToast } from '@/hooks/use-toast'

export default function Configuracoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [configs, setConfigs] = useState<ConfigDashboard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') loadData()
  }, [user])

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getConfigDashboard()
      setConfigs(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar configurações', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string, visivel: boolean) => {
    try {
      await updateConfigDashboard(id, visivel)
      setConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, visivel } : c)))
      toast({ title: 'Configuração atualizada com sucesso' })
    } catch {
      toast({ title: 'Erro ao atualizar configuração', variant: 'destructive' })
    }
  }

  const adminConfigs = configs.filter((c) => c.perfil === 'admin')
  const userConfigs = configs.filter((c) => c.perfil === 'user')

  const renderConfigSection = (title: string, icon: React.ReactNode, items: ConfigDashboard[]) => (
    <Card className="border-t-4 border-t-brand-blue shadow-sm rounded-t-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg font-normal text-gray-700 flex items-center gap-2">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-sm text-gray-500">Carregando...</div>
        ) : (
          <div className="grid gap-4">
            {items.map((conf) => (
              <div
                key={conf.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <span className="font-medium text-gray-700">{conf.componente}</span>
                <Switch
                  checked={conf.visivel}
                  onCheckedChange={(checked) => handleToggle(conf.id, checked)}
                />
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-sm text-gray-500">Nenhuma configuração encontrada.</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Personalização do Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {renderConfigSection(
          'Visão: Administrador',
          <Shield className="w-5 h-5 text-gray-500" />,
          adminConfigs,
        )}
        {renderConfigSection(
          'Visão: Usuário Padrão',
          <User className="w-5 h-5 text-gray-500" />,
          userConfigs,
        )}
      </div>
    </div>
  )
}
