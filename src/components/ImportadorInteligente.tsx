import React, { useState, useEffect } from 'react'
import {
  UploadCloud,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  Info,
  FileSpreadsheet,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface ImportConfig {
  collection: string
  title: string
  fields: {
    key: string
    label: string
    type: 'text' | 'number' | 'date' | 'relation'
    required?: boolean
    relation?: {
      collection: string
      searchFields: string[]
      displayField: string
    }
  }[]
  onSuccess?: () => void
}

function detectSeparator(line: string) {
  const commas = (line.match(/,/g) || []).length
  const semicolons = (line.match(/;/g) || []).length
  return semicolons > commas ? ';' : ','
}

export function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
  if (lines.length === 0) return []
  const separator = detectSeparator(lines[0])

  return lines.map((line) => {
    const row = []
    let cur = ''
    let inQuote = false
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuote = !inQuote
        }
      } else if (line[i] === separator && !inQuote) {
        row.push(cur.trim())
        cur = ''
      } else {
        cur += line[i]
      }
    }
    row.push(cur.trim())
    return row
  })
}

export function ImportadorInteligente({
  open,
  onOpenChange,
  config,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ImportConfig
}) {
  const { toast } = useToast()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [previewData, setPreviewData] = useState<any[]>([])
  const [isLoadingRelations, setIsLoadingRelations] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  useEffect(() => {
    if (open) {
      setStep(1)
      setCsvData([])
      setMapping({})
      setPreviewData([])
      setImportProgress(0)
      setIsImporting(false)
    }
  }, [open])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      toast({
        title: 'Formato não suportado',
        description:
          'Por favor, abra a planilha no Excel e use a opção "Salvar Como -> CSV (Valores separados por vírgula)" e tente novamente.',
        variant: 'destructive',
      })
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const data = parseCSV(text)
      if (data.length < 2) {
        toast({
          title: 'Arquivo inválido',
          description: 'O arquivo CSV parece estar vazio ou não possui linhas suficientes.',
          variant: 'destructive',
        })
        return
      }
      setCsvData(data)

      const headers = data[0] || []
      const newMapping: Record<string, number> = {}
      config.fields.forEach((f) => {
        const idx = headers.findIndex(
          (h) =>
            h.toLowerCase() === f.label.toLowerCase() || h.toLowerCase() === f.key.toLowerCase(),
        )
        if (idx !== -1) newMapping[f.key] = idx
      })
      setMapping(newMapping)
      setStep(2)
    }
    reader.readAsText(file)
  }

  const handlePreview = async () => {
    setIsLoadingRelations(true)
    setStep(3)

    const relationData: Record<string, any[]> = {}
    for (const f of config.fields) {
      if (f.type === 'relation' && f.relation) {
        if (!relationData[f.relation.collection]) {
          try {
            const records = await pb.collection(f.relation.collection).getFullList()
            relationData[f.relation.collection] = records
          } catch (err) {
            console.error('Failed to fetch', f.relation.collection, err)
          }
        }
      }
    }

    const rawRows = csvData.slice(1)
    const rows = rawRows.filter((r) => r.some((cell) => cell.trim() !== ''))
    const clean = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

    const preview = rows.map((row, index) => {
      const pRow: any = {
        _index: index + 2,
        _isValid: true,
        _errors: {},
        _data: {},
        _resolved: {},
        _display: {},
      }

      config.fields.forEach((f) => {
        const colIdx = mapping[f.key]
        if (colIdx === undefined || colIdx === -1) {
          if (f.required) {
            pRow._isValid = false
            pRow._errors[f.key] = `Campo obrigatório não mapeado.`
          }
          return
        }

        const rawValue = row[colIdx]
        pRow._data[f.key] = rawValue

        if (f.required && (!rawValue || rawValue.trim() === '')) {
          pRow._isValid = false
          pRow._errors[f.key] = `Valor não pode ser vazio.`
          return
        }

        if (!rawValue || rawValue.trim() === '') return

        if (f.type === 'relation' && f.relation) {
          const valClean = clean(rawValue)
          const records = relationData[f.relation.collection] || []
          let matched = false

          for (const record of records) {
            for (const searchField of f.relation.searchFields) {
              if (clean(record[searchField]) === valClean) {
                pRow._resolved[f.key] = record.id
                pRow._display[f.key] = record[f.relation.displayField]
                matched = true
                break
              }
            }
            if (matched) break
          }

          if (!matched) {
            pRow._isValid = false
            pRow._errors[f.key] = `Registro (${rawValue}) não encontrado.`
          }
        } else if (f.type === 'number') {
          const numStr = rawValue.includes(',')
            ? rawValue.replace(/\./g, '').replace(',', '.')
            : rawValue
          const num = parseFloat(numStr)
          if (isNaN(num)) {
            pRow._isValid = false
            pRow._errors[f.key] = `Valor numérico inválido.`
          } else {
            pRow._resolved[f.key] = num
            pRow._display[f.key] = num.toString()
          }
        } else if (f.type === 'date') {
          let dateVal = rawValue
          if (rawValue.includes('/')) {
            const parts = rawValue.split('/')
            if (parts.length === 3) {
              const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
              dateVal = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')} 12:00:00.000Z`
            }
          } else if (rawValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateVal = `${rawValue} 12:00:00.000Z`
          } else if (rawValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
            dateVal = rawValue
          } else {
            const d = new Date(rawValue)
            if (!isNaN(d.getTime())) dateVal = d.toISOString()
          }
          pRow._resolved[f.key] = dateVal
          pRow._display[f.key] = rawValue
        } else {
          pRow._resolved[f.key] = rawValue
          pRow._display[f.key] = rawValue
        }
      })

      return pRow
    })

    setPreviewData(preview)
    setIsLoadingRelations(false)
  }

  const chunkArray = (arr: any[], size: number) => {
    const chunks = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
  }

  const handleImport = async () => {
    const validRows = previewData.filter((r) => r._isValid)
    setIsImporting(true)
    setStep(4)
    let successCount = 0
    let errorCount = 0

    const chunks = chunkArray(validRows, 10)
    let processed = 0

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (row) => {
          try {
            const data: any = {}
            for (const f of config.fields) {
              if (row._resolved[f.key] !== undefined) {
                data[f.key] = row._resolved[f.key]
              }
            }
            await pb.collection(config.collection).create(data)
            successCount++
          } catch (err) {
            console.error('Import row error', err)
            errorCount++
          }
          processed++
        }),
      )
      setImportProgress((processed / validRows.length) * 100)
    }

    toast({
      title: 'Importação Concluída',
      description: `${successCount} registros criados com sucesso. ${errorCount > 0 ? `${errorCount} falhas.` : ''}`,
    })
    config.onSuccess?.()
    setTimeout(() => onOpenChange(false), 1500)
  }

  const validRows = previewData.filter((r) => r._isValid)
  const invalidRows = previewData.filter((r) => !r._isValid)
  const headers = csvData[0] || []

  return (
    <Dialog open={open} onOpenChange={(val) => !isImporting && onOpenChange(val)}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-muted/10">
          <DialogTitle className="flex items-center gap-2 text-xl text-primary">
            <FileSpreadsheet className="w-5 h-5" />
            {config.title} - Importador Inteligente
          </DialogTitle>
          <DialogDescription>
            Importe dados em massa via arquivo CSV mapeando as colunas. Relacionamentos são
            resolvidos e validados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 p-6 pt-4 bg-background">
          {step === 1 && (
            <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 bg-muted/20 hover:bg-muted/40 transition-colors relative group">
              <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-medium">
                Arraste um arquivo CSV ou clique para selecionar
              </h3>
              <p className="text-sm text-muted-foreground mt-2 mb-8 text-center max-w-md leading-relaxed">
                As colunas serão automaticamente mapeadas se os nomes dos cabeçalhos coincidirem com
                os campos alvo.
              </p>
              <Button size="lg" onClick={() => document.getElementById('csv-upload')?.click()}>
                Procurar Arquivo CSV
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-2 min-h-0">
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-start gap-3 shrink-0">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-primary">Mapeamento de Colunas</h4>
                  <p className="text-sm text-primary/80 mt-1">
                    Selecione qual coluna do seu arquivo corresponde a cada campo no sistema. Os
                    relacionamentos serão resolvidos automaticamente através de uma busca
                    inteligente na base de dados.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg shadow-sm bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[30%] font-semibold">Campo do Sistema</TableHead>
                      <TableHead className="w-[15%] font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Coluna do Arquivo CSV</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {config.fields.map((f) => (
                      <TableRow key={f.key}>
                        <TableCell className="font-medium">
                          {f.label}{' '}
                          {f.required && (
                            <span className="text-red-500 font-bold ml-1" title="Obrigatório">
                              *
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground uppercase font-semibold">
                          {f.type}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping[f.key]?.toString() || '-1'}
                            onValueChange={(val) =>
                              setMapping((prev) => ({ ...prev, [f.key]: parseInt(val, 10) }))
                            }
                          >
                            <SelectTrigger className="w-full max-w-md bg-background">
                              <SelectValue placeholder="Ignorar (Não importar)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="-1" className="text-muted-foreground italic">
                                Ignorar (Não importar)
                              </SelectItem>
                              {headers.map((h, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
              {isLoadingRelations ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="p-6 rounded-full bg-primary/10 mb-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Analisando Dados</h3>
                  <p className="text-muted-foreground mt-1">
                    Resolvendo relacionamentos e validando registros...
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 shrink-0">
                    <div className="bg-green-50 text-green-900 p-5 rounded-lg flex-1 border border-green-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-wider text-green-700/80 mb-1">
                          Prontas para Importar
                        </div>
                        <div className="text-4xl font-bold">{validRows.length}</div>
                      </div>
                      <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
                    </div>
                    <div className="bg-red-50 text-red-900 p-5 rounded-lg flex-1 border border-red-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold uppercase tracking-wider text-red-700/80 mb-1">
                          Erros Encontrados
                        </div>
                        <div className="text-4xl font-bold">{invalidRows.length}</div>
                      </div>
                      <AlertCircle className="w-10 h-10 text-red-500 opacity-50" />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto border rounded-lg shadow-sm relative min-h-0">
                    <Table>
                      <TableHeader className="bg-muted/80 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow>
                          <TableHead className="w-12 text-center border-r">#</TableHead>
                          <TableHead className="w-16 text-center border-r">Status</TableHead>
                          {config.fields.map((f) => {
                            if (mapping[f.key] === undefined || mapping[f.key] === -1) return null
                            return (
                              <TableHead key={f.key} className="whitespace-nowrap">
                                {f.label}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(0, 100).map((row, i) => (
                          <TableRow key={i} className={cn(!row._isValid && 'bg-red-50/30')}>
                            <TableCell className="text-center text-muted-foreground border-r">
                              {row._index}
                            </TableCell>
                            <TableCell className="text-center border-r">
                              {row._isValid ? (
                                <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-500 mx-auto" />
                              )}
                            </TableCell>
                            {config.fields.map((f) => {
                              if (mapping[f.key] === undefined || mapping[f.key] === -1) return null
                              const hasError = !!row._errors[f.key]
                              return (
                                <TableCell
                                  key={f.key}
                                  className={cn('max-w-[200px] truncate', hasError && 'bg-red-50')}
                                >
                                  {hasError ? (
                                    <Tooltip>
                                      <TooltipTrigger className="cursor-help text-red-600 font-semibold w-full text-left truncate block">
                                        {row._data[f.key] || '(vazio)'}
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-red-600 text-white font-medium border-none shadow-lg">
                                        {row._errors[f.key]}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span className="text-sm">
                                      {row._display[f.key] || row._data[f.key] || '-'}
                                    </span>
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {previewData.length > 100 && (
                    <div className="text-xs text-center text-muted-foreground font-medium py-1">
                      Visualizando as primeiras 100 linhas (de {previewData.length} no total).
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="p-6 rounded-full bg-primary/10 mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Importando Registros</h3>
              <div className="w-full max-w-md relative">
                <Progress value={importProgress} className="h-4 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md mix-blend-difference">
                  {Math.round(importProgress)}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">
                Por favor, não feche esta janela.
              </p>
            </div>
          )}
        </div>

        <div className="bg-muted/30 p-4 border-t flex justify-between shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="bg-background"
          >
            Cancelar Importação
          </Button>

          {step === 2 && (
            <Button onClick={handlePreview} className="px-8 shadow-md">
              Validar e Pré-visualizar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 3 && !isLoadingRelations && (
            <Button
              onClick={handleImport}
              disabled={validRows.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md px-8"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Executar Importação ({validRows.length})
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
