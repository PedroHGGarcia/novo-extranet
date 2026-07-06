import { useState, useCallback } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

interface AcessorioDefault {
  acessorio_id: string
  nome: string
  estado: string
}

export function TemplateAcessorios({
  value,
  onChange,
}: {
  value: AcessorioDefault[]
  onChange: (val: AcessorioDefault[]) => void
}) {
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)

  const handleSearch = useCallback(
    async (q: string) => {
      setSearch(q)
      if (!q.trim()) {
        setSearchResults([])
        return
      }
      try {
        const res = await pb.collection('acessorios').getList(1, 10, {
          filter: `nome ~ "${q.replace(/"/g, '\\"')}"`,
          sort: 'nome',
        })
        setSearchResults(res.items.filter((a) => !value.some((v) => v.acessorio_id === a.id)))
      } catch {
        setSearchResults([])
      }
    },
    [value],
  )

  const addAcessorio = (acc: any) => {
    onChange([...value, { acessorio_id: acc.id, nome: acc.nome, estado: 'incluir' }])
    setSearch('')
    setSearchResults([])
    setShowResults(false)
  }

  const removeAcessorio = (id: string) => {
    onChange(value.filter((v) => v.acessorio_id !== id))
  }

  const toggleEstado = (id: string) => {
    onChange(
      value.map((v) =>
        v.acessorio_id === id ? { ...v, estado: v.estado === 'incluir' ? 'exibir' : 'incluir' } : v,
      ),
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar acessório para adicionar..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
            className="pl-7 text-xs h-8"
          />
        </div>
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-sm shadow-lg max-h-48 overflow-y-auto dark:bg-popover dark:border-border">
            {searchResults.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addAcessorio(acc)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs hover:bg-slate-50 border-b border-slate-100 dark:hover:bg-accent dark:border-border"
              >
                <Plus className="h-3 w-3 text-[#337ab7]" />
                {acc.nome}
              </button>
            ))}
          </div>
        )}
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          Nenhum acessório padrão definido. Os acessórios serão pré-selecionados ao usar este
          template.
        </p>
      ) : (
        <div className="space-y-1.5">
          {value.map((acc) => (
            <div
              key={acc.acessorio_id}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-sm border border-slate-200 dark:bg-accent dark:border-border"
            >
              <span className="flex-1 text-xs text-slate-700 dark:text-slate-200">{acc.nome}</span>
              <button
                type="button"
                onClick={() => toggleEstado(acc.acessorio_id)}
                className={cn(
                  'px-2 py-0.5 text-[10px] rounded-sm font-medium transition-colors',
                  acc.estado === 'incluir'
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                )}
              >
                {acc.estado === 'incluir' ? 'Incluir' : 'Exibir'}
              </button>
              <button
                type="button"
                onClick={() => removeAcessorio(acc.acessorio_id)}
                className="text-slate-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
