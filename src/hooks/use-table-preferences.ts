import { useState, useEffect } from 'react'
import { getPreferenciasTabela, savePreferenciasTabela } from '@/services/preferencias'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/hooks/use-toast'

export function useTablePreferences(tabelaId: string, defaultColumns: string[]) {
  const { user } = useAuth()
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultColumns)
  const [prefId, setPrefId] = useState<string | undefined>()

  useEffect(() => {
    if (!user) return
    getPreferenciasTabela(tabelaId, user.id).then((pref) => {
      if (pref) {
        setPrefId(pref.id)
        if (pref.colunas_visiveis && Array.isArray(pref.colunas_visiveis)) {
          setVisibleColumns(pref.colunas_visiveis)
        }
      }
    })
  }, [tabelaId, user])

  const toggleColumn = async (columnId: string, isVisible: boolean) => {
    const newColumns = isVisible
      ? [...visibleColumns, columnId]
      : visibleColumns.filter((c) => c !== columnId)
    setVisibleColumns(newColumns)

    if (user) {
      try {
        const saved = await savePreferenciasTabela(tabelaId, user.id, newColumns, prefId)
        setPrefId(saved.id)
      } catch (e) {
        toast({ title: 'Erro ao salvar preferência', variant: 'destructive' })
      }
    }
  }

  return { visibleColumns, toggleColumn }
}
