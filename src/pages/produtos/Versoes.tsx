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
  RefreshCw,
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
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
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
import { getTiposProposta, TipoProposta } from '@/services/tipos-propostas'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Versao[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [tiposPropostaDisponiveis, setTiposPropostaDisponiveis] = useState<TipoProposta[]>([])
  const [filtered, setFiltered] = useState<Versao[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Versao | null>(null)

  // Form States
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<
    'Ativo' | 'Inativo' | 'Fora de Linha' | 'Em Revisão' | 'Aprovado'
  >('Ativo')
  const [nomeAbreviado, setNomeAbreviado] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [codErp, setCodErp] = useState('')
  const [fieldErrorsMap, setFieldErrorsMap] = useState<Record<string, string>>({})

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
      setIsLoading(true)
      setError(null)
      const [vs, ms, tp] = await Promise.all([getVersoes(), getModelos(), getTiposProposta()])
      setItems(vs)
      setModelos(ms)
      setTiposPropostaDisponiveis(tp.filter((t) => t.status === 'Ativo'))
    } catch (error: any) {
      console.error('Error loading versions data:', error)
      setError(error.message || 'Erro ao carregar os dados.')
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('versoes', () => loadData())
  useRealtime('modelos', () => loadData())
  useRealtime('tipos_proposta', () => loadData())

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

  const mapCurrency = (m?: string) => {
    if (m === 'Dolar' || m === 'US$') return 'USD'
    if (m === 'Real') return 'BRL'
    if (m === 'Euro') return 'EUR'
    return m || 'BRL'
  }

  const handleEdit = (item: Versao) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setNomeAbreviado(item.nome_abreviado || '')
    setModeloId(item.modelo)
    setCodErp(item.cod_erp || '')
    setMoeda(mapCurrency(item.moeda))
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

    let parsedTipos = item.tipos_proposta || []
    if (typeof parsedTipos === 'string') {
      try {
        parsedTipos = JSON.parse(parsedTipos)
      } catch {
        parsedTipos = []
      }
    }
    setTiposProposta(Array.isArray(parsedTipos) ? parsedTipos : [])

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

  const FIELD_LABELS: Record<string, string> = {
    nome: 'Nome',
    status: 'Status',
    modelo: 'Modelo',
    cod_erp: 'Código E2Corp',
    valor: 'Valor',
    acessorios_standards: 'Acessórios Standards',
    caracteristicas_construtivas: 'Características Construtivas',
    especificacoes_tecnicas: 'Especificações Técnicas',
    atualizado_por: 'Usuário',
  }

  const handleSave = async () => {
    setFieldErrorsMap({})
    setNomeError(!nome.trim())
    setModeloError(!modeloId)

    if (!isFormValid) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
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
      formData.append('valor', String(isNaN(valor) ? 0 : valor))
      formData.append('tem_fator', String(Boolean(temFator)))
      formData.append('fator_nac', String(isNaN(fatorNac) ? 1 : fatorNac))
      formData.append('tem_estoque', String(Boolean(temEstoque)))
      formData.append('desconto_max_representante', String(isNaN(descMaxRep) ? 0 : descMaxRep))
      formData.append('desconto_max_bener', String(isNaN(descMaxBener) ? 0 : descMaxBener))

      formData.append('acessorios_standards', acessorios || '')
      formData.append('caracteristicas_construtivas', caracteristicas || '')
      formData.append('especificacoes_tecnicas', especificacoes || '')
      formData.append('tipos_proposta', JSON.stringify(tiposProposta || []))

      if (user?.id) {
        formData.append('atualizado_por', user.id)
      }

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

      if (editingItem) {
        await updateVersao(editingItem.id, formData)
      } else {
        await createVersao(formData)
      }

      await loadData()

      toast({ title: `Versão ${editingItem ? 'atualizada' : 'criada'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error: any) {
      console.error('Error saving version:', error)
      const fieldErrors = extractFieldErrors(error)
      setFieldErrorsMap(fieldErrors)

      const entries = Object.entries(fieldErrors)
      if (entries.length > 0) {
        const details = entries.map(([k, v]) => `${FIELD_LABELS[k] || k}: ${v}`).join('\n')
        toast({
          title: 'Erro de validação ao salvar versão',
          description: details,
          variant: 'destructive',
        })
      } else {
        const msg = getErrorMessage(error)
        toast({
          title: 'Erro ao salvar versão',
          description: msg || error.message || 'Falha ao atualizar o registro.',
          variant: 'destructive',
        })
      }
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
    setFieldErrorsMap({})
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
          onClick={handleSave}
          className="bg-primary hover:bg-primary/90 rounded-none h-8 text-xs font-semibold px-4 text-white"
          disabled={activeTab !== 'cadastro'}
        >
          SALVAR
        </Button>
        <Button
          onClick={resetForm}
          className="bg-primary hover:bg-primary/90 rounded-none h-8 px-3 text-white"
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
                          {(() => {
                            const m = item.moeda || 'BRL'
                            const map: Record<string, string> = {
                              Dolar: 'USD',
                              Dólar: 'USD',
                              Real: 'BRL',
                              Euro: 'EUR',
                              US$: 'USD',
                            }
                            let code = map[m] || m
                            if (!/^[A-Z]{3}$/.test(code)) code = 'BRL'
                            const locales: Record<string, string> = {
                              BRL: 'pt-BR',
                              USD: 'en-US',
                              EUR: 'de-DE',
                            }
                            const locale = locales[code] || 'pt-BR'
                            try {
                              return new Intl.NumberFormat(locale, {
                                style: 'currency',
                                currency: code,
                              }).format(item.valor || 0)
                            } catch {
                              return `${code} ${Number(item.valor || 0).toFixed(2)}`
                            }
                          })()}
                        </TableCell>
                      )}
                      {visibleColumns.includes('status') && (
                        <TableCell className="py-2">
                          {item.status === 'Ativo' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                              {item.status}
                            </span>
                          ) : item.status === 'Aprovado' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              {item.status}
                            </span>
                          ) : item.status === 'Em Revisão' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700">
                              {item.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              {item.status}
                            </span>
                          )}
                        </TableCell>
                      )}
                      <TableCell className="py-2"></TableCell>
                    </TableRow>
                  ))}
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
                          <span className="ml-2">Carregando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-sm font-medium text-red-500 mb-2">
                            Erro ao carregar dados
                          </p>
                          <p className="text-xs text-gray-400 mb-4">{error}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadData}
                            className="flex items-center gap-2"
                          >
                            <RefreshCw className="w-4 h-4" /> Tentar Novamente
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cadastro" className="mt-0">
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <div className="w-full lg:w-3/4 border border-primary/20 rounded-sm bg-white shadow-sm flex flex-col">
              <div className="bg-white border-b border-primary/20 px-4 py-2 flex items-center gap-2 text-primary">
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
                        <SelectItem value="Fora de Linha">Fora de Linha</SelectItem>
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
                        <SelectItem value="BRL">Real - R$</SelectItem>
                        <SelectItem value="USD">Dólar - $</SelectItem>
                        <SelectItem value="EUR">Euro - €</SelectItem>
                      </SelectContent>{' '}
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
                    onChange={(val: string) => setAcessorios(val ?? '')}
                  />
                  <RichTextEditor
                    label="Características Construtivas Principais"
                    value={caracteristicas}
                    onChange={(val: string) => setCaracteristicas(val ?? '')}
                  />
                  <div className="relative">
                    <div className="absolute -top-7 right-0 z-10 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-3 text-[11px] text-primary border-primary"
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
                      onChange={(val: string) => setEspecificacoes(val ?? '')}
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

            <div className="w-full lg:w-1/4 border border-primary/20 rounded-sm bg-white shadow-sm flex flex-col">
              <div className="bg-white border-b border-primary/20 px-4 py-2 flex items-center gap-2 text-primary">
                <ListChecks className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Tipos de Proposta</h3>
              </div>
              <div className="p-3 max-h-[800px] overflow-y-auto">
                <div className="space-y-1">
                  {tiposPropostaDisponiveis.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-start gap-2 py-1 px-1 hover:bg-blue-50 rounded cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded-sm border-gray-300 text-primary focus:ring-primary"
                        checked={tiposProposta.includes(opt.id)}
                        onChange={() => toggleProposta(opt.id)}
                      />
                      <span className="text-[11px] text-gray-700 leading-tight group-hover:text-gray-900">
                        {opt.nome}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <div className="border border-primary/20 rounded-sm bg-white shadow-sm flex flex-col">
            <div className="bg-white border-b border-primary/20 px-4 py-2 flex items-center gap-2 text-primary">
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
