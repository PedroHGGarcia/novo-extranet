import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Save, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { updateVersao, Versao } from '@/services/produtos'
import { updateAcessorio, Acessorio } from '@/services/acessorios'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

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
  if (field === 'moeda') return item.moeda || 'BRL'
  if (field === 'valor') return item.valor || 0
  if (field === 'fator_nac') return item.fator_nac ?? 1
  if (field === 'status') return item.status || 'Ativo'
  return undefined
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

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const collection = activeTab === 'versoes' ? 'versoes' : 'acessorios'
      const expand = activeTab === 'versoes' ? 'modelo' : 'versoes'
      const result = await pb.collection(collection).getList(page, PER_PAGE, {
        sort: '-created',
        expand,
      })
      if (activeTab === 'versoes') setVersoes(result.items as Versao[])
      else setAcessorios(result.items as Acessorio[])
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeTab, page])

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
          await updateAcessorio(id, changes[id])
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

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
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
    </div>
  )

  function renderTable() {
    return (
      <div className="border bg-white rounded-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white">
              <TableRow className="border-b border-gray-200 hover:bg-transparent">
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
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const hasChange = !!changes[item.id]
                  return (
                    <TableRow
                      key={item.id}
                      className={cn('hover:bg-gray-50/50', hasChange && 'bg-orange-50/40')}
                    >
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
                            <SelectItem value="BRL">BRL</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyInput
                          value={getFieldValue(item, changes, 'valor') as number}
                          currency={getFieldValue(item, changes, 'moeda') as string}
                          onChange={(v) => handleChange(item.id, 'valor', v)}
                          className="h-8 text-xs text-right w-full border border-gray-300 rounded px-2"
                          maxDecimals={2}
                        />
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
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Nenhum registro encontrado.
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
