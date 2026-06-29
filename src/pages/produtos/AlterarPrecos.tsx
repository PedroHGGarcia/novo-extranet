import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Save, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { updateVersao, Versao } from '@/services/produtos'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

interface PriceChange {
  moeda?: string
  valor?: number
  tem_fator?: boolean
  fator_nac?: number
}

export default function AlterarPrecos() {
  const { user } = useAuth()
  const [items, setItems] = useState<Versao[]>([])
  const [page, setPage] = useState(1)
  const perPage = 50
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeTab, setActiveTab] = useState('registros')
  const [changes, setChanges] = useState<Record<string, PriceChange>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const filter = searchTerm ? pb.filter('nome ~ {:nome}', { nome: searchTerm }) : undefined
      const result = await pb.collection('versoes').getList<Versao>(page, perPage, {
        sort: '-created',
        expand: 'modelo',
        ...(filter ? { filter } : {}),
      })
      setItems(result.items)
      setTotalItems(result.totalItems)
      setTotalPages(result.totalPages)
    } catch {
      toast({ title: 'Erro ao carregar versões', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, searchTerm])

  useEffect(() => {
    loadData()
  }, [loadData])

  useRealtime('versoes', () => loadData())

  const handleChange = (id: string, field: keyof PriceChange, value: string | number | boolean) => {
    setChanges((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const getFieldValue = (item: Versao, field: keyof PriceChange) => {
    if (changes[item.id]?.[field] !== undefined) {
      return changes[item.id]![field]
    }
    if (field === 'moeda') return (item.moeda || 'BRL') as string
    if (field === 'valor') return (item.valor || 0) as number
    if (field === 'tem_fator') return (item.tem_fator || false) as boolean
    if (field === 'fator_nac') return (item.fator_nac || 1) as number
    return undefined
  }

  const handleSave = async () => {
    const changedIds = Object.keys(changes)
    if (changedIds.length === 0) {
      toast({ title: 'Nenhuma alteração para salvar' })
      return
    }
    setSaving(true)
    try {
      for (const id of changedIds) {
        await updateVersao(id, { ...changes[id], atualizado_por: user?.id })
      }
      toast({ title: `${changedIds.length} versão(ões) atualizada(s) com sucesso` })
      setChanges({})
      setSelectedIds([])
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

  const handleSearchSubmit = () => {
    setPage(1)
    loadData()
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(items.map((i) => i.id))
    else setSelectedIds([])
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id])
    else setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  const changedCount = Object.keys(changes).length

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 text-gray-800">
        <DollarSign className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Alterar Preços</h1>
      </div>

      <div className="flex items-center gap-2 mb-4 bg-gray-100 p-2 rounded-sm border border-gray-200">
        <Button
          onClick={() => setShowSearch(!showSearch)}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4 uppercase"
        >
          <Search className="w-3.5 h-3.5 mr-1.5" />
          PESQUISAR
        </Button>
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
        {showSearch && (
          <div className="flex items-center gap-2 ml-4">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="max-w-xs h-8 text-sm bg-white"
            />
            <Button
              onClick={handleSearchSubmit}
              size="sm"
              className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 h-8"
            >
              Ir
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-4">
          <TabsTrigger
            value="registros"
            className="rounded-none border border-transparent data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-800 px-6 py-2 -mb-[1px] bg-gray-50 text-gray-500"
          >
            Registros
          </TabsTrigger>
          <TabsTrigger
            value="cadastro"
            className="rounded-none border border-transparent data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-800 px-6 py-2 -mb-[1px] bg-gray-50 text-gray-500"
          >
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-0">
          <div className="border bg-white rounded-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b border-gray-200 hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={selectedIds.length === items.length && items.length > 0}
                        onCheckedChange={(c) => handleSelectAll(c as boolean)}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs w-32">
                      Moeda
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs text-right w-32">
                      Valor
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs w-28">
                      Tem Fator
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs text-right w-32">
                      Fator Nac.
                    </TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-600 text-xs w-24">
                      Status
                    </TableHead>
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
                      return (
                        <TableRow
                          key={item.id}
                          className={cn(
                            'hover:bg-gray-50/50',
                            hasChange && 'bg-orange-50/40',
                            selectedIds.includes(item.id) && 'bg-blue-50/30',
                          )}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onCheckedChange={(c) => handleSelect(item.id, c as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={getFieldValue(item, 'moeda') as string}
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
                            <Input
                              type="number"
                              step="0.01"
                              value={getFieldValue(item, 'valor') as number}
                              onChange={(e) =>
                                handleChange(item.id, 'valor', parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs text-right w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={getFieldValue(item, 'tem_fator') ? 'Sim' : 'Não'}
                              onValueChange={(v) => handleChange(item.id, 'tem_fator', v === 'Sim')}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              step="0.000001"
                              value={getFieldValue(item, 'fator_nac') as number}
                              onChange={(e) =>
                                handleChange(item.id, 'fator_nac', parseFloat(e.target.value) || 0)
                              }
                              className="h-8 text-xs text-right w-full"
                            />
                          </TableCell>
                          <TableCell className="text-xs text-gray-800 font-medium py-2">
                            {item.nome}
                            {item.expand?.modelo && (
                              <span className="text-gray-400 ml-1">
                                ({item.expand.modelo.nome})
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                'text-[10px] px-2 py-0.5',
                                item.status === 'Ativo'
                                  ? 'bg-green-500 hover:bg-green-500'
                                  : item.status === 'Em Revisão'
                                    ? 'bg-yellow-500 hover:bg-yellow-500'
                                    : item.status === 'Aprovado'
                                      ? 'bg-blue-500 hover:bg-blue-500'
                                      : 'bg-gray-400 hover:bg-gray-400',
                              )}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                  {!loading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                  ? `${(page - 1) * perPage + 1}-${Math.min(page * perPage, totalItems)} de ${totalItems.toLocaleString('pt-BR')}`
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
        </TabsContent>

        <TabsContent value="cadastro" className="mt-0">
          <div className="border bg-white rounded-sm shadow-sm p-8 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              Utilize a aba <strong>Registros</strong> para editar os preços em lote.
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Selecione as versões, altere os campos de moeda, valor, fator e fator nacional, e
              clique em <strong>SALVAR</strong> para persistir as alterações.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
