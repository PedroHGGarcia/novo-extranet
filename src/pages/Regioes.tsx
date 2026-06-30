import { useState, useEffect } from 'react'
import { Globe, Map as MapIcon, Loader2, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { getRegioes, createRegiao, updateRegiao, deleteRegiao } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

export default function Regioes() {
  const [data, setData] = useState<any[]>([])
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [isLoadingCities, setIsLoadingCities] = useState(false)

  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'registros' | 'cadastro'>('registros')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    status: 'Ativo',
    estados_selecionados: [] as string[],
    cidades_selecionadas: [] as string[],
    created: '',
    updated: '',
    atualizado_por_name: '',
  })

  const loadData = async () => setData(await getRegioes().catch(() => []))

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('regioes', loadData)

  // Fetch States from IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then((res) => res.json())
      .then((data) => setEstados(data))
      .catch((err) => console.error('Error fetching estados:', err))
  }, [])

  // Fetch Cities from IBGE when selected states change
  useEffect(() => {
    if (formData.estados_selecionados.length === 0) {
      setCidades([])
      return
    }
    setIsLoadingCities(true)
    const ufs = formData.estados_selecionados.join('|')
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufs}/municipios?orderBy=nome`,
    )
      .then((res) => res.json())
      .then((data) => setCidades(data))
      .catch((err) => console.error('Error fetching cidades:', err))
      .finally(() => setIsLoadingCities(false))
  }, [formData.estados_selecionados])

  const filtered = data.filter((d) => d.nome?.toLowerCase().includes(search.toLowerCase()))
  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteRegiao(id)))
      setSelected([])
      toast({ title: 'Registros excluídos' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      nome: '',
      status: 'Ativo',
      estados_selecionados: [],
      cidades_selecionadas: [],
      created: '',
      updated: '',
      atualizado_por_name: '',
    })
    setErrors({})
  }

  const handleNewClick = () => {
    resetForm()
    setActiveTab('cadastro')
  }

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      nome: item.nome || '',
      status: item.status || 'Ativo',
      estados_selecionados: item.estados_selecionados || [],
      cidades_selecionadas: item.cidades_selecionadas || [],
      created: item.created || '',
      updated: item.updated || '',
      atualizado_por_name: item.expand?.atualizado_por?.name || '',
    })
    setErrors({})
    setActiveTab('cadastro')
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setErrors({})
      const payload = {
        nome: formData.nome,
        status: formData.status,
        estados_selecionados: formData.estados_selecionados,
        cidades_selecionadas: formData.cidades_selecionadas,
        atualizado_por: pb.authStore.record?.id,
      }
      if (formData.id) {
        await updateRegiao(formData.id, payload)
        toast({ title: 'Registro atualizado' })
      } else {
        await createRegiao(payload)
        toast({ title: 'Registro criado' })
      }
      resetForm()
      setActiveTab('registros')
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleEstado = (sigla: string) => {
    setFormData((prev) => {
      const isAdding = !prev.estados_selecionados.includes(sigla)
      const selected = isAdding
        ? [...prev.estados_selecionados, sigla]
        : prev.estados_selecionados.filter((s) => s !== sigla)
      return { ...prev, estados_selecionados: selected }
    })
  }

  const toggleCidade = (id: string) => {
    setFormData((prev) => {
      const isAdding = !prev.cidades_selecionadas.includes(id)
      const selected = isAdding
        ? [...prev.cidades_selecionadas, id]
        : prev.cidades_selecionadas.filter((i) => i !== id)
      return { ...prev, cidades_selecionadas: selected }
    })
  }

  const toggleAllCidades = (checked: boolean) => {
    if (checked) {
      const newCities = [...formData.cidades_selecionadas]
      cidades.forEach((c) => {
        const strId = c.id.toString()
        if (!newCities.includes(strId)) {
          newCities.push(strId)
        }
      })
      setFormData((prev) => ({ ...prev, cidades_selecionadas: newCities }))
    } else {
      const visibleIds = cidades.map((c) => c.id.toString())
      const newCities = formData.cidades_selecionadas.filter((id) => !visibleIds.includes(id))
      setFormData((prev) => ({ ...prev, cidades_selecionadas: newCities }))
    }
  }

  const isAllVisibleCitiesSelected =
    cidades.length > 0 &&
    cidades.every((c) => formData.cidades_selecionadas.includes(c.id.toString()))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-gray-800">
        <Globe className="h-6 w-6 text-[#3b82f6]" />
        <h1 className="text-xl font-semibold">Regiões</h1>
      </div>
      <div className="h-[2px] bg-[#3b82f6] w-full mb-6"></div>

      <RegistrationActionBar
        onSearchToggle={() => setShowSearch(!showSearch)}
        onNewClick={handleNewClick}
        onDeleteClick={() =>
          selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
        }
        showSearch={showSearch}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      <div className="flex justify-between items-end border-b border-gray-200 mb-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('registros')}
            className={`px-6 py-2.5 text-sm font-medium ${
              activeTab === 'registros'
                ? 'bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-gray-700'
                : 'text-[#3b82f6] hover:bg-gray-50/50'
            }`}
          >
            Registros
          </button>
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`px-6 py-2.5 text-sm font-medium ${
              activeTab === 'cadastro'
                ? 'bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-gray-700'
                : 'text-[#3b82f6] hover:bg-gray-50/50'
            }`}
          >
            Cadastro
          </button>
        </div>
        {activeTab === 'registros' && (
          <div className="pb-2 text-sm text-gray-600">Total: {filtered.length}</div>
        )}
      </div>

      {activeTab === 'registros' ? (
        <div className="bg-white border border-t-0 border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-[#3b82f6] font-semibold">Nome</TableHead>
                <TableHead className="text-[#3b82f6] font-semibold">Última Atualização</TableHead>
                <TableHead className="text-[#3b82f6] font-semibold">Atualizado por</TableHead>
                <TableHead className="text-[#3b82f6] font-semibold">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-b-gray-100">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onCheckedChange={() => toggleOne(item.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3 font-medium text-gray-700 uppercase">
                    {item.nome}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.updated ? format(new Date(item.updated), 'dd/MM/yyyy HH:mm:ss') : '-'}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.expand?.atualizado_por?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-white text-[11px] px-2 py-0.5 rounded-sm font-medium tracking-wide uppercase ${
                        item.status === 'Ativo' ? 'bg-[#16a34a]' : 'bg-gray-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white p-6 border border-t-0 border-gray-200 min-h-[400px]">
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${errors.nome ? 'text-red-500' : 'text-[#3b82f6]'}`}
                >
                  Nome
                </Label>
                <Input
                  className={`border-0 border-b-2 rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent h-8 ${errors.nome ? 'border-red-500' : 'border-[#00b4d8]'}`}
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
                {errors.nome && <span className="text-[10px] text-red-500">{errors.nome}</span>}
              </div>
              <div className="w-[200px] space-y-1">
                <Label className="text-[11px] uppercase tracking-wide text-gray-500">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="border-0 border-b border-red-600 rounded-none px-0 shadow-none focus:ring-0 bg-transparent h-8 text-red-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1 border border-gray-200 rounded-sm">
                <div className="border-t-[3px] border-t-[#00b4d8] p-3 flex items-center gap-2 bg-gray-50/50">
                  <Globe className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">Estados</span>
                </div>
                <div className="h-[300px] overflow-y-auto p-3 space-y-2">
                  {estados.map((est) => (
                    <div key={est.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`est-${est.sigla}`}
                        checked={formData.estados_selecionados.includes(est.sigla)}
                        onCheckedChange={() => toggleEstado(est.sigla)}
                      />
                      <label
                        htmlFor={`est-${est.sigla}`}
                        className="text-sm text-gray-700 cursor-pointer select-none"
                      >
                        {est.nome}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-[1.5] border border-gray-200 rounded-sm">
                <div className="border-t-[3px] border-t-[#00b4d8] p-3 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-gray-600" />
                    <span className="font-semibold text-gray-700">Cidades</span>
                  </div>
                </div>
                <div className="h-[300px] overflow-y-auto p-3 space-y-2">
                  {formData.estados_selecionados.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                      <Checkbox
                        id="all-cities"
                        checked={isAllVisibleCitiesSelected}
                        onCheckedChange={toggleAllCidades}
                      />
                      <label
                        htmlFor="all-cities"
                        className="text-sm text-gray-700 cursor-pointer select-none"
                      >
                        Todos
                      </label>
                    </div>
                  )}

                  {isLoadingCities ? (
                    <div className="flex items-center justify-center h-20">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    cidades.map((cid) => (
                      <div key={cid.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`cid-${cid.id}`}
                          checked={formData.cidades_selecionadas.includes(cid.id.toString())}
                          onCheckedChange={() => toggleCidade(cid.id.toString())}
                        />
                        <label
                          htmlFor={`cid-${cid.id}`}
                          className="text-sm text-gray-700 cursor-pointer select-none"
                        >
                          {cid.microrregiao?.mesorregiao?.UF?.sigla} - {cid.nome}
                        </label>
                      </div>
                    ))
                  )}
                  {formData.estados_selecionados.length === 0 && (
                    <div className="text-sm text-gray-500 italic mt-2">
                      Selecione um ou mais estados para ver as cidades.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4 mt-6">
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] uppercase text-gray-500 font-normal">
                  Dt. Cadastro
                </Label>
                <div className="h-8 bg-gray-100 flex items-center px-3 text-xs text-gray-600">
                  {formData.created
                    ? format(new Date(formData.created), 'dd/MM/yyyy HH:mm:ss')
                    : ''}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] uppercase text-gray-500 font-normal">
                  Dt. Atualização
                </Label>
                <div className="h-8 bg-gray-100 flex items-center px-3 text-xs text-gray-600">
                  {formData.updated
                    ? format(new Date(formData.updated), 'dd/MM/yyyy HH:mm:ss')
                    : ''}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[10px] uppercase text-gray-500 font-normal">
                  Atualizado por
                </Label>
                <div className="h-8 bg-gray-100 flex items-center px-3 text-xs text-gray-600">
                  {formData.atualizado_por_name}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={isSubmitting}
                className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-sm h-9 px-6"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        count={selected.length}
        onConfirm={handleDelete}
      />
    </div>
  )
}
