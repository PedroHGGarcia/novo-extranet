import { useState, useEffect } from 'react'
import {
  UserCircle,
  Loader2,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react'
import { PageLayout } from '@/components/PageLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getClientesPaginated,
  createCliente,
  updateCliente,
  deleteCliente,
  getByDocumento,
  getDocumentosCliente,
  createDocumentoCliente,
  deleteDocumentoCliente,
} from '@/services/cadastros'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

const InputField = ({ label, variant = 'red', type = 'text', readOnly, ...props }: any) => (
  <div className="flex flex-col w-full">
    <label className="text-[10px] text-slate-400 font-bold mb-1 tracking-tight">{label}</label>
    <input
      type={type}
      readOnly={readOnly}
      className={`bg-transparent border-b ${
        variant === 'red' ? 'border-red-600/80' : 'border-slate-600/80'
      } text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400 transition-colors w-full ${
        readOnly ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      {...props}
    />
  </div>
)

const SelectField = ({ label, variant = 'red', value, onChange, options }: any) => (
  <div className="flex flex-col w-full">
    <label className="text-[10px] text-slate-400 font-bold mb-1 tracking-tight">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className={`bg-transparent border-b ${
        variant === 'red' ? 'border-red-600/80' : 'border-slate-600/80'
      } text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400 transition-colors w-full [&>option]:bg-[#1e252b]`}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
)

type Contato = { id: string; nome: string; telefone: string; email: string; observacoes: string }
type Documento = {
  id?: string
  tipo: string
  file?: File | null
  arquivoUrl?: string
  arquivoNome?: string
  deleted?: boolean
}

export default function Clientes() {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)

  const defaultForm = {
    id: '',
    documento: '',
    status: 'Ativo',
    razao_social: '',
    fantasia: '',
    contato: '',
    telefone: '',
    telefone_2: '',
    telefone_3: '',
    email: '',
    email_fiscal: '',
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    logradouro: '',
    numero: '',
    complementos: '',
    dt_cad: new Date().toLocaleString('pt-BR'),
  }

  const [formData, setFormData] = useState(defaultForm)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadData = async () => {
    try {
      let filter = ''
      if (debouncedSearch) {
        const s = debouncedSearch.replace(/"/g, '\\"')
        filter = `fantasia ~ "${s}" || documento ~ "${s}" || contato ~ "${s}"`
      }
      const res = await getClientesPaginated(page, perPage, filter)
      setData(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (e) {
      setData([])
      setTotalItems(0)
      setTotalPages(0)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, debouncedSearch])

  useRealtime('clientes', loadData)

  const resetForm = () => {
    setFormData(defaultForm)
    setContatos([])
    setDocumentos([])
    setConflictRecord(null)
  }

  const handleEdit = async (item: any) => {
    const clearName = (item.fantasia || '').replace(/EditarDuplicar$/i, '').trim()
    setFormData({
      id: item.id,
      documento: item.documento || '',
      status: item.status || 'Ativo',
      razao_social: item.razao_social || '',
      fantasia: clearName,
      contato: item.contato || '',
      telefone: item.telefone || '',
      telefone_2: item.telefone_2 || '',
      telefone_3: item.telefone_3 || '',
      email: item.email || '',
      email_fiscal: item.email_fiscal || '',
      cep: item.cep || '',
      estado: item.estado || '',
      cidade: item.cidade || '',
      bairro: item.bairro || '',
      logradouro: item.logradouro || '',
      numero: item.numero || '',
      complementos: item.complementos || '',
      dt_cad: item.dt_cad || new Date().toLocaleString('pt-BR'),
    })

    const parsedContatos = Array.isArray(item.contatos_adicionais) ? item.contatos_adicionais : []
    setContatos(parsedContatos.map((c: any) => ({ id: crypto.randomUUID(), ...c })))

    try {
      const docs = await getDocumentosCliente(item.id)
      setDocumentos(
        docs.map((d) => ({
          id: d.id,
          tipo: d.tipo,
          arquivoUrl: pb.files.getURL(d, d.arquivo),
          arquivoNome: d.arquivo,
        })),
      )
    } catch (e) {
      setDocumentos([])
    }

    setView('form')
  }

  const handleDuplicate = (item: any) => {
    handleEdit(item).then(() => {
      setFormData((prev) => ({
        ...prev,
        id: '',
        documento: '',
        fantasia: prev.fantasia ? `${prev.fantasia} (Cópia)` : '',
        dt_cad: new Date().toLocaleString('pt-BR'),
      }))
      setDocumentos([])
    })
  }

  const toggleAll = () =>
    setSelected(selected.length === data.length && data.length > 0 ? [] : data.map((d) => d.id))
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteCliente(id)))
      setSelected([])
      toast({ title: 'Registros excluídos com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const saveDocuments = async (clienteId: string) => {
    for (const doc of documentos) {
      if (doc.deleted && doc.id) {
        await deleteDocumentoCliente(doc.id)
      } else if (doc.file && !doc.deleted) {
        const fd = new FormData()
        fd.append('cliente', clienteId)
        fd.append('tipo', doc.tipo)
        fd.append('arquivo', doc.file)
        await createDocumentoCliente(fd)
      }
    }
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      if (!formData.documento) throw new Error('CPF/CNPJ é obrigatório')
      if (!formData.fantasia) throw new Error('Nome Fantasia é obrigatório')

      const dataToSave = {
        ...formData,
        contatos_adicionais: contatos.map(({ id, ...rest }) => rest),
      }

      let clienteId = formData.id

      if (clienteId) {
        await updateCliente(clienteId, dataToSave)
      } else {
        const existing = await getByDocumento('clientes', formData.documento)
        if (existing) {
          setConflictRecord(existing)
          setIsConflictOpen(true)
          setIsSubmitting(false)
          return
        }
        const created = await createCliente(dataToSave)
        clienteId = created.id
      }

      await saveDocuments(clienteId)

      toast({ title: 'Registro salvo com sucesso' })
      resetForm()
      setView('list')
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      const msg = Object.values(errs)[0] || err.message || 'Erro ao salvar'
      toast({ title: msg, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    try {
      setIsSubmitting(true)
      await updateCliente(conflictRecord.id, {
        ...formData,
        contatos_adicionais: contatos.map(({ id, ...rest }) => rest),
      })
      await saveDocuments(conflictRecord.id)
      setIsConflictOpen(false)
      resetForm()
      setView('list')
      toast({ title: 'Registro substituído com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao substituir', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMerge = async () => {
    try {
      setIsSubmitting(true)
      const mergedData = { ...conflictRecord }
      for (const [key, value] of Object.entries(formData)) {
        if (value && String(value).trim() !== '' && key !== 'id') {
          mergedData[key] = value
        }
      }
      mergedData.contatos_adicionais = contatos.map(({ id, ...rest }) => rest)

      await updateCliente(conflictRecord.id, mergedData)
      await saveDocuments(conflictRecord.id)
      setIsConflictOpen(false)
      resetForm()
      setView('list')
      toast({ title: 'Registros mesclados com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao mesclar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const Toolbar = () => (
    <div className="flex justify-between items-center bg-[#242c33] p-3 border-b border-[#313b45]">
      <div className="flex gap-[2px]">
        {view === 'list' ? (
          <>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={() => setShowSearch(!showSearch)}
            >
              PESQUISAR
            </Button>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={() => {
                resetForm()
                setView('form')
              }}
            >
              NOVO
            </Button>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={() =>
                selected.length > 0
                  ? setIsDeleteOpen(true)
                  : toast({ title: 'Selecione registros' })
              }
            >
              EXCLUIR
            </Button>
          </>
        ) : (
          <>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={() => setView('list')}
            >
              PESQUISAR
            </Button>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={() => {
                resetForm()
                setView('form')
              }}
            >
              NOVO
            </Button>
            <Button
              className="bg-[#188bf6] hover:bg-[#1578d4] text-white rounded-sm h-8 px-5 text-xs font-bold shadow-none"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> : null}
              SALVAR
            </Button>
          </>
        )}
      </div>
      {view === 'list' && (
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <Select
            value={String(perPage)}
            onValueChange={(val) => {
              setPerPage(Number(val))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-7 text-xs border-[#313b45] bg-[#1e252b] text-white w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e252b] border-[#313b45] text-white">
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>
            {totalItems > 0 ? Math.min((page - 1) * perPage + 1, totalItems) : 0} -{' '}
            {Math.min(page * perPage, totalItems)} de {totalItems.toLocaleString('pt-BR')}
          </span>
          <div className="flex gap-1 items-center">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-[#313b45] bg-[#1e252b] text-white hover:bg-[#242c33]"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="px-2 text-white">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0 border-[#313b45] bg-[#1e252b] text-white hover:bg-[#242c33]"
              disabled={page >= totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageLayout title="Clientes" icon={UserCircle}>
      <div className="bg-[#1e252b] rounded-md shadow-lg border border-[#313b45] overflow-hidden flex flex-col text-slate-200">
        <div className="flex bg-[#242c33] border-b border-[#313b45] px-2 pt-2">
          <button
            className={`px-6 py-2.5 text-sm font-bold rounded-t-sm transition-colors ${
              view === 'list'
                ? 'bg-[#1e252b] border-t-[3px] border-cyan-500 text-white'
                : 'text-cyan-500 hover:text-cyan-400'
            }`}
            onClick={() => setView('list')}
          >
            Registros
          </button>
          <button
            className={`px-6 py-2.5 text-sm font-bold rounded-t-sm transition-colors ${
              view === 'form'
                ? 'bg-[#1e252b] border-t-[3px] border-cyan-500 text-white'
                : 'text-cyan-500 hover:text-cyan-400'
            }`}
            onClick={() => setView('form')}
          >
            Cadastro
          </button>
        </div>

        <Toolbar />

        {view === 'list' ? (
          <>
            {showSearch && (
              <div className="p-3 bg-[#242c33] border-b border-[#313b45] animate-in slide-in-from-top-2">
                <Input
                  placeholder="Buscar por fantasia, documento ou contato..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-md h-9 text-sm bg-[#1e252b] border-[#313b45] text-white placeholder:text-slate-500"
                  autoFocus
                />
              </div>
            )}
            <div className="overflow-x-auto min-h-[500px]">
              <Table className="min-w-full text-xs">
                <TableHeader className="bg-[#242c33]">
                  <TableRow className="border-b border-[#313b45] hover:bg-transparent">
                    <TableHead className="w-12 px-4 py-3">
                      <Checkbox
                        checked={selected.length === data.length && data.length > 0}
                        onCheckedChange={toggleAll}
                        className="rounded-full border-slate-400 data-[state=checked]:bg-[#188bf6] data-[state=checked]:border-[#188bf6]"
                      />
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                      Fantasia
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                      Contato
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                      Telefone / Celular
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                      E-mail
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                      Data Cad.
                    </TableHead>
                    <TableHead className="py-3 text-white font-bold whitespace-nowrap w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const clearFantasia = (item.fantasia || '')
                      .replace(/EditarDuplicar$/i, '')
                      .trim()
                    return (
                      <TableRow
                        key={item.id}
                        className="border-b border-[#313b45] hover:bg-[#242c33]/80 group"
                      >
                        <TableCell className="px-4 py-3 align-top">
                          <Checkbox
                            checked={selected.includes(item.id)}
                            onCheckedChange={() => toggleOne(item.id)}
                            className="rounded-full border-slate-400 data-[state=checked]:bg-[#188bf6] data-[state=checked]:border-[#188bf6] mt-0.5"
                          />
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-white font-bold text-sm tracking-tight block">
                              {clearFantasia}
                            </span>
                            <div className="flex gap-2 text-[11px] text-slate-400 mt-1 select-none items-center">
                              <button
                                onClick={() => handleEdit(item)}
                                className="hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                              >
                                <Pencil size={11} /> Editar
                              </button>
                              <span className="text-slate-600">|</span>
                              <button
                                onClick={() => handleDuplicate(item)}
                                className="hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                              >
                                <Copy size={11} /> Duplicar
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 align-top text-slate-300">
                          {item.contato}
                        </TableCell>
                        <TableCell className="py-3 align-top text-slate-300 whitespace-nowrap">
                          {item.telefone && <div>{item.telefone}</div>}
                          {item.celular && (
                            <div className="text-slate-500 mt-1">{item.celular}</div>
                          )}
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          <a
                            href={`mailto:${item.email}`}
                            className="text-cyan-400 hover:underline"
                          >
                            {item.email}
                          </a>
                        </TableCell>
                        <TableCell className="py-3 align-top text-slate-400 whitespace-nowrap">
                          {item.dt_cad}
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          {item.status === 'Ativo' && (
                            <div className="flex justify-center" title="Ativo">
                              <CheckCircle2 size={16} className="text-green-500" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-[#313b45]">
              <Toolbar />
            </div>
          </>
        ) : (
          <div className="p-6 bg-[#1e252b] min-h-[500px]">
            <div className="space-y-6 max-w-6xl">
              {/* Row 1 */}
              <div className="grid grid-cols-[1fr_200px] gap-8">
                <InputField
                  label="CPF/CNPJ"
                  variant="red"
                  value={formData.documento}
                  onChange={(e: any) => setFormData({ ...formData, documento: e.target.value })}
                />
                <SelectField
                  label="Status"
                  variant="red"
                  value={formData.status}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { label: 'Ativo', value: 'Ativo' },
                    { label: 'Inativo', value: 'Inativo' },
                  ]}
                />
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-2 gap-8">
                <InputField
                  label="Razão Social"
                  variant="red"
                  value={formData.razao_social}
                  onChange={(e: any) => setFormData({ ...formData, razao_social: e.target.value })}
                />
                <InputField
                  label="Nome Fantasia"
                  variant="red"
                  value={formData.fantasia}
                  onChange={(e: any) => setFormData({ ...formData, fantasia: e.target.value })}
                />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-8">
                <InputField
                  label="Contato"
                  variant="red"
                  value={formData.contato}
                  onChange={(e: any) => setFormData({ ...formData, contato: e.target.value })}
                />
                <InputField
                  label="Telefone 1"
                  variant="red"
                  value={formData.telefone}
                  onChange={(e: any) => setFormData({ ...formData, telefone: e.target.value })}
                />
                <InputField
                  label="Telefone 2"
                  variant="gray"
                  value={formData.telefone_2}
                  onChange={(e: any) => setFormData({ ...formData, telefone_2: e.target.value })}
                />
                <InputField
                  label="Telefone 3"
                  variant="gray"
                  value={formData.telefone_3}
                  onChange={(e: any) => setFormData({ ...formData, telefone_3: e.target.value })}
                />
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-2 gap-8">
                <InputField
                  label="Email"
                  variant="red"
                  type="email"
                  value={formData.email}
                  onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
                />
                <InputField
                  label="Email Fiscal"
                  variant="gray"
                  type="email"
                  value={formData.email_fiscal}
                  onChange={(e: any) => setFormData({ ...formData, email_fiscal: e.target.value })}
                />
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-[1fr_1fr_2fr_2fr] gap-8">
                <InputField
                  label="Cep"
                  variant="red"
                  value={formData.cep}
                  onChange={(e: any) => setFormData({ ...formData, cep: e.target.value })}
                />
                <InputField
                  label="Estado"
                  variant="red"
                  value={formData.estado}
                  onChange={(e: any) => setFormData({ ...formData, estado: e.target.value })}
                />
                <InputField
                  label="Cidade"
                  variant="red"
                  value={formData.cidade}
                  onChange={(e: any) => setFormData({ ...formData, cidade: e.target.value })}
                />
                <InputField
                  label="Bairro"
                  variant="gray"
                  value={formData.bairro}
                  onChange={(e: any) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-[3fr_1fr_2fr] gap-8">
                <InputField
                  label="Logradouro"
                  variant="red"
                  value={formData.logradouro}
                  onChange={(e: any) => setFormData({ ...formData, logradouro: e.target.value })}
                />
                <InputField
                  label="Número"
                  variant="red"
                  value={formData.numero}
                  onChange={(e: any) => setFormData({ ...formData, numero: e.target.value })}
                />
                <InputField
                  label="Complementos"
                  variant="gray"
                  value={formData.complementos}
                  onChange={(e: any) => setFormData({ ...formData, complementos: e.target.value })}
                />
              </div>

              {/* Row 7 */}
              <div className="grid grid-cols-1 gap-8">
                <InputField label="Dt. Cad" variant="gray" readOnly value={formData.dt_cad} />
              </div>

              {/* Contatos Section */}
              <div className="border-t-[3px] border-cyan-500 pt-0 mt-8 rounded-t-sm overflow-hidden bg-[#242c33]">
                <div className="flex items-center gap-2 p-2 bg-[#242c33]">
                  <UserCircle size={18} className="text-white" />
                  <span className="text-white font-bold text-[13px]">
                    Contatos ({contatos.length})
                  </span>
                  <button
                    onClick={() =>
                      setContatos([
                        ...contatos,
                        {
                          id: crypto.randomUUID(),
                          nome: '',
                          telefone: '',
                          email: '',
                          observacoes: '',
                        },
                      ])
                    }
                    className="ml-auto bg-[#188bf6] hover:bg-[#1578d4] p-1 rounded-sm text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="p-3 bg-[#1e252b]">
                  {contatos.length > 0 && (
                    <div className="grid grid-cols-[2fr_1fr_2fr_3fr_30px] gap-4 pb-2 border-b border-[#313b45] mb-3">
                      <div className="text-[11px] font-bold text-slate-200">Nome</div>
                      <div className="text-[11px] font-bold text-slate-200">Telefone</div>
                      <div className="text-[11px] font-bold text-slate-200">E-mail</div>
                      <div className="text-[11px] font-bold text-slate-200">Observações</div>
                      <div></div>
                    </div>
                  )}
                  {contatos.map((c, i) => (
                    <div
                      key={c.id}
                      className="grid grid-cols-[2fr_1fr_2fr_3fr_30px] gap-4 mb-3 items-center"
                    >
                      <input
                        className="bg-transparent border-b border-slate-600/80 text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400"
                        value={c.nome}
                        onChange={(e) => {
                          const n = [...contatos]
                          n[i].nome = e.target.value
                          setContatos(n)
                        }}
                      />
                      <input
                        className="bg-transparent border-b border-slate-600/80 text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400"
                        value={c.telefone}
                        onChange={(e) => {
                          const n = [...contatos]
                          n[i].telefone = e.target.value
                          setContatos(n)
                        }}
                      />
                      <input
                        className="bg-transparent border-b border-slate-600/80 text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400"
                        value={c.email}
                        onChange={(e) => {
                          const n = [...contatos]
                          n[i].email = e.target.value
                          setContatos(n)
                        }}
                      />
                      <input
                        className="bg-transparent border-b border-slate-600/80 text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400"
                        value={c.observacoes}
                        onChange={(e) => {
                          const n = [...contatos]
                          n[i].observacoes = e.target.value
                          setContatos(n)
                        }}
                      />
                      <button
                        onClick={() => setContatos(contatos.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-300 ml-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {contatos.length === 0 && (
                    <div className="text-xs text-slate-500 italic py-2">
                      Nenhum contato adicional.
                    </div>
                  )}
                </div>
              </div>

              {/* Documentos Section */}
              <div className="border-t-[3px] border-cyan-500 pt-0 mt-8 rounded-t-sm overflow-hidden bg-[#242c33]">
                <div className="flex items-center gap-2 p-2 bg-[#242c33]">
                  <FileText size={18} className="text-white" />
                  <span className="text-white font-bold text-[13px]">
                    Documentos ({documentos.filter((d) => !d.deleted).length})
                  </span>
                  <button
                    onClick={() => setDocumentos([...documentos, { tipo: 'Tipo do Documento' }])}
                    className="ml-auto bg-[#188bf6] hover:bg-[#1578d4] p-1 rounded-sm text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="p-3 bg-[#1e252b]">
                  {documentos.filter((d) => !d.deleted).length > 0 && (
                    <div className="grid grid-cols-[1fr_2fr_30px] gap-4 pb-2 border-b border-[#313b45] mb-3">
                      <div className="text-[11px] font-bold text-slate-200">Tipo do Documento</div>
                      <div className="text-[11px] font-bold text-slate-200">
                        Arquivo (.pdf, .jpg)
                      </div>
                      <div></div>
                    </div>
                  )}
                  {documentos.map((d, i) => {
                    if (d.deleted) return null
                    return (
                      <div
                        key={d.id || i}
                        className="grid grid-cols-[1fr_2fr_30px] gap-4 mb-3 items-center"
                      >
                        <select
                          className="bg-transparent border-b border-slate-600/80 text-sm text-slate-200 py-1 focus:outline-none focus:border-cyan-400 [&>option]:bg-[#1e252b]"
                          value={d.tipo}
                          onChange={(e) => {
                            const n = [...documentos]
                            n[i].tipo = e.target.value
                            setDocumentos(n)
                          }}
                        >
                          <option value="Tipo do Documento">Tipo do Documento</option>
                          <option value="Contrato Social">Contrato Social</option>
                          <option value="Comprovante de Endereço">Comprovante de Endereço</option>
                          <option value="Documento Pessoal">Documento Pessoal</option>
                          <option value="Outros">Outros</option>
                        </select>
                        <div className="flex items-center">
                          {d.arquivoNome && !d.file ? (
                            <div className="flex items-center gap-3">
                              <a
                                href={d.arquivoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-cyan-400 text-sm hover:underline flex items-center gap-1"
                              >
                                <FileText size={14} />
                                {d.arquivoNome}
                              </a>
                              <button
                                onClick={() => {
                                  const n = [...documentos]
                                  n[i].file = null
                                  n[i].arquivoNome = ''
                                  setDocumentos(n)
                                }}
                                className="text-xs text-slate-400 hover:text-slate-300"
                              >
                                Trocar
                              </button>
                            </div>
                          ) : (
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const n = [...documentos]
                                  n[i].file = file
                                  setDocumentos(n)
                                }
                              }}
                              className="text-sm text-slate-300 file:bg-[#242c33] file:text-slate-300 file:border file:border-[#313b45] file:px-3 file:py-1 file:rounded-sm file:mr-3 hover:file:bg-[#313b45] file:cursor-pointer file:transition-colors w-full"
                            />
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const n = [...documentos]
                            n[i].deleted = true
                            setDocumentos(n)
                          }}
                          className="text-red-400 hover:text-red-300 ml-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })}
                  {documentos.filter((d) => !d.deleted).length === 0 && (
                    <div className="text-xs text-slate-500 italic py-2">
                      Nenhum documento anexado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        count={selected.length}
        onConfirm={handleDelete}
      />
      <DuplicateConflictDialog
        open={isConflictOpen}
        onOpenChange={setIsConflictOpen}
        onReplace={handleReplace}
        onMerge={handleMerge}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  )
}
