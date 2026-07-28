import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  detectEntityType,
  getEntityName,
  getEntitySearchText,
  EntityCardFields,
  StatusBadge,
} from '@/components/entity-fields'

interface PaginatedSearchResult {
  items: any[]
  hasMore: boolean
}

interface SearchableComboboxProps {
  items: any[]
  value: string
  onChange: (id: string) => void
  getLabel: (item: any) => string
  getSearchText: (item: any) => string
  placeholder?: string
  emptyMessage?: string
  className?: string
  onSearch?: (query: string) => Promise<any[]>
  onPaginatedSearch?: (query: string, page: number) => Promise<PaginatedSearchResult>
  entityType?: 'representante' | 'cliente' | 'gerente'
  disabled?: boolean
}

export function SearchableCombobox({
  items,
  value,
  onChange,
  getLabel,
  getSearchText,
  placeholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className,
  onSearch,
  onPaginatedSearch,
  entityType: entityTypeProp,
  disabled,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [asyncItems, setAsyncItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const usePaginated = !!onPaginatedSearch
  const useAsync = !!onSearch || usePaginated
  const entityType = useMemo(
    () => entityTypeProp || detectEntityType(items) || detectEntityType(asyncItems),
    [entityTypeProp, items, asyncItems],
  )

  const localFiltered = useMemo(() => {
    if (useAsync) return items
    if (!query.trim()) return items
    const q = query.toLowerCase()
    if (entityType) {
      return items.filter((item) => getEntitySearchText(entityType, item).includes(q))
    }
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q))
  }, [items, query, getSearchText, useAsync, entityType])

  useEffect(() => {
    if (!usePaginated || !onPaginatedSearch) return
    if (query.trim().length > 0 && query.trim().length < 3) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setAsyncItems([])
      setPage(1)
      try {
        const result = await onPaginatedSearch(query.trim(), 1)
        setAsyncItems(result.items)
        setHasMore(result.hasMore)
      } catch {
        setAsyncItems([])
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, usePaginated, onPaginatedSearch])

  useEffect(() => {
    if (usePaginated || !onSearch) return
    if (query.trim().length < 3) {
      setAsyncItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setAsyncItems([])
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await onSearch(query.trim())
        setAsyncItems(results)
      } catch {
        setAsyncItems([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, onSearch, usePaginated])

  const loadMore = useCallback(async () => {
    if (!usePaginated || !onPaginatedSearch || !hasMore || loading || loadingMore) return
    setLoadingMore(true)
    try {
      const result = await onPaginatedSearch(query.trim(), page + 1)
      setAsyncItems((prev) => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setPage((p) => p + 1)
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }, [usePaginated, onPaginatedSearch, hasMore, loading, loadingMore, query, page])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!usePaginated || !hasMore || loading || loadingMore) return
      const target = e.currentTarget
      const { scrollTop, scrollHeight, clientHeight } = target
      if (scrollHeight - scrollTop - clientHeight < 50) {
        loadMore()
      }
    },
    [usePaginated, hasMore, loading, loadingMore, loadMore],
  )

  const useAsyncDisplay = usePaginated || (!!onSearch && query.trim().length >= 3)
  const displayItems = useAsyncDisplay ? asyncItems : localFiltered
  const selectedItem = [...items, ...asyncItems].find((item) => item.id === value)

  const showInitialHint =
    useAsync && !usePaginated && query.trim().length < 3 && displayItems.length === 0

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full bg-background border border-input rounded-md px-3 py-2 outline-none text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-ring min-h-[38px] flex items-center justify-between transition-colors',
            disabled && 'opacity-50 cursor-not-allowed',
            className,
          )}
        >
          <span className="flex items-center gap-1 truncate text-left">
            {selectedItem ? (
              <>
                <span className={cn('truncate', !selectedItem && 'text-slate-400')}>
                  {entityType ? getEntityName(entityType, selectedItem) : getLabel(selectedItem)}
                </span>
                {entityType && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange('')
                    }}
                    className="p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="h-3 w-3 text-slate-400" />
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0', entityType ? 'w-[500px]' : 'w-[--radix-popover-trigger-width]')}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite para buscar..."
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <CommandList onScroll={handleScroll}>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400 ml-2">Buscando...</span>
              </div>
            ) : displayItems.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center px-4">
                {showInitialHint
                  ? 'Digite ao menos 3 caracteres para buscar no banco de dados.'
                  : emptyMessage}
              </div>
            ) : (
              <>
                <CommandGroup>
                  {displayItems.map((item) => {
                    const isSelected = value === item.id
                    if (entityType) {
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => {
                            onChange(item.id === value ? '' : item.id)
                            setOpen(false)
                            setQuery('')
                          }}
                          className="p-1 cursor-pointer"
                        >
                          <div
                            className={cn(
                              'flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all duration-150 w-full',
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                                : 'border-transparent hover:border-slate-200 hover:bg-slate-50',
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground truncate">
                                  {getEntityName(entityType, item)}
                                </span>
                                <StatusBadge status={item.status} />
                              </div>
                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <EntityCardFields type={entityType} item={item} />
                              </div>
                            </div>
                            {isSelected && (
                              <div className="shrink-0">
                                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </CommandItem>
                      )
                    }
                    return (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => {
                          onChange(item.id === value ? '' : item.id)
                          setOpen(false)
                          setQuery('')
                        }}
                        className="text-xs cursor-pointer"
                      >
                        <Check
                          className={cn('mr-2 h-3 w-3', isSelected ? 'opacity-100' : 'opacity-0')}
                        />
                        {getLabel(item)}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {loadingMore && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                  </div>
                )}
                {usePaginated &&
                  !loading &&
                  !loadingMore &&
                  !hasMore &&
                  displayItems.length > 0 && (
                    <div className="text-center py-2 text-[10px] text-slate-400 border-t border-slate-100">
                      Fim da lista
                    </div>
                  )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
