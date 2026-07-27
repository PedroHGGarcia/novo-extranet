import { ReactNode, ComponentType } from 'react'
import { Badge } from '@/components/ui/badge'
import { FileText, Phone, MapPin, Mail, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

export type EntityType = 'representante' | 'cliente' | 'gerente'

const STATUS_STYLES: Record<string, string> = {
  ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inativo: 'bg-rose-50 text-rose-700 border-rose-200',
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return null
  const cls = STATUS_STYLES[status.toLowerCase()]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', cls)}>
      {status}
    </Badge>
  )
}

function Info({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <span className="flex items-center gap-0.5 text-[11px] text-slate-500">
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  )
}

export function detectEntityType(items: any[]): EntityType | null {
  if (!items || items.length === 0) return null
  const s = items[0]
  if (s.fantasia) return 'estado' in s ? 'cliente' : 'representante'
  if (s.nome && ('cargo' in s || 'email' in s)) return 'gerente'
  return null
}

export function getEntityName(type: EntityType, item: any): string {
  if (type === 'gerente') return item.nome || '-'
  return item.fantasia || item.razao_social || '-'
}

export function getEntitySearchText(type: EntityType, item: any): string {
  switch (type) {
    case 'representante':
      return `${item.fantasia || ''} ${item.razao_social || ''} ${item.documento || ''} ${item.cidade || ''} ${item.telefone || ''} ${item.telefone_principal || ''}`.toLowerCase()
    case 'cliente':
      return `${item.fantasia || ''} ${item.razao_social || ''} ${item.documento || ''} ${item.cidade || ''} ${item.telefone || ''} ${item.celular || ''}`.toLowerCase()
    case 'gerente':
      return `${item.nome || ''} ${item.documento || ''} ${item.email || ''} ${item.telefone || ''} ${item.cargo || ''}`.toLowerCase()
    default:
      return ''
  }
}

export function EntityCardFields({ type, item }: { type: EntityType; item: any }) {
  if (type === 'representante') {
    return (
      <>
        {item.documento && <Info icon={FileText}>{item.documento}</Info>}
        <div className="flex items-center gap-3">
          {(item.cidade || item.uf) && (
            <Info icon={MapPin}>{[item.cidade, item.uf].filter(Boolean).join('/')}</Info>
          )}
          {(item.telefone || item.telefone_principal) && (
            <Info icon={Phone}>{item.telefone || item.telefone_principal}</Info>
          )}
        </div>
      </>
    )
  }
  if (type === 'cliente') {
    return (
      <>
        {item.razao_social && (
          <span className="text-[11px] text-slate-500 truncate">{item.razao_social}</span>
        )}
        <div className="flex items-center gap-3">
          {item.documento && <Info icon={FileText}>{item.documento}</Info>}
          {(item.cidade || item.estado) && (
            <Info icon={MapPin}>{[item.cidade, item.estado].filter(Boolean).join('/')}</Info>
          )}
        </div>
        {(item.telefone || item.celular) && (
          <Info icon={Phone}>{item.telefone || item.celular}</Info>
        )}
      </>
    )
  }
  return (
    <>
      <div className="flex items-center gap-3">
        {item.cargo && <Info icon={Briefcase}>{item.cargo}</Info>}
        {item.documento && <Info icon={FileText}>{item.documento}</Info>}
      </div>
      <div className="flex items-center gap-3">
        {item.email && <Info icon={Mail}>{item.email}</Info>}
        {item.telefone && <Info icon={Phone}>{item.telefone}</Info>}
      </div>
    </>
  )
}
