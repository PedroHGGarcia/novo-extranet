import { useState, useCallback, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import type { ImportConfig } from '@/components/ImportadorInteligente'
import { parseCSV } from '@/components/ImportadorInteligente'

interface ImportResult {
  successCount: number
  errorCount: number
  totalRows: number
  errors: Array<{ linha: number; motivo: string }>
  createdIds: string[]
  historyId?: string
}

export function useImportacao() {
  const { toast } = useToast()
  const [arquivo, setArquivo] = useState<string>('')
  const [preview, setPreview] = useState<any[]>([])
  const [progresso, setProgresso] = useState(0)
  const [erros, setErros] = useState<Array<{ linha: number; motivo: string }>>([])
  const [resultado, setResultado] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const createdIdsRef = useRef<string[]>([])

  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        toast({
          title: 'Formato não suportado',
          description: 'Use CSV (Valores separados por vírgula).',
          variant: 'destructive',
        })
        return false
      }
      return true
    },
    [toast],
  )

  const previewData = useCallback((file: File, config: ImportConfig) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const text = evt.target?.result as string
        const data = parseCSV(text)
        setArquivo(file.name)
        setPreview(data.slice(1, 101))
        resolve()
      }
      reader.readAsText(file)
    })
  }, [])

  const importData = useCallback(
    async (rows: any[], config: ImportConfig): Promise<ImportResult> => {
      setIsImporting(true)
      setProgresso(0)
      setErros([])
      createdIdsRef.current = []

      let successCount = 0
      let errorCount = 0
      const errorList: Array<{ linha: number; motivo: string }> = []

      for (let i = 0; i < rows.length; i++) {
        try {
          const created = await pb.collection(config.collection).create(rows[i])
          createdIdsRef.current.push(created.id)
          successCount++
        } catch (err: any) {
          errorCount++
          errorList.push({ linha: i + 2, motivo: err?.message || 'Erro desconhecido' })
        }
        setProgresso(((i + 1) / rows.length) * 100)
      }

      const result: ImportResult = {
        successCount,
        errorCount,
        totalRows: rows.length,
        errors: errorList,
        createdIds: [...createdIdsRef.current],
      }

      try {
        const history = await pb.collection('historico_importacoes').create({
          tipo: config.collection,
          arquivo_original: arquivo,
          quantidade_registros: rows.length,
          quantidade_sucesso: successCount,
          quantidade_erro: errorCount,
          erros: errorList,
          status: errorCount === 0 ? 'concluido' : 'parcial',
          usuario: pb.authStore.record?.id,
          created_ids: createdIdsRef.current,
        })
        result.historyId = history.id
      } catch {
        // history save is best-effort
      }

      setResultado(result)
      setErros(errorList)
      setIsImporting(false)

      toast({
        title: 'Importação Concluída',
        description: `${successCount} de ${rows.length} registros importados. ${errorCount} erro(s).`,
      })

      return result
    },
    [arquivo, toast],
  )

  const rollback = useCallback(
    async (historyId: string, createdIds?: string[]) => {
      const ids = createdIds || createdIdsRef.current
      if (ids.length === 0) {
        toast({ title: 'Nada para reverter', variant: 'destructive' })
        return
      }
      let deleted = 0
      for (const id of ids) {
        try {
          await pb
            .collection('historico_importacoes')
            .delete(id)
            .catch(() => {})
          await pb
            .collection(resultado?.historyId ? 'historico_importacoes' : '')
            .delete(id)
            .catch(() => {})
          deleted++
        } catch {
          // best-effort
        }
      }
      try {
        await pb.collection('historico_importacoes').update(historyId, { status: 'cancelado' })
      } catch {
        // ignore
      }
      toast({ title: `Reversão concluída: ${deleted} registros removidos` })
    },
    [toast, resultado],
  )

  return {
    arquivo,
    preview,
    progresso,
    erros,
    resultado,
    isImporting,
    validateFile,
    previewData,
    importData,
    rollback,
    setArquivo,
    setPreview,
    setProgresso,
    setErros,
    setResultado,
  }
}
