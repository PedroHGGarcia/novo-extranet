import { useState, useEffect, useRef } from 'react'
import {
  Package,
  Pencil,
  Copy,
  Trash2,
  UploadCloud,
  X,
  FileText,
  ListChecks,
  Undo2,
  BrainCircuit,
} from 'lucide-react'
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
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { ColumnVisibilityDropdown } from '@/components/ColumnVisibilityDropdown'
import { RichTextEditor } from '@/components/RichTextEditor'
import { cn } from '@/lib/utils'
import { z } from 'zod'
import pb from '@/lib/pocketbase/client'
import {
  getVersoes,
  createVersao,
  updateVersao,
  deleteVersao,
  getModelos,
  getVersaoImagemUrl,
  Versao,
  Modelo,
} from '@/services/produtos'

const PROPOSTAS_OPTIONS = [
  'AT - Importação Direta com 12% - 2022',
  'AT - Importação Direta: Incluso 12% + Impostos - 2024',
  'AT - Importação Direta: Incluso 13% - 2024',
  'AT - Importação Direta: Incluso 18% - 2024',
  'AT - Importação Direta: SEM 13% - 2025',
  'Capas (Apenas efeito sequencial)',
  'CNC - Nacionalizada - 2022',
  'CNC - Nacionalizada - Em trânsito - 2022',
  'CNC - Nacionalizada - Em trânsito - MVK 2616 Pro2024',
  'Convencional - Nacionalizada - 2022',
  'Convencional - Nacionalizada - Em trânsito - 2022',
  'ENTREPOSTO - Importação Direta com 12% - 2022',
  'FCS Importação Direta (FOB): SEM % - 2026',
  'FCS Nacionalizada: SEM % - 2026',
  'Importação Direta 12% + Impostos - 2024',
  'Importação Direta com 10% - 2022',
  'Importação Direta com 12% - 2022',
  'Importação Direta com 12% - Akira Seiki CIF (Estoque)',
  'Importação Direta com 12% - iCUT CIF',
  'Importação Direta sem 12% - 2023',
  'Importação Direta: Incluso 12% + Impostos - MVK 2616 Pro2024',
  'Impressão 3D - STRATASYS - Importação Direta',
  'Impressão 3D - STRATASYS - Nacionalizada',
  'KBN - Importação Direta com 12% - FOB - 2022 (Inativo)',
  'KBN - Importação Direta: Incluso 12% + Impostos - 2024',
  'MAKINO - Aluguel - 2025 48x',
  'MAKINO - Faturamento BENER - 2025',
  'MITSUBISHI - Importação Direta: Incluso 12% + Impostos - 2026',
  'MVK L - Importação Direta com 15% - 2022',
  'Nacionalizada',
  'Nacionalizada - Conteúdo Importado',
  'Nacionalizada - Estoque Coreia',
  'Nacionalizada - Reformada',
  'PRIMINER - Nacionalizada - MaaS 2025 36x',
  'SEYI - Imp. Direta: Incluso 12% + Imp - 120 dias - 10dias/2tecn - SNS2',
  'SISMA - AT - Gravação a laser - Importação Direta - 2022',
  'Torno Cabeçote Móvel - TORNOS - Importação Direta',
]

