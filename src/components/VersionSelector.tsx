import { useState, useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Package, Search, Check, AlertTriangle, ChevronDown, Boxes } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'

interface VersionData {
  id: string
  nome: string
  cod_erp?: string
  valor?: number
  moeda?: string
  tem_estoque?: boolean
  estoque_disponivel?: number
  estoque_total?: number
  estoque_bloqueado?: number
  estoque_reservado?: number
  alerta_estoque_minimo?: number
  status?: string
  imagem_preview?: string
  expand?: {
    modelo?: {
      nome?: string
      expand?: {
        marca?: { nome?: string }
        produto?: { nome?: string }
      }
    }
  }
}

interface VersionSelectorProps {
  versions: VersionData[]
  value: string
  onChange: (id: string) => void
  className?: string
}

const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined || value === null) return '-'
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[currency] || currency || 'BRL'
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${code} ${value}`
  }
}

const getStatusBadge = (status?: string) => {
  if (!status || status === 'Ativo')
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0"
      >
        Ativo
      </Badge>
    )
  if (status === 'Inativo')
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-500 border-slate-300 text-[10px] px-1.5 py-0"
      >
        Inativo
      </Badge>
    )
  if (status === 'Fora de Linha')
    return (
      <Badge
        variant="outline"
        className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] px-1.5 py-0"
      >
        Fora de Linha
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
      {status}
    </Badge>
  )
}

export function VersionSelector({ versions, value, onChange, className }: VersionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [showAllStatuses, setShowAllStatuses] = useState(false)

  const selected = versions.find((v) => v.id === value)

  const filtered = useMemo(() => {
    let result = versions
    if (!showAllStatuses) {
      result = result.filter((v) => v.status === 'Ativo' || !v.status)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (v) =>
          v.nome.toLowerCase().includes(q) ||
          (v.cod_erp || '').toLowerCase().includes(q) ||
          (v.expand?.modelo?.nome || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [versions, search, showAllStatuses])

  const getStockInfo = (v: VersionData) => {
    if (!v.tem_estoque) return null
    const available = v.estoque_disponivel ?? 0
    const minAlert = v.alerta_estoque_minimo ?? 0
    const isLow = minAlert > 0 && available <= minAlert
    return { available, isLow }
  }

  const handleSelect = (id: string) => {
    onChange(id === value ? '' : id)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full bg-background border border-input rounded-md px-3 py-2 outline-none text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring min-h-[38px] flex items-center justify-between transition-colors',
            className,
          )}
        >
          {selected ? (
            <div className="flex items-center gap-2 truncate">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate">{selected.nome}</span>
              {selected.cod_erp && (
                <span className="text-[10px] text-slate-400 shrink-0">({selected.cod_erp})</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">Selecione uma versão...</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <div className="flex items-center gap-2 p-3 border-b border-slate-200">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, código ou modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-sm border border-input rounded-md bg-background outline-none focus:border-primary focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={showAllStatuses}
              onChange={(e) => setShowAllStatuses(e.target.checked)}
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            Ver todos
          </label>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              <Boxes className="h-8 w-8 mx-auto mb-2 opacity-30" />
              Nenhuma versão encontrada.
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((v) => {
                const isSelected = v.id === value
                const stock = getStockInfo(v)
                const marca = v.expand?.modelo?.expand?.marca?.nome
                const modeloNome = v.expand?.modelo?.nome
                const imageUrl = v.imagem_preview
                  ? pb.files.getURL(v as any, v.imagem_preview)
                  : null
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelect(v.id)}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all duration-150',
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
                    )}
                  >
                    <div className="h-12 w-12 shrink-0 rounded-md border border-slate-200 bg-white flex items-center justify-center overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={v.nome} className="h-full w-full object-contain" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {v.nome}
                        </span>
                        {getStatusBadge(v.status)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        {v.cod_erp && <span>Cód: {v.cod_erp}</span>}
                        {modeloNome && <span className="truncate">Modelo: {modeloNome}</span>}
                        {marca && <span className="truncate">{marca}</span>}
                      </div>
                      {stock && (
                        <div className="flex items-center gap-1 text-[11px] mt-0.5">
                          {stock.isLow ? (
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Estoque baixo: {stock.available} un.
                            </span>
                          ) : stock.available > 0 ? (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <Boxes className="h-3 w-3" />
                              {stock.available} em estoque
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 text-rose-500">
                              <AlertTriangle className="h-3 w-3" />
                              Sem estoque
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-primary">
                        {formatCurrency(v.valor, v.moeda)}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
