import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, FileText, Package, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import pb from '@/lib/pocketbase/client'

interface SearchResult {
  id: string
  label: string
  sublabel?: string
  type: 'cliente' | 'proposta' | 'produto'
  path: string
}

export function HeaderSearch() {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const navigate = useNavigate()

  const collapse = useCallback(() => {
    setExpanded(false)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    if (!expanded) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        collapse()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded, collapse])

  useEffect(() => {
    if (!expanded) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        collapse()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [expanded, collapse])

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => inputRef.current?.focus(), 80)
      return () => clearTimeout(timer)
    }
  }, [expanded])

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
          .getList(1, 5, { filter: `fantasia ~ "${escaped}" || razao_social ~ "${escaped}"` })
          .catch(() => ({ items: [] as any[] })),
        pb
          .collection('propostas')
          .getList(1, 5, { filter: `numero_proposta ~ "${escaped}"` })
          .catch(() => ({ items: [] as any[] })),
        pb
          .collection('produtos')
          .getList(1, 5, { filter: `nome ~ "${escaped}"` })
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
    if (!expanded || !query.trim()) return
    debounceRef.current = setTimeout(() => doSearch(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, expanded, doSearch])

  const handleSelect = (path: string) => {
    navigate(path)
    collapse()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0].path)
    }
  }

  const clientes = results.filter((r) => r.type === 'cliente')
  const propostas = results.filter((r) => r.type === 'proposta')
  const produtos = results.filter((r) => r.type === 'produto')
  const showDropdown = expanded && (query.trim() !== '' || loading)

  return (
    <div ref={containerRef} className="relative flex items-center">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Pesquisar"
        >
          <Search className="h-[18px] w-[18px]" draggable={false} />
        </button>
      ) : (
        <div className="flex items-center animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-2.5 h-4 w-4 text-white/50"
              draggable={false}
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pesquisar…"
              className="h-9 w-44 border-white/20 bg-white/10 pl-8 pr-8 text-sm text-white placeholder:text-white/50 focus-visible:border-white/40 focus-visible:ring-white/20 md:w-64"
            />
            <button
              onClick={collapse}
              className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-white/50 hover:text-white"
              aria-label="Fechar busca"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div className="absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-200 md:w-96">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </div>
          ) : (
            <ScrollArea className="max-h-80">
              <div className="p-2">
                {clientes.length > 0 && (
                  <div className="mb-1">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      Clientes
                    </div>
                    {clientes.map((r) => (
                      <button
                        key={`cliente-${r.id}`}
                        onClick={() => handleSelect(r.path)}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted cursor-pointer"
                      >
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          {r.sublabel && (
                            <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {propostas.length > 0 && (
                  <div className="mb-1">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      Propostas
                    </div>
                    {propostas.map((r) => (
                      <button
                        key={`proposta-${r.id}`}
                        onClick={() => handleSelect(r.path)}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted cursor-pointer"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          {r.sublabel && (
                            <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {produtos.length > 0 && (
                  <div className="mb-1">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      Produtos
                    </div>
                    {produtos.map((r) => (
                      <button
                        key={`produto-${r.id}`}
                        onClick={() => handleSelect(r.path)}
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted cursor-pointer"
                      >
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">{r.label}</span>
                          {r.sublabel && (
                            <span className="text-xs text-muted-foreground">{r.sublabel}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
}
