import { useState, useEffect, useRef, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChevronsUpDown, Loader2, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginatedSearchResult {
  items: any[]
  hasMore: boolean
}

interface SearchableMultiSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
  getLabel: (item: any) => string
  getSubLabel?: (item: any) => string
  placeholder?: string
  emptyMessage?: string
  className?: string
  onPaginatedSearch: (query: string, page: number) => Promise<PaginatedSearchResult>
  refreshSignal?: number
  dependentValue?: string
}

export function SearchableMultiSelect({
  value,
  onChange,
  getLabel,
  getSubLabel,
  placeholder = 'Selecionar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className,
  onPaginatedSearch,
  refreshSignal = 0,
  dependentValue,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [itemCache, setItemCache] = useState<Record<string, any>>({})
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const doSearch = useCallback(
    async (q: string, p: number, append: boolean) => {
      if (append) setLoadingMore(true)
      else setLoading(true)
      try {
        const result = await onPaginatedSearch(q, p)
        setItems((prev) => (append ? [...prev, ...result.items] : result.items))
        setHasMore(result.hasMore)
        setPage(p)
        setItemCache((prev) => {
          const next = { ...prev }
          for (const item of result.items) next[item.id] = item
          return next
        })
      } catch {
        if (!append) {
          setItems([])
          setHasMore(false)
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [onPaginatedSearch],
  )

  useEffect(() => {
    if (!open) return
    if (query.trim().length > 0 && query.trim().length < 3) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query.trim(), 1, false), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, doSearch])

  useEffect(() => {
    if (open && items.length === 0 && !loading && !query.trim()) {
      doSearch('', 1, false)
    }
  }, [open])

  useEffect(() => {
    if (refreshSignal > 0 && open) {
      doSearch(query.trim(), 1, false)
    }
  }, [refreshSignal])

  useEffect(() => {
    setQuery('')
    setItemCache({})
    if (open) {
      doSearch('', 1, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dependentValue])

  const loadMore = () => {
    if (hasMore && !loading && !loadingMore) doSearch(query.trim(), page + 1, true)
  }
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <Badge key={id} variant="secondary" className="text-xs gap-1 pr-1">
              {itemCache[id] ? getLabel(itemCache[id]) : id}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(value.filter((v) => v !== id))
                }}
                className="ml-0.5 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
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
            <span
              className={cn('truncate text-left', value.length === 0 && 'text-muted-foreground')}
            >
              {value.length > 0 ? `${value.length} proposta(s) selecionada(s)` : placeholder}
            </span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground ml-2">Buscando...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center px-4">
                {query.trim().length > 0 && query.trim().length < 3
                  ? 'Digite ao menos 3 caracteres para buscar.'
                  : emptyMessage}
              </div>
            ) : (
              <>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => toggle(item.id)}
                  >
                    <Checkbox checked={value.includes(item.id)} className="pointer-events-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getLabel(item)}</p>
                      {getSubLabel && (
                        <p className="text-xs text-muted-foreground truncate">
                          {getSubLabel(item)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && !loadingMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    className="w-full text-center py-2 text-xs text-primary hover:underline"
                  >
                    Carregar mais
                  </button>
                )}
                {loadingMore && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
