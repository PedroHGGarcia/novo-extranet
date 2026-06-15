import { useState, useEffect, forwardRef } from 'react'
import { Package, Pencil, Copy, X, Wand2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { ColumnVisibilityDropdown } from '@/components/ColumnVisibilityDropdown'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { cn } from '@/lib/utils'
import {
  getAcessorios,
  createAcessorio,
  updateAcessorio,
  deleteAcessorio,
  getVersoes,
  Acessorio,
  Versao,
} from '@/services/produtos'
import pb from '@/lib/pocketbase/client'

export function formatCurrency(val: number, moeda: string) {
  const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' }
  const locale = locales[moeda] || 'pt-BR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: moeda || 'BRL',
  }).format(val)
}

const CurrencyInput = forwardRef<
  HTMLInputElement,
  { value: number; onChange: (v: number) => void; currency: string; className?: string }
>(({ value, onChange, currency, className }, ref) => {
  const formatted = formatCurrency(value, currency)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    onChange(Number(rawValue) / 100)
  }

  return <Input ref={ref} value={formatted} onChange={handleChange} className={className} />
})
CurrencyInput.displayName = 'CurrencyInput'

export default function Acessorios() {
  const [items, setItems] = useState<Acessorio[]>([])
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [filtered, setFiltered] = useState<Acessorio[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('registros')
  const [activeSubTab, setActiveSubTab] = useState('dados')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('Opcional')
  const [moeda, setMoeda] = useState('BRL')
  const [valor, setValor] = useState<number>(0)
  const [fatorNac, setFatorNac] = useState<string>('1.0')
  const [status, setStatus] = useState('Ativo')
  const [selectedVersoes, setSelectedVersoes] = useState<string[]>([])
  const [especificacoesTecnicas, setEspecificacoesTecnicas] = useState('')
  const [openVersoes, setOpenVersoes] = useState(false)
  const [historico, setHistorico] = useState<any[]>([])

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingAi, setLoadingAi] = useState(false)

  const colunasOptions = [
    { id: 'acoes', label: 'Ações' },
    { id: 'versao', label: 'Versão' },
    { id: 'nome', label: 'Nome' },
    { id: 'moeda', label: 'Moeda' },
    { id: 'tipo', label: 'Tipo' },
    { id: 'valor', label: 'Valor' },
    { id: 'fator', label: 'Fator Nac.' },
    { id: 'status', label: 'Status' },
  ]
  const { visibleColumns, toggleColumn } = useTablePreferences(
    'acessorios_bener',
    colunasOptions.map((c) => c.id),
  )

  const loadData = async () => {
    try {
      const [ac, vs] = await Promise.all([getAcessorios(), getVersoes()])
      setItems(ac)
      setVersoes(vs)
    } catch {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  const loadHistorico = async () => {
    if (!editingId) return
    try {
      const result = await pb.collection('auditoria').getFullList({
        filter: `tabela='acessorios' && registro_id='${editingId}'`,
        sort: '-created',
        expand: 'user',
      })
      setHistorico(result)
    } catch {
      console.log('Sem permissão ou erro ao carregar histórico')
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('acessorios', () => loadData())
  useRealtime('versoes', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter((i) => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    setFiltered(result)
  }, [items, searchTerm])

  useEffect(() => {
    if (activeTab === 'cadastro' && activeSubTab === 'historico' && editingId) {
      loadHistorico()
    }
  }, [activeTab, activeSubTab, editingId])

  const handleEdit = (item: Acessorio) => {
    setEditingId(item.id)
    setNome(item.nome)
    setTipo(item.tipo)
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setFatorNac(String(item.fator_nac || 1))
    setStatus(item.status)
    setSelectedVersoes(
      Array.isArray(item.versoes) ? item.versoes : item.versoes ? [item.versoes] : [],
    )
    setEspecificacoesTecnicas(item.especificacoes_tecnicas || '')
    setActiveTab('cadastro')
    setActiveSubTab('dados')
  }

  const handleDuplicate = (item: Acessorio) => {
    setEditingId(null)
    setNome(item.nome + ' (Cópia)')
    setTipo(item.tipo)
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setFatorNac(String(item.fator_nac || 1))
    setStatus(item.status)
    setSelectedVersoes(
      Array.isArray(item.versoes) ? item.versoes : item.versoes ? [item.versoes] : [],
    )
    setEspecificacoesTecnicas(item.especificacoes_tecnicas || '')
    setActiveTab('cadastro')
    setActiveSubTab('dados')
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Deseja realmente excluir ${selectedIds.length} acessório(s)?`)) return
    try {
      for (const id of selectedIds) await deleteAcessorio(id)
      setSelectedIds([])
      toast({ title: 'Acessórios excluídos com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!nome.trim())
      return toast({ title: 'Preencha o nome do acessório', variant: 'destructive' })

    const parsedFator = parseFloat(fatorNac.replace(',', '.'))
    if (isNaN(parsedFator)) {
      return toast({ title: 'Fator Nac. inválido', variant: 'destructive' })
    }

    try {
      const formData = {
        nome: nome.trim(),
        tipo,
        moeda,
        valor,
        fator_nac: parsedFator,
        status,
        versoes: selectedVersoes,
        especificacoes_tecnicas: especificacoesTecnicas,
      }
      if (editingId) await updateAcessorio(editingId, formData)
      else await createAcessorio(formData)
      toast({ title: `Acessório ${editingId ? 'atualizado' : 'criado'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNome('')
    setTipo('Opcional')
    setMoeda('BRL')
    setValor(0)
    setFatorNac('1.0')
    setStatus('Ativo')
    setSelectedVersoes([])
    setEspecificacoesTecnicas('')
    setHistorico([])
  }

  const handleSuggestSpecs = async () => {
    if (!nome.trim()) {
      return toast({ title: 'Preencha o nome primeiro', variant: 'destructive' })
    }
    setLoadingAi(true)
    try {
      const res = await pb.send('/backend/v1/suggest-specs', {
        method: 'POST',
        body: JSON.stringify({
          type: 'acessório',
          nome,
          versoes: selectedVersoes,
        }),
      })
      setEspecificacoesTecnicas(res.content)
      toast({ title: 'Especificações geradas com sucesso!' })
    } catch (err: any) {
      toast({ title: 'Erro ao gerar', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingAi(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filtered.map((i) => i.id))
    else setSelectedIds([])
  }

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) setSelectedIds((prev) => [...prev, id])
    else setSelectedIds((prev) => prev.filter((i) => i !== id))
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Acessórios</h1>
      </div>

      <div className="flex items-center gap-1 mb-4 bg-gray-100 p-2 rounded-sm border border-gray-200">
        <Button
          onClick={() => setActiveTab('registros')}
          className="bg-primary hover:bg-primary/90 rounded-none h-8 text-xs font-semibold px-4"
        >
          PESQUISAR
        </Button>
        <Button
          onClick={() => {
            resetForm()
            setActiveTab('cadastro')
            setActiveSubTab('dados')
          }}
          className="bg-primary hover:bg-primary/90 rounded-none h-8 text-xs font-semibold px-4"
        >
          NOVO
        </Button>
        {activeTab === 'registros' && (
          <Button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="bg-primary hover:bg-primary/90 rounded-none h-8 text-xs font-semibold px-4"
          >
            EXCLUIR
          </Button>
        )}
        {activeTab === 'cadastro' && (
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 rounded-none h-8 text-xs font-semibold px-4"
          >
            SALVAR
          </Button>
        )}
        <div className="ml-auto">
          <ColumnVisibilityDropdown
            columns={colunasOptions}
            visibleColumns={visibleColumns}
            onToggle={toggleColumn}
          />
        </div>
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
            <div className="p-3 border-b bg-gray-50">
              <Input
                placeholder="Buscar acessório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm h-8 text-sm bg-white"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b border-gray-200 hover:bg-transparent">
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.includes('acoes') && (
                      <TableHead className="font-semibold text-gray-600 w-24">Ações</TableHead>
                    )}
                    {visibleColumns.includes('versao') && (
                      <TableHead className="font-semibold text-gray-600">Versão</TableHead>
                    )}
                    {visibleColumns.includes('nome') && (
                      <TableHead className="font-semibold text-gray-600">Nome</TableHead>
                    )}
                    {visibleColumns.includes('moeda') && (
                      <TableHead className="font-semibold text-gray-600">Moeda</TableHead>
                    )}
                    {visibleColumns.includes('tipo') && (
                      <TableHead className="font-semibold text-gray-600">Tipo</TableHead>
                    )}
                    {visibleColumns.includes('valor') && (
                      <TableHead className="font-semibold text-gray-600 text-right">
                        Valor
                      </TableHead>
                    )}
                    {visibleColumns.includes('fator') && (
                      <TableHead className="font-semibold text-gray-600 text-right">
                        Fator Nac.
                      </TableHead>
                    )}
                    {visibleColumns.includes('status') && (
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(c) => handleSelect(item.id, c as boolean)}
                        />
                      </TableCell>
                      {visibleColumns.includes('acoes') && (
                        <TableCell className="py-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary text-[11px] hover:underline flex items-center gap-1 mb-1"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="text-primary text-[11px] hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Duplicar
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.includes('versao') && (
                        <TableCell className="text-xs text-gray-600 py-2">
                          {Array.isArray(item.expand?.versoes)
                            ? item.expand.versoes.length > 2
                              ? `${item.expand.versoes
                                  .slice(0, 2)
                                  .map((v: any) => v.nome)
                                  .join(', ')} +${item.expand.versoes.length - 2}`
                              : item.expand.versoes.length > 0
                                ? item.expand.versoes.map((v: any) => v.nome).join(', ')
                                : '-'
                            : item.expand?.versoes?.nome || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.includes('nome') && (
                        <TableCell className="text-sm font-medium text-gray-800 py-2">
                          {item.nome}
                        </TableCell>
                      )}
                      {visibleColumns.includes('moeda') && (
                        <TableCell className="text-xs text-gray-600 py-2">{item.moeda}</TableCell>
                      )}
                      {visibleColumns.includes('tipo') && (
                        <TableCell className="text-xs text-gray-600 py-2">{item.tipo}</TableCell>
                      )}
                      {visibleColumns.includes('valor') && (
                        <TableCell className="text-xs text-gray-600 text-right py-2">
                          {formatCurrency(item.valor, item.moeda)}
                        </TableCell>
                      )}
                      {visibleColumns.includes('fator') && (
                        <TableCell className="text-xs text-gray-600 text-right py-2">
                          {Number(item.fator_nac).toFixed(6)}
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell className="py-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-normal border-none text-white',
                              item.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-400',
                            )}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cadastro" className="mt-0">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
            <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 mb-4">
              <TabsTrigger
                value="dados"
                className="rounded-none border border-transparent data-[state=active]:border-primary data-[state=active]:border-b-primary data-[state=active]:text-primary px-4 py-2 -mb-[1px] bg-transparent text-gray-500"
              >
                Dados Gerais
              </TabsTrigger>
              <TabsTrigger
                value="especificacoes"
                className="rounded-none border border-transparent data-[state=active]:border-primary data-[state=active]:border-b-primary data-[state=active]:text-primary px-4 py-2 -mb-[1px] bg-transparent text-gray-500"
              >
                Especificações Técnicas
              </TabsTrigger>
              {editingId && (
                <TabsTrigger
                  value="historico"
                  className="rounded-none border border-transparent data-[state=active]:border-primary data-[state=active]:border-b-primary data-[state=active]:text-primary px-4 py-2 -mb-[1px] bg-transparent text-gray-500"
                >
                  Histórico
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="dados"
              className="mt-0 border border-primary/20 rounded-sm bg-white shadow-sm p-4 space-y-4 max-w-4xl"
            >
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input-bener"
                  />
                </div>
                <div className="col-span-4 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="select-bener-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Tipo</label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="select-bener-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Opcional">Opcional</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Opcional Standard">Opcional Standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Moeda</label>
                  <Select value={moeda} onValueChange={setMoeda}>
                    <SelectTrigger className="select-bener-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Valor</label>
                  <CurrencyInput
                    value={valor}
                    onChange={setValor}
                    currency={moeda}
                    className="input-bener"
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-4 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Fator Nac.</label>
                  <Input
                    value={fatorNac}
                    onChange={(e) => setFatorNac(e.target.value.replace(/[^0-9.,]/g, ''))}
                    className="input-bener"
                  />
                </div>
                <div className="col-span-8 flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Vincular Versões</label>
                  <Popover open={openVersoes} onOpenChange={setOpenVersoes}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between min-h-9 h-auto py-1.5 text-xs border-gray-300 font-normal"
                      >
                        {selectedVersoes.length > 0 ? (
                          <span className="text-xs truncate">
                            {selectedVersoes.length === 1
                              ? versoes.find((v) => v.id === selectedVersoes[0])?.nome
                              : `${selectedVersoes.length} versões selecionadas`}
                          </span>
                        ) : (
                          'Selecione as versões...'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar versão..." />
                        <CommandList>
                          <CommandEmpty>Nenhuma versão encontrada.</CommandEmpty>
                          <CommandGroup>
                            {versoes.map((v) => {
                              const isSelected = selectedVersoes.includes(v.id)
                              return (
                                <CommandItem
                                  key={v.id}
                                  value={v.nome}
                                  onSelect={() => {
                                    setSelectedVersoes((prev) =>
                                      prev.includes(v.id)
                                        ? prev.filter((id) => id !== v.id)
                                        : [...prev, v.id],
                                    )
                                  }}
                                >
                                  <div
                                    className={cn(
                                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                      isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'opacity-50 [&_svg]:invisible',
                                    )}
                                  >
                                    <svg
                                      className="h-3 w-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-xs truncate">{v.nome}</span>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedVersoes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedVersoes.map((id) => {
                        const v = versoes.find((ver) => ver.id === id)
                        if (!v) return null
                        return (
                          <Badge
                            key={id}
                            variant="secondary"
                            className="text-[10px] py-0 px-2 flex items-center gap-1 font-normal"
                          >
                            {v.nome}
                            <button
                              onClick={() =>
                                setSelectedVersoes((prev) => prev.filter((vid) => vid !== id))
                              }
                              className="hover:text-red-500 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="especificacoes"
              className="mt-0 border border-primary/20 rounded-sm bg-white shadow-sm p-4 space-y-4 max-w-4xl"
            >
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-gray-500 font-semibold">
                  Especificações Técnicas
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex items-center gap-2"
                  onClick={handleSuggestSpecs}
                  disabled={loadingAi}
                >
                  {loadingAi ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3" />
                  )}
                  Sugestões Inteligentes
                </Button>
              </div>
              <Textarea
                value={especificacoesTecnicas}
                onChange={(e) => setEspecificacoesTecnicas(e.target.value)}
                className="min-h-[200px] text-sm"
                placeholder="Descreva as especificações técnicas do acessório..."
              />
            </TabsContent>

            <TabsContent value="historico" className="mt-0">
              <div className="border border-primary/20 rounded-sm bg-white shadow-sm p-4 max-w-4xl">
                {historico.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Nenhum histórico encontrado.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historico.map((log) => (
                      <div
                        key={log.id}
                        className="border rounded-sm p-3 text-sm flex gap-4 items-start"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          {log.expand?.user?.avatar ? (
                            <img
                              src={pb.files.getURL(log.expand.user, log.expand.user.avatar)}
                              alt="avatar"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 font-semibold">
                              {log.expand?.user?.name?.[0] || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-800">
                              {log.expand?.user?.name || log.user}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(log.created).toLocaleString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            Ação: <span className="font-medium capitalize">{log.acao}</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-sm max-h-32 overflow-y-auto">
                            <pre>{JSON.stringify(log.dados, null, 2)}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
}
