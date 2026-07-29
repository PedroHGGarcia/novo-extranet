import { useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VersionSelector } from '@/components/VersionSelector'
import pb from '@/lib/pocketbase/client'

export interface VersaoComparacaoItem {
  versaoId: string
  nome: string
  especificacoes: any[]
}

interface VersaoComparacaoSelectorProps {
  versoes: any[]
  primaryVersaoId: string
  value: VersaoComparacaoItem[]
  onChange: (items: VersaoComparacaoItem[]) => void
  maxAdditional?: number
}

export function VersaoComparacaoSelector({
  versoes,
  primaryVersaoId,
  value,
  onChange,
  maxAdditional = 2,
}: VersaoComparacaoSelectorProps) {
  const handleAdd = useCallback(
    async (versaoId: string) => {
      if (!versaoId || value.some((v) => v.versaoId === versaoId)) return
      const versao = versoes.find((v) => v.id === versaoId)
      if (!versao) return

      let especificacoes: any[] = []
      try {
        const fullVersao = await pb.collection('versoes').getOne(versaoId, {
          expand: 'modelo.produto',
        })
        const produto = fullVersao.expand?.modelo?.expand?.produto
        if (produto?.especificacoes) {
          especificacoes = Array.isArray(produto.especificacoes)
            ? produto.especificacoes
            : (() => {
                try {
                  return JSON.parse(produto.especificacoes)
                } catch {
                  return []
                }
              })()
        }
      } catch {
        /* noop */
      }

      onChange([...value, { versaoId, nome: versao.nome, especificacoes }])
    },
    [versoes, value, onChange],
  )

  const handleRemove = (versaoId: string) => {
    onChange(value.filter((v) => v.versaoId !== versaoId))
  }

  const availableVersoes = versoes.filter(
    (v) => v.id !== primaryVersaoId && !value.some((vc) => vc.versaoId === v.id),
  )

  return (
    <div className="space-y-2">
      {value.map((item) => (
        <div
          key={item.versaoId}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200"
        >
          <span className="flex-1 text-xs text-slate-700 font-medium">{item.nome}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleRemove(item.versaoId)}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {value.length < maxAdditional && (
        <div className="border border-dashed border-slate-300 rounded-md p-2">
          <VersionSelector versions={availableVersoes} value="" onChange={handleAdd} />
        </div>
      )}
    </div>
  )
}
