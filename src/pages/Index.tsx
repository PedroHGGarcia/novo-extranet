import { useState, useEffect } from 'react'
import { Monitor, User, Briefcase, CircleUser, FileText, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { getConfigDashboard, type ConfigDashboard } from '@/services/config'

interface MetricCardProps {
  title: string
  value: string
  colorClass: string
  icon: React.ElementType
}

const MetricCard = ({ title, value, colorClass, icon: Icon }: MetricCardProps) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-md p-6 text-white shadow-sm transition-transform hover:scale-[1.02]',
      colorClass,
    )}
  >
    <div className="relative z-10 flex flex-col gap-1">
      <span className="text-5xl font-bold tracking-tight">{value}</span>
      <span className="text-sm font-medium opacity-90">{title}</span>
    </div>
    <Icon
      className="absolute -bottom-6 -right-4 h-32 w-32 opacity-20 transition-transform hover:scale-110"
      strokeWidth={1.5}
    />
  </div>
)

export default function Index() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState('')
  const { toast } = useToast()
  const [configs, setConfigs] = useState<ConfigDashboard[]>([])

  useEffect(() => {
    if (user?.role) {
      getConfigDashboard().then(setConfigs).catch(console.error)
    }
  }, [user])

  const isVisible = (componente: string) => {
    if (configs.length === 0) return true
    const conf = configs.find((c) => c.componente === componente && c.perfil === user?.role)
    return conf ? conf.visivel : true
  }

  const handleSubmit = () => {
    if (!feedback.trim()) return

    toast({
      title: 'Comentário salvo!',
      description: 'Obrigado pelo seu feedback.',
      duration: 3000,
    })
    setFeedback('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Monitor className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Painel Principal</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isVisible('Gerentes Ativos') && (
          <MetricCard title="Gerentes Ativos" value="5" colorClass="bg-brand-orange" icon={User} />
        )}
        {isVisible('Representantes Ativos') && (
          <MetricCard
            title="Representantes Ativos"
            value="50"
            colorClass="bg-brand-cyan"
            icon={Briefcase}
          />
        )}
        {isVisible('Clientes Ativos') && (
          <MetricCard
            title="Clientes Ativos"
            value="11341"
            colorClass="bg-brand-blue"
            icon={CircleUser}
          />
        )}
        {isVisible('Propostas Emitidas') && (
          <MetricCard
            title="Propostas Emitidas"
            value="44039"
            colorClass="bg-brand-success"
            icon={FileText}
          />
        )}
      </div>

      {isVisible('Feedback') && (
        <div className="pt-2">
          <Card className="border-t-4 border-t-brand-orange shadow-sm border-x-0 border-b-0 rounded-t-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2 text-lg font-normal text-gray-700">
                <Tag className="h-5 w-5 -rotate-90 text-gray-500" />
                O que falta no sistema?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <label className="text-xs text-gray-500 mb-2 block">Comentários</label>
              <Textarea
                placeholder="Como o sistema pode ajudar no seu dia a dia?"
                className="min-h-[120px] resize-none border-gray-300 focus-visible:ring-brand-blue focus-visible:border-brand-blue rounded-sm"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </CardContent>
            <CardFooter className="justify-end border-t pt-4">
              <Button
                onClick={handleSubmit}
                className="bg-brand-blue hover:bg-brand-blue/90 font-medium px-8 text-xs h-9 rounded-sm"
              >
                SALVAR
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
