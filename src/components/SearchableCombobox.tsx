import { useState, useMemo, useEffect, useRef } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [asyncItems, setAsyncItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const localFiltered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase()
    return items.filter((item) => getSearchText(item).toLowerCase().includes(q))
  }, [items, query, getSearchText])

  useEffect(() => {
    if (!onSearch) return
    if (query.trim().length < 3) {
      setAsyncItems([])
      setLoading(false)
      return
    }
    setLoading(true)
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
  }, [query, onSearch])

  const useAsync = !!onSearch && query.trim().length >= 3
  const displayItems = useAsync ? asyncItems : localFiltered
  const selectedItem = [...items, ...asyncItems].find((item) => item.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px] flex items-center justify-between',
            className,
          )}
        >
          <span className={cn('truncate text-left', !selectedItem && 'text-slate-400')}>
            {selectedItem ? getLabel(selectedItem) : placeholder}
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Digite para buscar..."
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : (
              <>
                {onSearch && query.trim().length < 3 && displayItems.length === 0 && (
                  <CommandEmpty className="text-xs text-slate-500 py-3 text-center">
                    Digite ao menos 3 caracteres para buscar no banco de dados.
                  </CommandEmpty>
                )}
                {(!onSearch || query.trim().length >= 3) && displayItems.length === 0 && (
                  <CommandEmpty className="text-xs text-slate-500 py-3 text-center">
                    {emptyMessage}
                  </CommandEmpty>
                )}
                <CommandGroup>
                  {displayItems.map((item) => (
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
                        className={cn(
                          'mr-2 h-3 w-3',
                          value === item.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {getLabel(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