export default function Versoes() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState<Versao[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [filtered, setFiltered] = useState<Versao[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Versao | null>(null)

  // Form States
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Em Revisão' | 'Aprovado'>('Ativo')
  const [nomeAbreviado, setNomeAbreviado] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [codErp, setCodErp] = useState('')

  const [moeda, setMoeda] = useState('BRL')
  const [valor, setValor] = useState<number>(0)
  const [temFator, setTemFator] = useState(false)
  const [fatorNac, setFatorNac] = useState<number>(1)

  const [temEstoque, setTemEstoque] = useState(false)
  const [descMaxRep, setDescMaxRep] = useState(0)
  const [descMaxBener, setDescMaxBener] = useState(0)

  const [estoqueTotal, setEstoqueTotal] = useState(0)
  const [estoqueBloqueado, setEstoqueBloqueado] = useState(0)
  const [estoqueReservado, setEstoqueReservado] = useState(0)
  const [estoqueDisponivel, setEstoqueDisponivel] = useState(0)

  const [acessorios, setAcessorios] = useState('')
  const [caracteristicas, setCaracteristicas] = useState('')
  const [especificacoes, setEspecificacoes] = useState('')
  const [tiposProposta, setTiposProposta] = useState<string[]>([])

  const [nomeError, setNomeError] = useState(false)
  const [modeloError, setModeloError] = useState(false)

  const [newFoto, setNewFoto] = useState<File | null>(null)
  const [deleteFoto, setDeleteFoto] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [loadingSpecs, setLoadingSpecs] = useState(false)
  const [auditoria, setAuditoria] = useState<any[]>([])

  const colunasOptions = [
    { id: 'modelo', label: 'Modelo' },
    { id: 'nome', label: 'Nome' },
    { id: 'coderp', label: 'CodErp' },
    { id: 'imagem', label: 'Imagem' },
    { id: 'moeda', label: 'Moeda' },
    { id: 'valor', label: 'Valor' },
    { id: 'status', label: 'Status' },
  ]
  const { visibleColumns, toggleColumn } = useTablePreferences(
    'versoes_bener',
    colunasOptions.map((c) => c.id),
  )

  const loadData = async () => {
    try {
      const [vs, ms] = await Promise.all([getVersoes(), getModelos()])
      setItems(vs)
      setModelos(ms)
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('versoes', () => loadData())
  useRealtime('modelos', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter(
        (i) =>
          i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.cod_erp && i.cod_erp.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    setFiltered(result)
  }, [items, searchTerm])

  useEffect(() => {
    if (activeTab === 'historico' && editingItem) {
      pb.collection('auditoria')
        .getFullList({
          filter: `tabela = 'versoes' && registro_id = '${editingItem.id}'`,
          sort: '-created',
          expand: 'user',
        })
        .then(setAuditoria)
        .catch(() => toast({ title: 'Erro ao buscar histórico', variant: 'destructive' }))
    }
  }, [activeTab, editingItem])

  const handleEdit = (item: Versao) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setNomeAbreviado(item.nome_abreviado || '')
    setModeloId(item.modelo)
    setCodErp(item.cod_erp || '')
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setTemFator(item.tem_fator || false)
    setFatorNac(item.fator_nac || 1)
    setTemEstoque(item.tem_estoque || false)
    setDescMaxRep(item.desconto_max_representante || 0)
    setDescMaxBener(item.desconto_max_bener || 0)
    setEstoqueTotal(item.estoque_total || 0)
    setEstoqueBloqueado(item.estoque_bloqueado || 0)
    setEstoqueReservado(item.estoque_reservado || 0)
    setEstoqueDisponivel(item.estoque_disponivel || 0)
    setAcessorios(item.acessorios_standards || '')
    setCaracteristicas(item.caracteristicas_construtivas || '')
    setEspecificacoes(item.especificacoes_tecnicas || '')
    setTiposProposta(item.tipos_proposta || [])

    setNewFoto(null)
    setDeleteFoto(false)
    setNomeError(false)
    setModeloError(false)
    setActiveTab('cadastro')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta versão?')) return
    try {
      await deleteVersao(id)
      toast({ title: 'Versão excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir versão', variant: 'destructive' })
    }
  }

  const handleSuggestSpecs = async () => {
    if (!modeloId) {
      toast({ title: 'Selecione um modelo primeiro', variant: 'destructive' })
      return
    }
    const modelo = modelos.find((m) => m.id === modeloId)
    try {
      setLoadingSpecs(true)
      const res = await pb.send('/backend/v1/ai/suggest-specs', {
        method: 'POST',
        body: JSON.stringify({ modelo: modelo?.nome, produto: modelo?.expand?.produto?.nome }),
      })
      setEspecificacoes((prev) => prev + (prev ? '<br/><br/>' : '') + res.text)
      toast({ title: 'Especificações sugeridas com sucesso.' })
    } catch (err: any) {
      toast({ title: 'Erro ao gerar sugestão', description: err.message, variant: 'destructive' })
    } finally {
      setLoadingSpecs(false)
    }
  }

  const isFormValid = nome.trim() && modeloId

  const specsSchema = z.string().superRefine((val, ctx) => {
    const text = val.replace(/<[^>]*>?/gm, '').toLowerCase()
    if (
      text.includes('peso') &&
      !/\d+/.test(text.substring(text.indexOf('peso'), text.indexOf('peso') + 30))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A especificação de 'Peso' deve conter um valor numérico válido.",
      })
    }
    if (
      text.includes('altura') &&
      !/\d+/.test(text.substring(text.indexOf('altura'), text.indexOf('altura') + 30))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A especificação de 'Altura' deve conter um valor numérico válido.",
      })
    }
    if (
      text.includes('voltagem') &&
      !/\d+/.test(text.substring(text.indexOf('voltagem'), text.indexOf('voltagem') + 30))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A especificação de 'Voltagem' deve conter um valor numérico válido.",
      })
    }
  })

  const handleSave = async () => {
    setNomeError(!nome.trim())
    setModeloError(!modeloId)

    if (!isFormValid) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    const specsValidation = specsSchema.safeParse(especificacoes)
    if (!specsValidation.success) {
      toast({
        title: 'Erro na Especificação Técnica',
        description: specsValidation.error.issues[0].message,
        variant: 'destructive',
      })
      return
    }

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('status', status)
      formData.append('nome_abreviado', nomeAbreviado.trim())
      formData.append('modelo', modeloId)
      formData.append('cod_erp', codErp.trim())
      formData.append('moeda', moeda)
      formData.append('valor', String(valor))
      formData.append('tem_fator', String(temFator))
      formData.append('fator_nac', String(fatorNac))
      formData.append('tem_estoque', String(temEstoque))
      formData.append('desconto_max_representante', String(descMaxRep))
      formData.append('desconto_max_bener', String(descMaxBener))

      formData.append('acessorios_standards', acessorios)
      formData.append('caracteristicas_construtivas', caracteristicas)
      formData.append('especificacoes_tecnicas', especificacoes)
      formData.append('tipos_proposta', JSON.stringify(tiposProposta))
      formData.append('atualizado_por', user?.id)

      if (!editingItem) {
        formData.append('estoque_total', '0')
        formData.append('estoque_bloqueado', '0')
        formData.append('estoque_reservado', '0')
        formData.append('estoque_disponivel', '0')
      }

      if (deleteFoto) {
        formData.append('imagem_preview', '')
      } else if (newFoto) {
        formData.append('imagem_preview', newFoto)
      }

      if (editingItem) await updateVersao(editingItem.id, formData)
      else await createVersao(formData)

      toast({ title: `Versão ${editingItem ? 'atualizada' : 'criada'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error: any) {
      toast({ title: 'Erro ao salvar versão', description: error.message, variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setStatus('Ativo')
    setNomeAbreviado('')
    setModeloId('')
    setCodErp('')
    setMoeda('BRL')
    setValor(0)
    setTemFator(false)
    setFatorNac(1)
    setTemEstoque(false)
    setDescMaxRep(0)
    setDescMaxBener(0)
    setEstoqueTotal(0)
    setEstoqueBloqueado(0)
    setEstoqueReservado(0)
    setEstoqueDisponivel(0)
    setAcessorios('')
    setCaracteristicas('')
    setEspecificacoes('')
    setTiposProposta([])
    setNewFoto(null)
    setDeleteFoto(false)
    setNomeError(false)
    setModeloError(false)
    if (fotoInputRef.current) fotoInputRef.current.value = ''
  }

  const toggleProposta = (opt: string) => {
    if (tiposProposta.includes(opt)) {
      setTiposProposta(tiposProposta.filter((t) => t !== opt))
    } else {
      setTiposProposta([...tiposProposta, opt])
    }
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-2 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Versões</h1>
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
        <Button
          onClick={handleSave}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 text-xs font-semibold px-4"
          disabled={activeTab !== 'cadastro'}
        >
          SALVAR
        </Button>
        <Button
          onClick={resetForm}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-none h-8 px-3"
          title="Desfazer/Resetar"
          disabled={activeTab !== 'cadastro'}
        >
          <Undo2 className="h-4 w-4" />
        </Button>

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
          <TabsTrigger
            value="historico"
            disabled={!editingItem}
            className="rounded-none border border-transparent data-[state=active]:border-gray-300 data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:text-gray-800 px-6 py-2 -mb-[1px] bg-gray-50 text-gray-500 disabled:opacity-50"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-0">
          <div className="border bg-white rounded-sm shadow-sm overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <Input
                placeholder="Buscar por nome ou ERP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm h-8 text-sm bg-white"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  <TableRow className="border-b border-gray-200 hover:bg-transparent">
                    {visibleColumns.includes('modelo') && (
                      <TableHead className="font-semibold text-gray-600">Modelo</TableHead>
                    )}
                    {visibleColumns.includes('nome') && (
                      <TableHead className="font-semibold text-gray-600">Nome</TableHead>
                    )}
                    {visibleColumns.includes('coderp') && (
                      <TableHead className="font-semibold text-gray-600">CodErp</TableHead>
                    )}
                    {visibleColumns.includes('imagem') && (
                      <TableHead className="font-semibold text-gray-600 w-[80px]">Imagem</TableHead>
                    )}
                    {visibleColumns.includes('moeda') && (
                      <TableHead className="font-semibold text-gray-600">Moeda</TableHead>
                    )}
                    {visibleColumns.includes('valor') && (
                      <TableHead className="font-semibold text-gray-600 text-right">
                        Valor
                      </TableHead>
                    )}
                    {visibleColumns.includes('status') && (
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                    )}
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50/50">
                      {visibleColumns.includes('modelo') && (
                        <TableCell className="text-gray-600 py-2">
                          {item.expand?.modelo?.nome || '-'}
                        </TableCell>
                      )}
                      {visibleColumns.includes('nome') && (
                        <TableCell className="py-2">
                          <div className="font-medium text-gray-800">{item.nome}</div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-[#2A75D3]">
                            <button
                              onClick={() => handleEdit(item)}
                              className="hover:underline flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3" /> Editar
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-500 hover:underline flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Excluir
                            </button>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.includes('coderp') && (
                        <TableCell className="text-gray-600 py-2">{item.cod_erp || '-'}</TableCell>
                      )}
                      {visibleColumns.includes('imagem') && (
                        <TableCell className="py-2">
                          {item.imagem_preview && (
                            <img
                              src={getVersaoImagemUrl(item, item.imagem_preview)}
                              className="h-8 w-8 object-contain rounded border border-gray-200"
                              alt={item.nome}
                            />
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.includes('moeda') && (
                        <TableCell className="text-gray-600 py-2">{item.moeda}</TableCell>
                      )}
                      {visibleColumns.includes('valor') && (
                        <TableCell className="text-gray-600 text-right py-2">
                          {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell className="py-2">
                          <Badge variant="outline" className="font-normal text-gray-600 bg-gray-50">
                            {item.status}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="py-2"></TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full lg:w-3/4 border border-blue-200 rounded-sm bg-white shadow-sm flex flex-col">
              <div className="bg-white border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-[#2A75D3]">
                <FileText className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Dados</h3>
              </div>

              <div className="p-4 space-y-4">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-8 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      Nome {nomeError && <span className="text-red-500">*</span>}
                    </label>
                    <Input
                      value={nome}
                      onChange={(e) => {
                        setNome(e.target.value)
                        setNomeError(false)
                      }}
                      className={cn('input-bener', nomeError && 'border-red-500')}
                    />
                  </div>
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Status</label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger className="select-bener-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Em Revisão">Em Revisão</SelectItem>
                        {isAdmin && <SelectItem value="Aprovado">Aprovado</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Nome Abreviado</label>
                    <Input
                      value={nomeAbreviado}
                      onChange={(e) => setNomeAbreviado(e.target.value)}
                      className="input-bener"
                    />
                  </div>
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      Modelo {modeloError && <span className="text-red-500">*</span>}
                    </label>
                    <Select
                      value={modeloId}
                      onValueChange={(v) => {
                        setModeloId(v)
                        setModeloError(false)
                      }}
                    >
                      <SelectTrigger
                        className={cn('select-bener-trigger', modeloError && 'border-red-500')}
                      >
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelos.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Código E2Corp</label>
                    <Input
                      value={codErp}
                      onChange={(e) => setCodErp(e.target.value)}
                      className="input-bener"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-[11px] text-gray-500 mb-0.5">Imagem Principal</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-1 rounded-sm">
                    <div
                      className="text-blue-500 px-2 cursor-pointer"
                      onClick={() => fotoInputRef.current?.click()}
                    >
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs text-gray-600 truncate">
                      {newFoto
                        ? newFoto.name
                        : editingItem?.imagem_preview && !deleteFoto
                          ? getVersaoImagemUrl(editingItem, editingItem.imagem_preview)
                          : 'Nenhuma imagem selecionada'}
                    </div>
                    {(newFoto || (editingItem?.imagem_preview && !deleteFoto)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewFoto(null)
                          setDeleteFoto(true)
                        }}
                        className="text-gray-400 hover:text-red-500 pr-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fotoInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setNewFoto(e.target.files[0])
                          setDeleteFoto(false)
                        }
                        if (fotoInputRef.current) fotoInputRef.current.value = ''
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 pt-2 border-t border-red-200">
                  <div className="col-span-3 flex flex-col">
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
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Valor</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                      className="input-bener"
                    />
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Tem Fator</label>
                    <Select
                      value={temFator ? 'Sim' : 'Não'}
                      onValueChange={(v) => setTemFator(v === 'Sim')}
                    >
                      <SelectTrigger className="select-bener-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Fator Nac.</label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={fatorNac}
                      onChange={(e) => setFatorNac(parseFloat(e.target.value) || 0)}
                      className="input-bener"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 pt-2 border-t border-red-200">
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">Tem Estoque</label>
                    <Select
                      value={temEstoque ? 'Sim' : 'Não'}
                      onValueChange={(v) => setTemEstoque(v === 'Sim')}
                    >
                      <SelectTrigger className="select-bener-trigger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      Desconto Max. Representante (%)
                    </label>
                    <Input
                      type="number"
                      value={descMaxRep}
                      onChange={(e) => setDescMaxRep(parseFloat(e.target.value) || 0)}
                      className="input-bener"
                    />
                  </div>
                  <div className="col-span-4 flex flex-col">
                    <label className="text-[11px] text-gray-500 mb-0.5">
                      Desconto Max. Bener (%)
                    </label>
                    <Input
                      type="number"
                      value={descMaxBener}
                      onChange={(e) => setDescMaxBener(parseFloat(e.target.value) || 0)}
                      className="input-bener"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-4 bg-gray-100 p-2 rounded-sm border border-gray-200 mt-2">
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-0.5 uppercase">
                      Estoque Total
                    </label>
                    <Input
                      value={estoqueTotal}
                      disabled
                      className="h-7 text-xs bg-gray-200 border-none text-gray-600 rounded-sm px-2"
                    />
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-0.5 uppercase">
                      Estoque Bloqueado
                    </label>
                    <Input
                      value={estoqueBloqueado}
                      disabled
                      className="h-7 text-xs bg-gray-200 border-none text-gray-600 rounded-sm px-2"
                    />
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-0.5 uppercase">
                      Estoque Reservado
                    </label>
                    <Input
                      value={estoqueReservado}
                      disabled
                      className="h-7 text-xs bg-gray-200 border-none text-gray-600 rounded-sm px-2"
                    />
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <label className="text-[10px] text-gray-400 mb-0.5 uppercase">
                      Estoque Disponível
                    </label>
                    <Input
                      value={estoqueDisponivel}
                      disabled
                      className="h-7 text-xs bg-gray-200 border-none text-gray-600 rounded-sm px-2"
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-4 border-t border-gray-200">
                  <RichTextEditor
                    label="Acessórios Standards"
                    value={acessorios}
                    onChange={setAcessorios}
                  />
                  <RichTextEditor
                    label="Características Construtivas Principais"
                    value={caracteristicas}
                    onChange={setCaracteristicas}
                  />
                  <div className="relative">
                    <div className="absolute -top-7 right-0 z-10 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-3 text-[11px] text-[#2A75D3] border-[#2A75D3]"
                        onClick={handleSuggestSpecs}
                        disabled={loadingSpecs || !modeloId}
                      >
                        <BrainCircuit className="w-3 h-3 mr-1" />
                        {loadingSpecs ? 'Sugerindo...' : 'Sugerir Especificações'}
                      </Button>
                    </div>
                    <RichTextEditor
                      label="Especificações Técnicas Principais"
                      value={especificacoes}
                      onChange={setEspecificacoes}
                    />
                  </div>
                </div>

                <div className="pt-6 pb-2">
                  <div className="bg-gray-100 p-2 w-max rounded border border-gray-200 text-xs text-gray-500">
                    <span className="block text-[10px] text-gray-400 uppercase mb-0.5">
                      Dt. Cad
                    </span>
                    {editingItem
                      ? new Date(editingItem.created).toLocaleString('pt-BR')
                      : new Date().toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-1/4 border border-blue-200 rounded-sm bg-white shadow-sm flex flex-col">
              <div className="bg-white border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-[#2A75D3]">
                <ListChecks className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Tipos de Proposta</h3>
              </div>
              <div className="p-3 max-h-[800px] overflow-y-auto">
                <div className="space-y-1">
                  {PROPOSTAS_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-start gap-2 py-1 px-1 hover:bg-blue-50 rounded cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded-sm border-gray-300 text-[#2A75D3] focus:ring-[#2A75D3]"
                        checked={tiposProposta.includes(opt)}
                        onChange={() => toggleProposta(opt)}
                      />
                      <span className="text-[11px] text-gray-700 leading-tight group-hover:text-gray-900">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <div className="border border-blue-200 rounded-sm bg-white shadow-sm flex flex-col">
            <div className="bg-white border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-[#2A75D3]">
              <FileText className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Histórico de Alterações</h3>
            </div>
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Data/Hora</TableHead>
                    <TableHead className="w-40">Usuário</TableHead>
                    <TableHead className="w-24">Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoria.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-gray-600">
                        {new Date(a.created).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-xs text-gray-800">
                        {a.expand?.user?.name || a.expand?.user?.email || 'Sistema'}
                      </TableCell>
                      <TableCell className="text-xs capitalize text-gray-600">{a.acao}</TableCell>
                      <TableCell
                        className="text-xs text-gray-500 max-w-lg truncate"
                        title={JSON.stringify(a.dados)}
                      >
                        {JSON.stringify(a.dados)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditoria.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        Nenhum registro de auditoria encontrado para esta versão.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
