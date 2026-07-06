import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Users, FileText, Package } from 'lucide-react'
import pb from '@/lib/pocketbase/client'

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  type: 'cliente' | 'proposta' | 'produto'
  path: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', keyHandler)

    const openHandler = () => setOpen(true)
    window.addEventListener('open-command-palette', openHandler)

    return () => {
      document.removeEventListener('keydown', keyHandler)
      window.removeEventListener('open-command-palette', openHandler)
    }
  }, [])

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const escaped = q.replace(/"/g, '\\"')
      const [clientes, propostas, produtos] = await Promise.all([
        pb
          .collection('clientes')
          .getList(1, 5, {
            filter: `fantasia ~ "${escaped}" || razao_social ~ "${escaped}"`,
          })
          .catch(() => ({ items: [] as any[] })),
        pb
          .collection('propostas')
          .getList(1, 5, {
            filter: `numero_proposta ~ "${escaped}"`,
          })
          .catch(() => ({ items: [] as any[] })),
        pb
          .collection('produtos')
          .getList(1, 5, {
            filter: `nome ~ "${escaped}"`,
          })
          .catch(() => ({ items: [] as any[] })),
      ])

      const all: SearchResult[] = [
        ...clientes.items.map((c) => ({
          id: c.id,
          label: c.fantasia || c.razao_social || 'Cliente',
          sublabel: c.razao_social || c.documento,
          type: 'cliente' as const,
          path: '/cadastros/clientes',
        })),
        ...propostas.items.map((p) => ({
          id: p.id,
          label: p.numero_proposta || 'Proposta',
          sublabel: p.cliente_original || p.contato,
          type: 'proposta' as const,
          path: '/controle-propostas/emitir-proposta',
        })),
        ...produtos.items.map((p) => ({
          id: p.id,
          label: p.nome || 'Produto',
          sublabel: p.descricao,
          type: 'produto' as const,
          path: '/produtos',
        })),
      ]
      setResults(all)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open) return
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, doSearch])

  const handleSelect = (path: string) => {
    navigate(path)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const handleOpenChange = (o: boolean) => {
    setOpen(o)
    if (!o) {
      setQuery('')
      setResults([])
    }
  }

  const clientes = results.filter((r) => r.type === 'cliente')
  const propostas = results.filter((r) => r.type === 'proposta')
  const produtos = results.filter((r) => r.type === 'produto')

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Buscar clientes, propostas, produtos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Buscando...</div>
        ) : query.trim() === '' ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Digite para buscar em clientes, propostas e produtos.
          </div>
        ) : results.length === 0 ? (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        ) : (
          <>
            {clientes.length > 0 && (
              <CommandGroup heading="Clientes">
                {clientes.map((r) => (
                  <CommandItem
                    key={`cliente-${r.id}`}
                    value={`cliente-${r.id}`}
                    onSelect={() => handleSelect(r.path)}
                  >
                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {propostas.length > 0 && (
              <CommandGroup heading="Propostas">
                {propostas.map((r) => (
                  <CommandItem
                    key={`proposta-${r.id}`}
                    value={`proposta-${r.id}`}
                    onSelect={() => handleSelect(r.path)}
                  >
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {produtos.length > 0 && (
              <CommandGroup heading="Produtos">
                {produtos.map((r) => (
                  <CommandItem
                    key={`produto-${r.id}`}
                    value={`produto-${r.id}`}
                    onSelect={() => handleSelect(r.path)}
                  >
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span>{r.label}</span>
                      {r.sublabel && (
                        <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
