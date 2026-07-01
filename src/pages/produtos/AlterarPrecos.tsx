import { useState, useEffect, useCallback, useRef } from 'react'
import { DollarSign, Save, ChevronLeft, ChevronRight, Search, X, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CurrencyInput } from '@/components/CurrencyInput'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { updateVersao, Versao } from '@/services/produtos'
import { updateAcessorio, Acessorio } from '@/services/acessorios'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface PriceChange {
  moeda?: string
  valor?: number
  fator_nac?: number
  status?: string
}

const PER_PAGE = 50
const VERSOES_STATUS = ['Ativo', 'Inativo', 'Em Revisão', 'Aprovado']
const ACESSORIOS_STATUS = ['Ativo', 'Inativo']

function getFieldValue(item: any, changes: Record<string, PriceChange>, field: keyof PriceChange) {
  if (changes[item.id]?.[field] !== undefined) return changes[item.id]![field]
  if (field === 'moeda') {
    const m = item.moeda || 'BRL'
    return m === 'Dolar' || m === 'US$' ? 'USD' : m === 'Real' ? 'BRL' : m === 'Euro' ? 'EUR' : m
  }
  if (field === 'valor') return item.valor || 0
  if (field === 'fator_nac') return item.fator_nac ?? 1
  if (field === 'status') return item.status || 'Ativo'
  return undefined
}

function formatCurrencyValue(value: number, moeda: string) {
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[moeda] || moeda || 'BRL'
  const locale = code === 'BRL' ? 'pt-BR' : code === 'USD' ? 'en-US' : 'de-DE'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(value)
  } catch {
    return `${code} ${value}`
  }
}

