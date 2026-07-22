import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { getAuditoria, type Auditoria } from '@/services/config'
import { useToast } from '@/hooks/use-toast'

export default function AuditoriaPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [logs, setLogs] = useState<Auditoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user])

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await getAuditoria()
      setLogs(result.items)
    } catch (e) {
      toast({ title: 'Erro ao carregar logs de auditoria', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Activity className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Logs de Auditoria</h1>
      </div>

      <Card className="border-t-4 border-t-brand-blue shadow-sm rounded-t-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-normal text-gray-700">Ações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Registro (ID)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.created).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user
                        ? log.expand?.user?.name || log.expand?.user?.email || 'Desconhecido'
                        : 'Sistema'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          log.acao?.toLowerCase() === 'create'
                            ? 'text-green-700 border-green-200 bg-green-50'
                            : log.acao?.toLowerCase() === 'update'
                              ? 'text-blue-700 border-blue-200 bg-blue-50'
                              : 'text-red-700 border-red-200 bg-red-50'
                        }
                      >
                        {log.acao}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.tabela}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-500">
                      {log.registro_id}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
