import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { History, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { getAuditoriaByRegistro, type Auditoria } from '@/services/config'
import { getChanges } from '@/lib/audit-utils'

const ACTION_CONFIG: Record<string, { label: string; icon: typeof Plus; color: string }> = {
  create: { label: 'Criado', icon: Plus, color: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  update: {
    label: 'Atualizado',
    icon: Pencil,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  },
  delete: { label: 'Excluído', icon: Trash2, color: 'text-red-600 bg-red-50 dark:bg-red-950/30' },
}

export function ClientAuditSheet({
  clientId,
  clientName,
  open,
  onOpenChange,
}: {
  clientId: string
  clientName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [logs, setLogs] = useState<Auditoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !clientId) return
    setLoading(true)
    getAuditoriaByRegistro('clientes', clientId)
      .then((res) => setLogs(res.items))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [open, clientId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Ações
          </SheetTitle>
          <SheetDescription>{clientName}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 px-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum histórico encontrado.</p>
          </div>
        ) : (
          <div className="relative border-l border-border ml-3 space-y-6 pb-6">
            {logs.map((log) => {
              const config = ACTION_CONFIG[log.acao?.toLowerCase()] || ACTION_CONFIG.update
              const Icon = config.icon
              const changes = getChanges(log.dados, log.acao)
              const userRecord = log.expand?.user
              const avatarUrl = userRecord?.avatar
                ? pb.files.getURL(userRecord, userRecord.avatar)
                : null
              const userName = userRecord?.name || userRecord?.email || 'Sistema'

              return (
                <div key={log.id} className="relative pl-6">
                  <div className="absolute -left-[13px] top-0 bg-background p-0.5">
                    <div
                      className={`rounded-full h-6 w-6 flex items-center justify-center ring-4 ring-background border border-border ${config.color}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Avatar className="h-6 w-6">
                        {avatarUrl && <AvatarImage src={avatarUrl} />}
                        <AvatarFallback className="text-xs">
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{userName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {changes.length > 0 && (
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 mt-1">
                        {changes.map((c, i) => (
                          <div key={i} className="text-xs flex items-start gap-2">
                            <span className="font-medium text-muted-foreground min-w-[110px] shrink-0">
                              {c.label}:
                            </span>
                            {c.oldValue !== undefined ? (
                              <span className="flex items-center gap-1 flex-wrap">
                                <span className="text-muted-foreground line-through">
                                  {c.oldValue}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="font-medium">{c.newValue}</span>
                              </span>
                            ) : (
                              <span className="font-medium">{c.newValue}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