function formatAdjustDate(dateStr: string, withTime = false) {
  try {
    return format(new Date(dateStr), withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy')
  } catch {
    return '-'
  }
}

export default function AlterarPrecos() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('versoes')
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [acessorios, setAcessorios] = useState<Acessorio[]>([])
  const [vChanges, setVChanges] = useState<Record<string, PriceChange>>({})
  const [aChanges, setAChanges] = useState<Record<string, PriceChange>>({})
  const [page, setPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [adjustPercent, setAdjustPercent] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [batchProcessing, setBatchProcessing] = useState(false)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const collection = activeTab === 'versoes' ? 'versoes' : 'acessorios'
      const expand = activeTab === 'versoes' ? 'modelo,atualizado_por' : 'versoes,atualizado_por'
      const queryOptions: Record<string, unknown> = {
        sort: '-created',
        expand,
      }
      const trimmed = debouncedSearch.trim()
      if (trimmed) {
        if (activeTab === 'versoes') {
          queryOptions.filter = pb.filter('nome ~ {:search} || cod_erp ~ {:search}', {
            search: trimmed,
          })
        } else {
          queryOptions.filter = pb.filter('nome ~ {:search}', { search: trimmed })
        }
      }
      const result = await pb.collection(collection).getList(page, PER_PAGE, queryOptions)
      if (activeTab === 'versoes') setVersoes(result.items as Versao[])
      else setAcessorios(result.items as Acessorio[])
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, page, debouncedSearch])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('versoes', () => {
    if (activeTab === 'versoes') loadData()
  })
  useRealtime('acessorios', () => {
    if (activeTab === 'acessorios') loadData()
  })

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    setSelectedIds(new Set())
  }

  const handleChange = (id: string, field: keyof PriceChange, value: string | number) => {
    const setter = activeTab === 'versoes' ? setVChanges : setAChanges
    setter((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const handleSave = async () => {
    const changes = activeTab === 'versoes' ? vChanges : aChanges
    const ids = Object.keys(changes)
    if (!ids.length) {
      toast({ title: 'Nenhuma alteração para salvar' })
      return
    }
    setSaving(true)
    try {
      for (const id of ids) {
        if (activeTab === 'versoes') {
          await updateVersao(id, { ...changes[id], atualizado_por: user?.id })
        } else {
          await updateAcessorio(id, { ...changes[id], atualizado_por: user?.id })
        }
      }
      toast({ title: `${ids.length} registro(s) atualizado(s) com sucesso` })
      if (activeTab === 'versoes') setVChanges({})
      else setAChanges({})
      loadData()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar alterações',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const changes = activeTab === 'versoes' ? vChanges : aChanges
  const items: any[] = activeTab === 'versoes' ? versoes : acessorios
  const statusOptions = activeTab === 'versoes' ? VERSOES_STATUS : ACESSORIOS_STATUS
  const changedCount = Object.keys(changes).length

  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const someVisibleSelected = items.some((item) => selectedIds.has(item.id))

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        items.forEach((item) => next.add(item.id))
      } else {
        items.forEach((item) => next.delete(item.id))
      }
      return next
    })
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleOpenAdjust = () => {
    setAdjustPercent('')
    setShowAdjustDialog(true)
  }

  const handleConfirmAdjust = () => {
    const parsed = parseFloat(adjustPercent.replace(',', '.'))
    if (isNaN(parsed)) {
      toast({ title: 'Percentual inválido', variant: 'destructive' })
      return
    }
    setShowAdjustDialog(false)
    setShowConfirmDialog(true)
  }

  const handleApplyAdjust = async () => {
    const parsed = parseFloat(adjustPercent.replace(',', '.'))
    if (isNaN(parsed)) return

    const ids = Array.from(selectedIds)
    const multiplier = 1 + parsed / 100

    setShowConfirmDialog(false)
    setBatchProcessing(true)
    try {
      let successCount = 0
      for (const id of ids) {
        const item = items.find((i) => i.id === id)
        if (!item) continue
        const currentValor = getFieldValue(item, changes, 'valor') as number
        const newValor = Math.round(currentValor * multiplier * 100) / 100

        if (activeTab === 'versoes') {
          await updateVersao(id, { valor: newValor, atualizado_por: user?.id })
        } else {
          await updateAcessorio(id, { valor: newValor, atualizado_por: user?.id })
        }
        successCount++
      }

      toast({
        title: `Reajuste aplicado com sucesso`,
        description: `${parsed > 0 ? '+' : ''}${parsed}% aplicado em ${successCount} item(ns)`,
      })
      handleClearSelection()
      if (activeTab === 'versoes') setVChanges({})
      else setAChanges({})
      loadData()
    } catch (error: any) {
      toast({
        title: 'Erro ao aplicar reajuste',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setBatchProcessing(false)
    }
  }

  const renderContextCell = (item: any) => {
    if (activeTab === 'versoes') {
      return <TableCell className="text-xs text-gray-600 py-2">{item.cod_erp || '-'}</TableCell>
    }
    const versoesNomes = Array.isArray(item.expand?.versoes)
      ? item.expand.versoes.map((v: any) => v.nome).join(', ') || '-'
      : item.expand?.versoes?.nome || '-'
    return (
      <TableCell className="text-xs text-gray-600 py-2 max-w-[200px] truncate" title={versoesNomes}>
        {versoesNomes}
      </TableCell>
    )
  }

  const parsedPercent = parseFloat(adjustPercent.replace(',', '.'))

  return (
    <div className="space-y-4 max-w-full overflow-hidden pb-24">
      <div className="flex items-center gap-2 mb-2 text-gray-800">
        <DollarSign className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Alterar Preços</h1>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-gray-100 p-2 rounded-sm border border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving || changedCount === 0}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4 uppercase"
        >
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? 'SALVANDO...' : 'SALVAR'}
        </Button>
        {changedCount > 0 && (
          <span className="text-xs text-orange-600 font-medium ml-2">
            {changedCount} alteração(ões) pendente(s)
          </span>
        )}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou código ERP..."
            className="h-8 w-64 pl-8 pr-8 text-xs border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#2A75D3] focus:border-[#2A75D3] bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-4">
          <TabsTrigger
            value="versoes"
            className="rounded-none border border-transparent data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-800 px-6 py-2 -mb-[1px] bg-gray-50 text-gray-500"
          >
            Versões
          </TabsTrigger>
          <TabsTrigger
            value="acessorios"
            className="rounded-none border border-transparent data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-800 px-6 py-2 -mb-[1px] bg-gray-50 text-gray-500"
          >
            Acessórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versoes" className="mt-0">
          {renderTable()}
        </TabsContent>
        <TabsContent value="acessorios" className="mt-0">
          {renderTable()}
        </TabsContent>
      </Tabs>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2A75D3] text-white shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size}{' '}
                {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
              <button
                onClick={handleClearSelection}
                className="text-xs text-white/80 hover:text-white underline transition-colors"
              >
                Limpar seleção
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenAdjust}
                disabled={batchProcessing}
                className="bg-white text-[#2A75D3] hover:bg-white/90 rounded-none h-8 text-xs font-semibold px-4 uppercase"
              >
                <Percent className="w-3.5 h-3.5 mr-1.5" />
                {batchProcessing ? 'PROCESSANDO...' : 'APLICAR REAJUSTE'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Aplicar Reajuste de Preço</DialogTitle>
            <DialogDescription>
              Informe o percentual de reajuste a ser aplicado em {selectedIds.size}{' '}
              {selectedIds.size === 1 ? 'item selecionado' : 'itens selecionados'}. Use valores
              positivos para aumento (ex: 5 para +5%) ou negativos para desconto (ex: -10 para
              -10%).
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Percentual de Reajuste (%)
            </label>
            <div className="relative">
              <Input
                type="text"
                value={adjustPercent}
                onChange={(e) => setAdjustPercent(e.target.value.replace(/[^0-9.,-]/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAdjust()
                }}
                placeholder="ex: 5 ou -10"
                className="pr-8 text-lg font-medium"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-medium">
                %
              </span>
            </div>
            {!isNaN(parsedPercent) && adjustPercent !== '' && (
              <p className="text-xs text-gray-500 mt-2">
                {parsedPercent > 0 ? 'Aumento' : parsedPercent < 0 ? 'Desconto' : 'Sem alteração'}{' '}
                de {Math.abs(parsedPercent)}% será aplicado sobre o valor atual de cada item.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustDialog(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAdjust}
              disabled={adjustPercent === '' || isNaN(parsedPercent)}
              className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Reajuste</DialogTitle>
            <DialogDescription>
              Deseja aplicar um reajuste de{' '}
              <strong className="text-gray-800">
                {parsedPercent > 0 ? '+' : ''}
                {parsedPercent}%
              </strong>{' '}
              em {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'itens'}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="rounded-none"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyAdjust}
              className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none"
            >
              Aplicar Reajuste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderTable() {
    return (
      <div className="border bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-b border-gray-200 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allVisibleSelected || (someVisibleSelected && 'indeterminate')}
                    onCheckedChange={(c) => handleSelectAll(c === true)}
                  />
                </TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs">Nome</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs">
                  {activeTab === 'versoes' ? 'CodErp' : 'Versões'}
                </TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs w-32">Moeda</TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs text-right w-36">
                  Valor
                </TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs text-right w-32">
                  Fator Nac.
                </TableHead>
                <TableHead className="font-semibold text-gray-600 text-xs w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const hasChange = !!changes[item.id]
                  const isSelected = selectedIds.has(item.id)
                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        'hover:bg-gray-50/50',
                        hasChange && 'bg-orange-50/40',
                        isSelected && 'bg-blue-50/50',
                      )}
                    >
                      <TableCell className="py-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(c) => handleSelectItem(item.id, c === true)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-gray-800 font-medium py-2">
                        {item.nome}
                      </TableCell>
                      {renderContextCell(item)}
                      <TableCell>
                        <Select
                          value={getFieldValue(item, changes, 'moeda') as string}
                          onValueChange={(v) => handleChange(item.id, 'moeda', v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BRL">Real (BRL)</SelectItem>
                            <SelectItem value="USD">Dólar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyInput
                          value={getFieldValue(item, changes, 'valor') as number}
                          currency={getFieldValue(item, changes, 'moeda') as string}
                          onChange={(v: number) => handleChange(item.id, 'valor', v)}
                          className="h-8 text-xs text-right w-full border border-gray-300 rounded px-2"
                          maxDecimals={2}
                        />
                        {item.data_ultimo_reajuste ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] text-gray-400 cursor-help block mt-0.5">
                                Anterior:{' '}
                                {formatCurrencyValue(
                                  item.valor_anterior ?? 0,
                                  getFieldValue(item, changes, 'moeda') as string,
                                )}{' '}
                                em {formatAdjustDate(item.data_ultimo_reajuste)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs whitespace-nowrap">
                                Alterado por: {item.expand?.atualizado_por?.name || 'N/A'} | Valor
                                anterior:{' '}
                                {formatCurrencyValue(
                                  item.valor_anterior ?? 0,
                                  getFieldValue(item, changes, 'moeda') as string,
                                )}{' '}
                                | Data: {formatAdjustDate(item.data_ultimo_reajuste, true)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-[10px] text-gray-300 block mt-0.5">
                            Sem reajustes anteriores
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          step="0.000001"
                          value={getFieldValue(item, changes, 'fator_nac') as number}
                          onChange={(e) =>
                            handleChange(item.id, 'fator_nac', parseFloat(e.target.value) || 0)
                          }
                          className="h-8 text-xs text-right w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getFieldValue(item, changes, 'status') as string}
                          onValueChange={(v) => handleChange(item.id, 'status', v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    {debouncedSearch.trim()
                      ? 'Nenhum item encontrado para esta busca'
                      : 'Nenhum registro encontrado.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-3 border-t bg-gray-50 text-sm">
          <span className="text-gray-600">
            {totalItems > 0
              ? `${(page - 1) * PER_PAGE + 1}-${Math.min(page * PER_PAGE, totalItems)} de ${totalItems.toLocaleString('pt-BR')}`
              : '0 registros'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-gray-600 text-xs">
              Página {page} de {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
