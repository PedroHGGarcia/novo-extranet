import { useState, useEffect } from 'react'
import { Package, Pencil, Copy, Trash2 } from 'lucide-react'
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
import {
  getAcessorios,
  createAcessorio,
  updateAcessorio,
  deleteAcessorio,
  getVersoes,
  Acessorio,
  Versao,
} from '@/services/produtos'

export default function Acessorios() {
  const [items, setItems] = useState<Acessorio[]>([])
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [filtered, setFiltered] = useState<Acessorio[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('registros')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('Opcional')
  const [moeda, setMoeda] = useState('BRL')
  const [valor, setValor] = useState<number>(0)
  const [fatorNac, setFatorNac] = useState<number>(1.0)
  const [status, setStatus] = useState('Ativo')
  const [selectedVersoes, setSelectedVersoes] = useState<string[]>([])
  const [openVersoes, setOpenVersoes] = useState(false)

  const [selectedIds, setSelectedIds] = useState<string[]>([])

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
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
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

  const handleEdit = (item: Acessorio) => {
    setEditingId(item.id)
    setNome(item.nome)
    setTipo(item.tipo)
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setFatorNac(item.fator_nac || 1)
    setStatus(item.status)
    setSelectedVersoes(item.versoes || [])
    setActiveTab('cadastro')
  }

  const handleDuplicate = (item: Acessorio) => {
    setEditingId(null)
    setNome(item.nome + ' (Cópia)')
    setTipo(item.tipo)
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setFatorNac(item.fator_nac || 1)
    setStatus(item.status)
    setSelectedVersoes(item.versoes || [])
    setActiveTab('cadastro')
  }

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    if (!confirm(`Deseja realmente excluir ${selectedIds.length} acessório(s)?`)) return
    try {
      for (const id of selectedIds) await deleteAcessorio(id)
      setSelectedIds([])
      toast({ title: 'Acessórios excluídos com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!nome.trim())
      return toast({ title: 'Preencha o nome do acessório', variant: 'destructive' })
    try {
      const formData = {
        nome: nome.trim(),
        tipo,
        moeda,
        valor,
        fator_nac: fatorNac,
        status,
        versoes: selectedVersoes,
      }
      if (editingId) await updateAcessorio(editingId, formData)
      else await createAcessorio(formData)
      toast({ title: `Acessório ${editingId ? 'atualizado' : 'criado'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar acessório',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNome('')
    setTipo('Opcional')
    setMoeda('BRL')
    setValor(0)
    setFatorNac(1.0)
    setStatus('Ativo')
    setSelectedVersoes([])
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
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4"
        >
          PESQUISAR
        </Button>
        <Button
          onClick={() => {
            resetForm()
            setActiveTab('cadastro')
          }}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4"
        >
          NOVO
        </Button>
        {activeTab === 'registros' && (
          <Button
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0}
            className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4"
          >
            EXCLUIR
          </Button>
        )}
        {activeTab === 'cadastro' && (
          <Button
            onClick={handleSave}
            className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4"
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
                            className="text-[#2A75D3] text-[11px] hover:underline flex items-center gap-1 mb-1"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="text-[#2A75D3] text-[11px] hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Duplicar
                          </button>
                        </TableCell>
                      )}
                      {visibleColumns.includes('versao') && (
                        <TableCell className="text-xs text-gray-600 py-2">
                          {item.versoes?.length || 0} versão(ões)
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
                          {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
          <div className="border border-blue-200 rounded-sm bg-white shadow-sm p-4 space-y-4 max-w-4xl">
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
                    <SelectItem value="BRL">Real</SelectItem>
                    <SelectItem value="USD">Dolar</SelectItem>
                    <SelectItem value="EUR">Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4 flex flex-col">
                <label className="text-[11px] text-gray-500 mb-0.5">Valor</label>
                <Input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  className="input-bener"
                />
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-4 flex flex-col">
                <label className="text-[11px] text-gray-500 mb-0.5">Fator Nac.</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={fatorNac}
                  onChange={(e) => setFatorNac(parseFloat(e.target.value) || 0)}
                  className="input-bener"
                />
              </div>
              <div className="col-span-8 flex flex-col">
                <label className="text-[11px] text-gray-500 mb-0.5">Vincular Versões</label>
                <Popover open={openVersoes} onOpenChange={setOpenVersoes}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-9 text-xs border-gray-300 font-normal"
                    >
                      {selectedVersoes.length > 0
                        ? `${selectedVersoes.length} versão(ões) vinculada(s)`
                        : 'Selecione as versões...'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar versão..." />
                      <CommandList>
                        <CommandEmpty>Nenhuma versão encontrada.</CommandEmpty>
                        <CommandGroup>
                          {versoes.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.nome}
                              onSelect={() => {
                                if (selectedVersoes.includes(v.id)) {
                                  setSelectedVersoes(selectedVersoes.filter((id) => id !== v.id))
                                } else {
                                  setSelectedVersoes([...selectedVersoes, v.id])
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Checkbox checked={selectedVersoes.includes(v.id)} />
                                <span className="text-xs truncate">{v.nome}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
