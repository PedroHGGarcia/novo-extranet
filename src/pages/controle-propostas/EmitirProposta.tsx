import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Pencil,
  List,
  Eye,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  History,
  ArrowRight,
  FileText,
  Upload,
  PenTool,
  CheckCircle,
  Search,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImportadorInteligente, type ImportConfig } from '@/components/ImportadorInteligente'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPropostasPaginated, updateProposta, type Proposta } from '@/services/propostas'
import { getTiposProposta, type TipoProposta } from '@/services/tipos-propostas'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { PropostaDocument } from '@/components/PropostaDocument'
import { ProposalHistory } from '@/components/ProposalHistory'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { DialogFooter } from '@/components/ui/dialog'
import { SignaturePad } from '@/components/SignaturePad'
import { SearchableCombobox } from '@/components/SearchableCombobox'
import { getErrorMessage } from '@/lib/pocketbase/errors'

const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[currency] || currency || 'BRL'
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: code,
    }).format(value)
  } catch (e) {
    return `${code} ${value}`
  }
}

const CurrencyInput = ({
  value,
  onChange,
  currency,
  className,
  readOnly,
  onClick,
}: {
  value: number | undefined
  onChange: (val: number) => void
  currency: string
  className: string
  readOnly?: boolean
  onClick?: () => void
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [localValue, setLocalValue] = useState('')

  useEffect(() => {
    if (!isFocused) {
      if (value === undefined || value === null) {
        setLocalValue('')
      } else {
        setLocalValue(formatCurrency(value, currency))
      }
    }
  }, [value, currency, isFocused])

  return (
    <input
      type={isFocused && !readOnly ? 'number' : 'text'}
      className={className}
      value={isFocused && !readOnly ? (value ?? '') : localValue}
      onFocus={() => !readOnly && setIsFocused(true)}
      onBlur={() => !readOnly && setIsFocused(false)}
      onChange={(e) => {
        if (readOnly) return
        const val = parseFloat(e.target.value)
        onChange(isNaN(val) ? 0 : val)
      }}
      readOnly={readOnly}
      onClick={onClick}
      step="0.01"
    />
  )
}

export default function EmitirProposta() {
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState('registros')
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortField, setSortField] = useState<string>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [gerentes, setGerentes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [versoes, setVersoes] = useState<any[]>([])
  const [tiposProposta, setTiposProposta] = useState<TipoProposta[]>([])

  const [formData, setFormData] = useState<Partial<Proposta>>({})
  const [initialFormData, setInitialFormData] = useState<Partial<Proposta>>({})
  const [acessoriosProposta, setAcessoriosProposta] = useState<any[]>([])
  const [initialAcessorios, setInitialAcessorios] = useState<any[]>([])

  // Local UI states for fields not directly in the Proposta schema
  const [estoqueUI, setEstoqueUI] = useState('')
  const [propostaSignatureBlob, setPropostaSignatureBlob] = useState<Blob | null>(null)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sectorFilter, setSectorFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [setores, setSetores] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  const [exchangeRates, setExchangeRates] = useState<{
    USD: number
    EUR: number
    usdPct: number
    eurPct: number
  } | null>(null)
  const [exchangeRatesLoading, setExchangeRatesLoading] = useState(true)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyProposta, setHistoryProposta] = useState<Proposta | null>(null)
  const [historyLogs, setHistoryLogs] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewProposta, setViewProposta] = useState<Proposta | null>(null)

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [isSavingSignature, setIsSavingSignature] = useState(false)
  const signatureFileInputRef = useRef<HTMLInputElement>(null)

  const [avancarPropostaItem, setAvancarPropostaItem] = useState<Proposta | null>(null)
  const [novoStatus, setNovoStatus] = useState<string>('')

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  const importConfig: ImportConfig = {
    collection: 'propostas',
    title: 'Importar Propostas',
    fields: [
      { key: 'numero_proposta', label: 'Nº Proposta', type: 'text', required: true },
      { key: 'revisao', label: 'Revisão', type: 'text' },
      {
        key: 'cliente',
        label: 'Cliente (Relacionamento)',
        type: 'relation',
        relation: {
          collection: 'clientes',
          searchFields: ['documento', 'razao_social', 'fantasia'],
          displayField: 'fantasia',
        },
      },
      { key: 'cliente_original', label: 'Cliente (Texto Original)', type: 'text' },
      { key: 'contato', label: 'Contato', type: 'text' },
      { key: 'telefone', label: 'Telefone', type: 'text' },
      {
        key: 'versao',
        label: 'Versão (Relacionamento)',
        type: 'relation',
        relation: {
          collection: 'versoes',
          searchFields: ['cod_erp', 'nome'],
          displayField: 'nome',
        },
      },
      { key: 'versao_original', label: 'Versão (Texto Original)', type: 'text' },
      {
        key: 'representante',
        label: 'Representante (Relacionamento)',
        type: 'relation',
        relation: {
          collection: 'representantes',
          searchFields: ['documento', 'fantasia'],
          displayField: 'fantasia',
        },
      },
      { key: 'representante_original', label: 'Representante (Texto Original)', type: 'text' },
      {
        key: 'gerente',
        label: 'Gerente (Relacionamento)',
        type: 'relation',
        relation: {
          collection: 'gerentes',
          searchFields: ['nome'],
          displayField: 'nome',
        },
      },
      { key: 'gerente_original', label: 'Gerente (Texto Original)', type: 'text' },
      {
        key: 'user',
        label: 'Usuário',
        type: 'relation',
        relation: {
          collection: 'users',
          searchFields: ['email', 'name'],
          displayField: 'name',
        },
      },
      { key: 'nota_rep', label: 'Nota Rep.', type: 'number' },
      { key: 'dt_cad', label: 'Data Cadastro', type: 'date' },
      { key: 'moeda', label: 'Moeda', type: 'text' },
      { key: 'valor_sem_desconto', label: 'Valor sem desc.', type: 'number' },
      { key: 'percentual_desconto', label: 'Desconto (%)', type: 'number' },
      { key: 'valor_atual', label: 'Valor Atual', type: 'number' },
      { key: 'valor_final', label: 'Valor Final', type: 'number' },
      { key: 'prazo_entrega', label: 'Prazo Entrega', type: 'text' },
      { key: 'condicoes_pagamento', label: 'Cond. Pagamento', type: 'text' },
    ],
    onSuccess: () => loadData(),
  }

  useEffect(() => {
    let isMounted = true
    fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setExchangeRates({
            USD: parseFloat(data.USDBRL.bid),
            usdPct: parseFloat(data.USDBRL.pctChange),
            EUR: parseFloat(data.EURBRL.bid),
            eurPct: parseFloat(data.EURBRL.pctChange),
          })
        }
      })
      .catch(() => {
        if (isMounted) setExchangeRates(null)
      })
      .finally(() => {
        if (isMounted) setExchangeRatesLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    pb.collection('users')
      .getFullList()
      .then((users) => {
        const uniqueSetores = Array.from(
          new Set(users.map((u: any) => u.setor).filter(Boolean)),
        ).sort()
        setSetores(uniqueSetores)
      })
      .catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField
      const filters: string[] = []
      if (activeTab === 'excluidas') {
        filters.push("status = 'Excluída'")
      } else {
        filters.push("(status = 'Em Análise' || status = '')")
      }

      if (sectorFilter) {
        const sectorUsers = await pb.collection('users').getFullList({
          filter: `setor = "${sectorFilter}"`,
        })
        if (sectorUsers.length > 0) {
          const userFilter = sectorUsers.map((u: any) => `user = "${u.id}"`).join(' || ')
          filters.push(`(${userFilter})`)
        } else {
          filters.push('id = "nonexistent"')
        }
      }

      if (debouncedSearch.trim()) {
        const matchingUsers = await pb.collection('users').getList(1, 50, {
          filter: `name ~ "${debouncedSearch.trim()}"`,
        })
        if (matchingUsers.items.length > 0) {
          const userFilter = matchingUsers.items.map((u: any) => `user = "${u.id}"`).join(' || ')
          filters.push(`(${userFilter})`)
        } else {
          filters.push('id = "nonexistent"')
        }
      }

      const filterParam = filters.join(' && ')
      const res = await getPropostasPaginated(page, perPage, sortParam, filterParam)
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (error) {
      console.error('Failed to load propostas', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'registros' || activeTab === 'excluidas') {
      loadData()
    }
  }, [page, perPage, sortField, sortDirection, activeTab, sectorFilter, debouncedSearch])

  useEffect(() => {
    getTiposProposta()
      .then(setTiposProposta)
      .catch(() => {})
    pb.collection('gerentes')
      .getFullList({ sort: 'nome', expand: 'usuario' })
      .then(setGerentes)
      .catch(() => {})
    pb.collection('clientes')
      .getFullList({ sort: 'fantasia' })
      .then(setClientes)
      .catch(() => {})
    pb.collection('representantes')
      .getFullList({ sort: 'fantasia' })
      .then(setRepresentantes)
      .catch(() => {})
    pb.collection('versoes')
      .getFullList({ sort: 'nome', expand: 'modelo.marca,modelo.produto.categoria' })
      .then(setVersoes)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'cadastro' || activeTab === 'cadastro_licitacao') {
      if (selectedProposta) {
        const mapCurrency = (m?: string) => {
          if (m === 'Dolar' || m === 'US$') return 'USD'
          if (m === 'Real') return 'BRL'
          if (m === 'Euro') return 'EUR'
          return m || 'USD'
        }
        const mappedData = {
          ...selectedProposta,
          revisao: selectedProposta.revisao || 'A',
          moeda: mapCurrency(selectedProposta.moeda),
          valor_sem_desconto: selectedProposta.valor_sem_desconto || 0,
          valor_atual: selectedProposta.valor_atual || 0,
          valor_final: selectedProposta.valor_final || 0,
          percentual_desconto: selectedProposta.percentual_desconto || 0,
          nota_rep: selectedProposta.nota_rep || 1,
        }
        setFormData(mappedData)
        setInitialFormData(mappedData)

        if (
          selectedProposta.acessorios_proposta &&
          selectedProposta.acessorios_proposta.length > 0
        ) {
          const buildMappedAcc = () =>
            selectedProposta.acessorios_proposta.map((a: any) => {
              let estado = a.estado
              if (!estado) {
                if (a.incluir) estado = 'incluir'
                else if (a.exibir) estado = 'exibir'
                else estado = 'nao_exibir'
              }
              return { ...a, estado }
            })
          setAcessoriosProposta(buildMappedAcc())
          setInitialAcessorios(buildMappedAcc())
        } else {
          loadAcessorios(selectedProposta.versao)
        }
      } else {
        const mappedData = {
          revisao: 'A',
          moeda: 'USD',
          status: 'Em Análise',
          user: user?.id,
          valor_sem_desconto: 0,
          valor_atual: 0,
          valor_final: 0,
          percentual_desconto: 0,
          nota_rep: 1,
          dt_cad: format(new Date(), 'yyyy-MM-dd'),
          modelo_licitacao: activeTab === 'cadastro_licitacao',
        }
        setFormData(mappedData)
        setInitialFormData(mappedData)
        loadAcessorios('')
        setPropostaSignatureBlob(null)
        setSignatureConfirmed(false)
      }
    }
  }, [selectedProposta, activeTab])

  const loadAcessorios = async (versaoId?: string) => {
    if (!versaoId) {
      setAcessoriosProposta([])
      setInitialAcessorios([])
      return
    }
    try {
      const filter = `versoes ~ "${versaoId}"`
      const list = await pb.collection('acessorios').getFullList({ filter })
      const buildAcc = () =>
        list.map((a) => ({
          id: a.id,
          nome: a.nome,
          tipo: a.tipo,
          valor: a.valor,
          moeda: a.moeda,
          estado: 'nao_exibir' as const,
        }))
      setAcessoriosProposta(buildAcc())
      if (!selectedProposta) {
        setInitialAcessorios(buildAcc())
      } else if (
        !selectedProposta.acessorios_proposta ||
        selectedProposta.acessorios_proposta.length === 0
      ) {
        setInitialAcessorios(buildAcc())
      }
    } catch (e) {
      console.error('Failed to load accessories', e)
    }
  }

  const handleVersaoChange = (versaoId: string) => {
    const versao = versoes.find((v) => v.id === versaoId)
    if (versao) {
      setFormData((prev) => {
        const base = versao.valor || 0
        const desc = prev.percentual_desconto || 0
        const final = Math.round(base * (1 - desc / 100) * 100) / 100

        const validIds = versao.tipos_proposta || []
        const isTipoValid = prev.tipo_proposta ? validIds.includes(prev.tipo_proposta) : false

        return {
          ...prev,
          versao: versaoId,
          tipo_proposta: isTipoValid ? prev.tipo_proposta : '',
          valor_sem_desconto: base,
          valor_atual: final,
          valor_final: final,
          moeda:
            versao.moeda === 'Dolar' || versao.moeda === 'US$'
              ? 'USD'
              : versao.moeda === 'Real'
                ? 'BRL'
                : versao.moeda === 'Euro'
                  ? 'EUR'
                  : versao.moeda || 'USD',
        }
      })
    } else {
      setFormData((prev) => ({
        ...prev,
        versao: '',
        tipo_proposta: '',
        valor_sem_desconto: 0,
        valor_atual: 0,
        valor_final: 0,
        moeda: 'USD',
      }))
    }
    loadAcessorios(versaoId)
  }

  const renderConvertedValue = () => {
    if (!formData.valor_final || !exchangeRates) return null

    const mapMoeda =
      formData.moeda === 'Dolar' || formData.moeda === 'US$'
        ? 'USD'
        : formData.moeda === 'Real'
          ? 'BRL'
          : formData.moeda === 'Euro'
            ? 'EUR'
            : formData.moeda || 'USD'
    if (mapMoeda === 'USD') {
      return (
        <div className="text-[10px] text-slate-500 mt-1">
          Aprox. {formatCurrency(formData.valor_final * exchangeRates.USD, 'BRL')}
        </div>
      )
    }
    if (mapMoeda === 'EUR') {
      return (
        <div className="text-[10px] text-slate-500 mt-1">
          Aprox. {formatCurrency(formData.valor_final * exchangeRates.EUR, 'BRL')}
        </div>
      )
    }
    if (mapMoeda === 'BRL') {
      return (
        <div className="text-[10px] text-slate-500 mt-1">
          Aprox. {formatCurrency(formData.valor_final / exchangeRates.USD, 'USD')}
        </div>
      )
    }
    return null
  }

  useRealtime('propostas', () => {
    loadData()
  })

  useRealtime('users', () => {
    loadData()
  })

  const handleEdit = (item: Proposta) => {
    setSelectedProposta(item)
    setActiveTab(item.modelo_licitacao ? 'cadastro_licitacao' : 'cadastro')
  }

  const handleHistory = async (item: Proposta) => {
    setHistoryProposta(item)
    setIsHistoryModalOpen(true)
    setIsLoadingHistory(true)

    try {
      const logs = await pb.collection('auditoria').getFullList({
        filter: `tabela = 'propostas' && registro_id = '${item.id}'`,
        sort: '+created',
        expand: 'user',
      })

      const processedLogs: any[] = []

      for (const log of logs) {
        if (log.acao.toLowerCase() === 'create') {
          processedLogs.push({ ...log, isCreate: true })
          continue
        }

        if (log.acao.toLowerCase() === 'update') {
          const oldData = log.dados?.old || {}
          const newData = log.dados?.new || {}
          const diffs = []

          for (const key of Object.keys(newData)) {
            if (
              [
                'updated',
                'created',
                'id',
                'collectionId',
                'collectionName',
                'expand',
                'user',
                'numero_proposta',
                'revisao',
              ].includes(key)
            )
              continue

            const oldVal = oldData[key]
            const newVal = newData[key]

            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
              diffs.push({ field: key, oldVal, newVal })
            }
          }

          if (diffs.length > 0) {
            processedLogs.push({
              ...log,
              diffs,
              isUpdate: true,
              versionOld: oldData.numero_proposta || '?',
              versionNew: newData.numero_proposta || '?',
            })
          }
        }
      }

      setHistoryLogs(processedLogs.reverse())
    } catch (e) {
      toast({ title: 'Erro ao carregar histórico', variant: 'destructive' })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const renderAcessoriosDiff = (oldVal: any[], newVal: any[]) => {
    const oldArr = Array.isArray(oldVal) ? oldVal : []
    const newArr = Array.isArray(newVal) ? newVal : []

    const allNames = Array.from(
      new Set([...oldArr.map((a) => a.nome), ...newArr.map((a) => a.nome)]),
    )

    const changes = []

    for (const name of allNames) {
      const oldAcc = oldArr.find((a) => a.nome === name)
      const newAcc = newArr.find((a) => a.nome === name)

      if (!oldAcc && newAcc) {
        changes.push({ type: 'added', name, newVal: newAcc })
      } else if (oldAcc && !newAcc) {
        changes.push({ type: 'removed', name, oldVal: oldAcc })
      } else if (oldAcc && newAcc) {
        const accDiffs = []

        const oldEstado =
          oldAcc.estado || (oldAcc.incluir ? 'incluir' : oldAcc.exibir ? 'exibir' : 'nao_exibir')
        const newEstado =
          newAcc.estado || (newAcc.incluir ? 'incluir' : newAcc.exibir ? 'exibir' : 'nao_exibir')

        if (oldEstado !== newEstado) {
          const nomes: Record<string, string> = {
            incluir: 'Incluir',
            nao_exibir: 'Não exibir',
            exibir: 'Exibir',
          }
          accDiffs.push(
            `Status: ${nomes[oldEstado] || 'Não exibir'} ➔ ${nomes[newEstado] || 'Não exibir'}`,
          )
        }

        if (oldAcc.valor !== newAcc.valor)
          accDiffs.push(
            `Valor: ${formatCurrency(oldAcc.valor, oldAcc.moeda)} ➔ ${formatCurrency(newAcc.valor, newAcc.moeda)}`,
          )

        if (accDiffs.length > 0) {
          changes.push({ type: 'changed', name, diffs: accDiffs })
        }
      }
    }

    if (changes.length === 0) return null

    return (
      <div className="flex flex-col gap-1 text-sm border-l-2 border-slate-200 pl-3 py-1">
        <span className="font-semibold text-slate-700">Acessórios da Proposta</span>
        <div className="flex flex-col gap-1.5 mt-1">
          {changes.map((c, i) => (
            <div key={i} className="text-xs">
              {c.type === 'added' && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500 w-16">Anterior:</span>
                  <span className="text-slate-400 italic">Não existia</span>
                  <span className="font-medium text-slate-500 ml-2 w-10">Atual:</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    + {c.name}
                  </span>
                </div>
              )}
              {c.type === 'removed' && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500 w-16">Anterior:</span>
                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded line-through decoration-rose-300">
                    - {c.name}
                  </span>
                  <span className="font-medium text-slate-500 ml-2 w-10">Atual:</span>
                  <span className="text-slate-400 italic">Removido</span>
                </div>
              )}
              {c.type === 'changed' && (
                <div className="flex flex-col gap-0.5">
                  <div className="font-medium text-slate-600">• {c.name}:</div>
                  <div className="pl-3 text-blue-700 bg-blue-50/50 py-1 px-2 rounded w-fit text-[11px]">
                    {c.diffs.join(' | ')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDiffValue = (val: any, field: string) => {
    if (val === null || val === undefined || val === '')
      return <span className="italic text-slate-400">Vazio</span>
    if (field === 'percentual_desconto') {
      return `${val}%`
    }
    if (field.includes('valor')) {
      const num = Number(val)
      if (!isNaN(num)) return formatCurrency(num, 'BRL') // Defaults to BRL if not available
    }
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const getFieldName = (key: string) => {
    const fieldNamesMap: Record<string, string> = {
      numero_proposta: 'Nº Proposta',
      cliente: 'Cliente',
      contato: 'Contato',
      telefone: 'Telefone',
      versao: 'Versão',
      representante: 'Representante',
      gerente: 'Gerente',
      moeda: 'Moeda',
      valor_sem_desconto: 'Valor sem Desconto',
      percentual_desconto: 'Desconto (%)',
      valor_atual: 'Valor Atual',
      valor_final: 'Valor Final',
      prazo_entrega: 'Prazo de Entrega',
      condicoes_pagamento: 'Condições de Pagamento',
      acessorios_proposta: 'Acessórios da Proposta',
      cliente_original: 'Cliente (Texto)',
      versao_original: 'Versão (Texto)',
      representante_original: 'Representante (Texto)',
      gerente_original: 'Gerente (Texto)',
      nota_rep: 'Nota Rep.',
      revisao: 'Revisão',
      status: 'Status',
    }
    return fieldNamesMap[key] || key
  }

  const renderDiff = (diff: any) => {
    if (diff.field === 'acessorios_proposta') {
      return renderAcessoriosDiff(diff.oldVal, diff.newVal)
    }

    return (
      <div className="flex flex-col gap-1 text-sm border-l-2 border-slate-200 pl-3 py-1">
        <span className="font-semibold text-slate-700">{getFieldName(diff.field)}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 w-16">Anterior:</span>
          <span
            className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded line-through decoration-rose-300 max-w-[300px] truncate"
            title={String(diff.oldVal)}
          >
            {renderDiffValue(diff.oldVal, diff.field)}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xs text-slate-500 w-16">Atual:</span>
          <span
            className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium max-w-[300px] truncate"
            title={String(diff.newVal)}
          >
            {renderDiffValue(diff.newVal, diff.field)}
          </span>
        </div>
      </div>
    )
  }

  const handleView = (item: Proposta) => {
    setViewProposta(item)
    setIsViewModalOpen(true)
  }

  const handleCreateNew = (isLicitacao = false) => {
    setSelectedProposta(null)
    setActiveTab(isLicitacao ? 'cadastro_licitacao' : 'cadastro')
  }

  const stripSystemFields = (data: Partial<Proposta>) => {
    const {
      id,
      created,
      updated,
      collectionId,
      collectionName,
      expand,
      assinatura_cliente,
      assinatura_representante,
      ultimo_usuario_status,
      data_alteracao_status,
      ...rest
    } = data as any
    return rest as Partial<Proposta>
  }

  const isDirty = useMemo(() => {
    if (!selectedProposta) return true

    const cleanForm = stripSystemFields(formData)
    const cleanInit = stripSystemFields(initialFormData)

    const formKeys = Array.from(new Set([...Object.keys(cleanForm), ...Object.keys(cleanInit)]))
    for (const key of formKeys) {
      const val1 = cleanForm[key as keyof Proposta]
      const val2 = cleanInit[key as keyof Proposta]
      const norm1 = val1 === null || val1 === undefined ? '' : val1
      const norm2 = val2 === null || val2 === undefined ? '' : val2

      if (norm1 !== norm2) {
        return true
      }
    }

    if (JSON.stringify(acessoriosProposta) !== JSON.stringify(initialAcessorios)) {
      return true
    }

    return false
  }, [formData, initialFormData, acessoriosProposta, initialAcessorios, selectedProposta])

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!formData.cliente) missing.push('cliente')
    if (!formData.versao) missing.push('versao')
    if (!formData.representante) missing.push('representante')
    if (!formData.tipo_proposta) missing.push('tipo_proposta')
    if (!selectedProposta && !signatureConfirmed) missing.push('assinatura')
    return missing
  }, [
    formData.cliente,
    formData.versao,
    formData.representante,
    formData.tipo_proposta,
    selectedProposta,
    signatureConfirmed,
  ])

  const requiredFieldsValid = missingFields.length === 0

  const issuerSectorLabel = useMemo(() => {
    if (!user) return 'Responsável Interno'
    if (user.setor) return user.setor
    const userGerente = gerentes.find((g) => g.usuario === user.id)
    if (userGerente && userGerente.cargo) return userGerente.cargo
    if (user.role === 'admin') return 'Comercial'
    return 'Comercial'
  }, [user, gerentes])

  const handleSave = async () => {
    if ((formData.percentual_desconto || 0) > 28) {
      toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
      return
    }

    if (!formData.cliente) {
      toast({ title: 'Selecione um cliente para a proposta', variant: 'destructive' })
      return
    }

    if (!formData.versao) {
      toast({ title: 'Selecione uma versão para a proposta', variant: 'destructive' })
      return
    }

    if (!formData.representante) {
      toast({ title: 'Selecione um representante para a proposta', variant: 'destructive' })
      return
    }

    if (!formData.tipo_proposta) {
      toast({ title: 'Selecione um Tipo de Proposta obrigatório', variant: 'destructive' })
      return
    }

    if (!selectedProposta && !signatureConfirmed) {
      toast({
        title: 'É obrigatório fornecer a assinatura do representante',
        variant: 'destructive',
      })
      return
    }

    if (selectedProposta && user?.id !== selectedProposta.user) {
      toast({
        title: 'Você não tem permissão para modificar esta proposta',
        variant: 'destructive',
      })
      return
    }

    const cleanData = stripSystemFields(formData)

    const sanitizedData: Record<string, any> = {}
    for (const [key, value] of Object.entries(cleanData)) {
      if (value !== undefined) {
        sanitizedData[key] = value
      }
    }
    ;['cliente', 'versao', 'representante', 'gerente', 'tipo_proposta'].forEach((field) => {
      if (sanitizedData[field] === '') sanitizedData[field] = null
    })

    try {
      if (selectedProposta) {
        await updateProposta(selectedProposta.id, {
          ...sanitizedData,
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta atualizada com sucesso' })
        setInitialFormData({ ...formData })
        setInitialAcessorios(acessoriosProposta.map((a) => ({ ...a })))
        loadData()
      } else {
        const fd = new FormData()
        for (const [key, value] of Object.entries(sanitizedData)) {
          if (value !== undefined && value !== null) {
            fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
          }
        }
        fd.append('user', user?.id || '')
        fd.append('numero_proposta', sanitizedData.numero_proposta || 'NOVA-0')
        fd.append('acessorios_proposta', JSON.stringify(acessoriosProposta))
        if (propostaSignatureBlob) {
          fd.append(
            'assinatura_representante',
            propostaSignatureBlob,
            'assinatura-representante.png',
          )
        }
        const created = await pb.collection('propostas').create(fd)
        setSelectedProposta(created)
        setSignatureConfirmed(true)
        toast({ title: 'Proposta criada com sucesso' })
        loadData()
      }
      setIsPreviewModalOpen(false)
    } catch (e) {
      toast({
        title: 'Erro ao salvar proposta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const printProposal = (item: Proposta) => {
    if (!item.id) {
      toast({ title: 'Salve a proposta antes de gerar o PDF', variant: 'default' })
      return
    }
    window.open(`/controle-propostas/proposta-pdf/${item.id}`, '_blank')
  }

  const handleCancelProposta = async () => {
    if (!selectedProposta) return
    if (user?.id !== selectedProposta.user) {
      toast({
        title: 'Você não tem permissão para cancelar esta proposta',
        variant: 'destructive',
      })
      return
    }
    try {
      await updateProposta(selectedProposta.id, {
        status: 'Excluída',
        ultimo_usuario_status: user?.id,
        data_alteracao_status: format(new Date(), 'yyyy-MM-dd'),
      })
      toast({ title: 'Proposta cancelada com sucesso' })
      setIsCancelDialogOpen(false)
      setSelectedProposta(null)
      setActiveTab('registros')
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao cancelar proposta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((item) => item.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const convertCurrency = (value: number, from: string, to: string) => {
    if (!exchangeRates || value === 0) return value
    const mapCurrencyCode = (c: string) =>
      c === 'Dolar' || c === 'US$'
        ? 'USD'
        : c === 'Real'
          ? 'BRL'
          : c === 'Euro'
            ? 'EUR'
            : c || 'USD'
    const normFrom = mapCurrencyCode(from)
    const normTo = mapCurrencyCode(to)
    if (normFrom === normTo) return value

    let inBrl = value
    if (normFrom === 'USD') inBrl = value * exchangeRates.USD
    if (normFrom === 'EUR') inBrl = value * exchangeRates.EUR

    if (normTo === 'USD') return inBrl / exchangeRates.USD
    if (normTo === 'EUR') return inBrl / exchangeRates.EUR
    return inBrl
  }

  const searchClientes = useCallback(async (query: string) => {
    const res = await pb.collection('clientes').getList(1, 20, {
      filter: `documento ~ "${query}" || razao_social ~ "${query}" || fantasia ~ "${query}"`,
      sort: 'fantasia',
    })
    return res.items
  }, [])

  const searchRepresentantes = useCallback(async (query: string) => {
    const res = await pb.collection('representantes').getList(1, 20, {
      filter: `documento ~ "${query}" || fantasia ~ "${query}"`,
      sort: 'fantasia',
    })
    return res.items
  }, [])

  const handleClienteChange = (clienteId: string) => {
    if (!clienteId) {
      setFormData((prev) => ({
        ...prev,
        cliente: '',
        contato: '',
        telefone: '',
      }))
      return
    }

    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente) {
      setFormData((prev) => ({
        ...prev,
        cliente: clienteId,
        contato: cliente.contato || '',
        telefone: cliente.telefone || cliente.celular || '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, cliente: clienteId }))
      pb.collection('clientes')
        .getOne(clienteId)
        .then((c) => {
          setFormData((prev) => ({
            ...prev,
            contato: c.contato || '',
            telefone: c.telefone || c.celular || '',
          }))
        })
        .catch(() => {})
    }
  }

  const updateAccEstado = (index: number, novoEstado: 'incluir' | 'nao_exibir' | 'exibir') => {
    const newAcc = [...acessoriosProposta]
    const oldEstado = newAcc[index].estado || 'nao_exibir'
    newAcc[index] = { ...newAcc[index], estado: novoEstado }

    setAcessoriosProposta(newAcc)

    if ((oldEstado === 'incluir') !== (novoEstado === 'incluir')) {
      const acc = newAcc[index]
      const accMoeda = acc.moeda || 'BRL'
      const propMoeda = formData.moeda || 'USD'
      const convertedValue = convertCurrency(acc.valor || 0, accMoeda, propMoeda)

      setFormData((prev) => {
        const currentBase = prev.valor_sem_desconto || 0
        const nextBase =
          novoEstado === 'incluir' ? currentBase + convertedValue : currentBase - convertedValue
        const roundedBase = Math.round(nextBase * 100) / 100

        const desc = prev.percentual_desconto || 0
        const nextFinal = roundedBase * (1 - desc / 100)
        const roundedFinal = Math.round(nextFinal * 100) / 100

        return {
          ...prev,
          valor_sem_desconto: roundedBase,
          valor_final: roundedFinal,
          valor_atual: roundedFinal,
        }
      })
    }
  }

  const renderTopPagination = () => {
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
    const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const end = Math.min(page * perPage, totalItems)

    return (
      <div className="flex items-center text-[11px] text-[#337ab7] gap-4">
        <div className="flex items-center space-x-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-2 py-1 min-w-[24px] text-center rounded-sm transition-colors',
                p === page ? 'bg-[#337ab7] text-white' : 'hover:bg-slate-100',
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-1 py-1 hover:bg-slate-100 rounded-sm"
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <span>
            {start}-{end} de {totalItems.toLocaleString('pt-BR')}
          </span>
          <div className="flex items-center gap-1 border border-slate-200 rounded-sm bg-white px-1">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="border-none bg-transparent outline-none cursor-pointer text-slate-600 text-xs py-0.5 pl-1"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const renderSortableHead = (label: string, field: string) => {
    const isActive = sortField === field
    return (
      <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
        <div
          className="flex items-center gap-1 cursor-pointer hover:underline"
          onClick={() => handleSort(field)}
        >
          {label}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )
          ) : (
            <ArrowDownUp className="w-3 h-3 opacity-50" />
          )}
        </div>
      </TableHead>
    )
  }

  const handlePreviewPDF = () => {
    if ((formData.percentual_desconto || 0) > 28) {
      toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
      return
    }

    if (!formData.cliente) {
      toast({ title: 'Selecione um cliente para visualizar a proposta', variant: 'destructive' })
      return
    }

    // Set dt_cad if not present, though it defaults on init.
    if (!formData.dt_cad) {
      setFormData((prev) => ({ ...prev, dt_cad: format(new Date(), 'yyyy-MM-dd') }))
    }

    setIsPreviewModalOpen(true)
  }

  const handleAvancarProposta = async () => {
    if (!avancarPropostaItem) return
    try {
      await updateProposta(avancarPropostaItem.id, {
        status: novoStatus,
        ultimo_usuario_status: user?.id,
        data_alteracao_status: format(new Date(), 'yyyy-MM-dd'),
      })
      toast({ title: 'Status da proposta atualizado com sucesso' })
      setAvancarPropostaItem(null)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const renderCadastroActionBars = () => {
    const isOverDiscount = (formData.percentual_desconto || 0) > 28
    const isOwner = !selectedProposta || user?.id === selectedProposta.user
    const hasClient = !!formData.cliente
    const canSave =
      !isOverDiscount && isOwner && requiredFieldsValid && (selectedProposta ? isDirty : true)

    const getDisabledReason = (): string | null => {
      if (isOverDiscount) return 'Desconto acima do máximo permitido (28%)'
      if (!isOwner) return 'Você não é o proprietário desta proposta'
      if (!requiredFieldsValid) {
        const missing: string[] = []
        if (!formData.cliente) missing.push('Cliente')
        if (!formData.versao) missing.push('Versão')
        if (!formData.representante) missing.push('Representante')
        if (!formData.tipo_proposta) missing.push('Tipo de Proposta')
        if (!selectedProposta && !signatureConfirmed) missing.push('Assinatura do Representante')
        return `Campos obrigatórios pendentes: ${missing.join(', ')}`
      }
      if (selectedProposta && !isDirty) return 'Nenhuma alteração detectada'
      return null
    }
    const disabledReason = getDisabledReason()

    return (
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2 flex-wrap items-center">
          <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
            PESQUISAR
          </Button>
          <Button
            onClick={handlePreviewPDF}
            disabled={isOverDiscount || !hasClient}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Visualizar proposta
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            title={disabledReason || undefined}
            className={cn(
              'text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal transition-all duration-200',
              canSave
                ? 'bg-[#337ab7] hover:bg-[#286090] ring-2 ring-[#337ab7]/30 ring-offset-1'
                : 'bg-[#337ab7] hover:bg-[#286090] disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {selectedProposta ? 'ATUALIZAR PROPOSTA' : 'GERAR PROPOSTA'}
          </Button>
          <Button
            onClick={() => {
              if (selectedProposta) {
                printProposal(selectedProposta)
              } else {
                toast({ title: 'Salve a proposta antes de gerar o PDF', variant: 'default' })
              }
            }}
            disabled={!selectedProposta || isOverDiscount}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            GERAR PDF
          </Button>
          {selectedProposta && (
            <Button
              onClick={() => setIsCancelDialogOpen(true)}
              disabled={!isOwner}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </Button>
          )}
          {selectedProposta && (
            <span
              className={cn(
                'text-[10px] font-medium ml-auto flex items-center gap-1 transition-colors duration-200',
                isDirty ? 'text-amber-600' : 'text-slate-400',
              )}
            >
              {isDirty ? '● Alterações não salvas' : '✓ Sem alterações'}
            </span>
          )}
        </div>
        {disabledReason && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 animate-fade-in">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            {disabledReason}
          </div>
        )}
      </div>
    )
  }

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px]'
  const labelClass = 'text-[11px] font-bold text-slate-700 mb-1'

  const renderTable = () => (
    <Table>
      <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
        <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
          <TableHead className="w-[40px] px-3 py-3 bg-white h-auto border-b-2 border-slate-200">
            <Checkbox
              className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
              checked={data.length > 0 && selectedIds.size === data.length}
              onCheckedChange={(checked) => toggleSelectAll(!!checked)}
            />
          </TableHead>
          {renderSortableHead('Proposta', 'numero_proposta')}
          {renderSortableHead('Razão Social', 'cliente_original')}
          {renderSortableHead('Contato', 'contato')}
          {renderSortableHead('Telefone', 'telefone')}
          {renderSortableHead('Versão', 'versao_original')}
          {renderSortableHead('Rep. (Externo)', 'representante_original')}
          {renderSortableHead('Status', 'status')}
          {renderSortableHead('Valor', 'valor_final')}
          {renderSortableHead('Dt. Cad', 'dt_cad')}
          {renderSortableHead('Responsável Interno', 'created')}
          <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
            Setor Resp.
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={12} className="text-center py-8 text-slate-500">
              Carregando...
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={12} className="text-center py-8 text-slate-500">
              Nenhuma proposta encontrada.
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow key={item.id} className="hover:bg-slate-50 border-b border-slate-200 group">
              <TableCell className="align-top py-2.5 px-3">
                <Checkbox
                  className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                />
              </TableCell>
              <TableCell className="align-top py-2 px-3 min-w-[100px] border-r border-slate-100">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-slate-600 text-xs">{item.numero_proposta}</span>
                  {item.modelo_licitacao && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200 uppercase"
                    >
                      Licitação
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex items-center text-[#337ab7] hover:underline text-[11px] w-fit"
                  >
                    <Pencil className="h-3 w-3 mr-1" fill="currentColor" /> Editar
                  </button>
                  <button
                    onClick={() => handleView(item)}
                    className="flex items-center text-[#337ab7] hover:underline text-[11px] w-fit"
                  >
                    <Eye className="h-3 w-3 mr-1" /> Visualizar
                  </button>
                  <button
                    onClick={() => handleHistory(item)}
                    className="flex items-center text-[#337ab7] hover:underline text-[11px] w-fit"
                  >
                    <History className="h-3 w-3 mr-1" /> Histórico
                  </button>
                  <button
                    onClick={() => printProposal(item)}
                    className="flex items-center text-emerald-600 hover:text-emerald-700 hover:underline text-[11px] w-fit font-medium mt-1"
                  >
                    Gerar PDF
                  </button>
                  {item.status !== 'Excluída' && user?.id === item.user && (
                    <button
                      onClick={() => {
                        setAvancarPropostaItem(item)
                        setNovoStatus(
                          item.status === 'Em Análise' ? 'Aprovada' : item.status || 'Em Análise',
                        )
                      }}
                      className="flex items-center text-amber-600 hover:text-amber-700 hover:underline text-[11px] w-fit font-medium mt-1"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" /> Avançar Proposta
                    </button>
                  )}
                </div>
              </TableCell>
              <TableCell
                className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[200px] truncate"
                title={
                  item.expand?.cliente?.razao_social ||
                  item.expand?.cliente?.fantasia ||
                  item.cliente_original
                }
              >
                {item.expand?.cliente?.razao_social ||
                  item.expand?.cliente?.fantasia ||
                  item.cliente_original ||
                  '-'}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px]">
                {item.contato || '-'}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                {item.telefone || '-'}
              </TableCell>
              <TableCell
                className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[300px] whitespace-normal leading-relaxed"
                title={item.expand?.versao?.nome || item.versao_original}
              >
                {item.expand?.versao?.nome || item.versao_original || '-'}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                {item.expand?.representante?.fantasia || item.representante_original || '-'}
              </TableCell>
              <TableCell className="align-top py-2 px-3">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-normal border whitespace-nowrap px-1.5 py-0',
                    item.status === 'Aprovada' &&
                      'bg-emerald-50 text-emerald-700 border-emerald-200',
                    item.status === 'Recusada' && 'bg-rose-50 text-rose-700 border-rose-200',
                    item.status === 'Excluída' && 'bg-slate-100 text-slate-500 border-slate-300',
                    item.status === 'Em Análise' && 'bg-amber-50 text-amber-700 border-amber-200',
                    !item.status && 'bg-amber-50 text-amber-700 border-amber-200',
                  )}
                >
                  {item.status || 'Em Análise'}
                </Badge>
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                {formatCurrency(item.valor_final, item.moeda)}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                {item.dt_cad ? item.dt_cad.substring(0, 10).split('-').reverse().join('/') : '-'}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                {item.expand?.user?.name || '-'}
              </TableCell>
              <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                {item.expand?.user?.setor || '-'}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white text-slate-700 font-sans pt-2 rounded-md shadow-sm border border-slate-200 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0 w-full"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 shrink-0">
          <TabsList className="bg-transparent justify-start rounded-none h-auto p-0 space-x-2">
            <TabsTrigger
              value="registros"
              onClick={() => setPage(1)}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              onClick={() => {
                if (activeTab !== 'cadastro' && !selectedProposta) {
                  handleCreateNew(false)
                }
              }}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Cadastro
            </TabsTrigger>
            {(user?.role === 'admin' || gerentes.some((g) => g.usuario === user?.id)) && (
              <TabsTrigger
                value="cadastro_licitacao"
                onClick={() => {
                  if (activeTab !== 'cadastro_licitacao' && !selectedProposta) {
                    handleCreateNew(true)
                  }
                }}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
              >
                Emitir Proposta de Licitação
              </TabsTrigger>
            )}
            <TabsTrigger
              value="excluidas"
              onClick={() => setPage(1)}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Propostas Excluídas
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            {(activeTab === 'registros' || activeTab === 'excluidas') && renderTopPagination()}
          </div>
        </div>

        {(activeTab === 'registros' || activeTab === 'excluidas') && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-slate-50/50 shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por responsável..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="pl-7 pr-2 py-1.5 text-xs border border-slate-300 rounded-sm bg-white outline-none focus:border-[#337ab7] min-w-[200px]"
              />
            </div>
            <select
              value={sectorFilter}
              onChange={(e) => {
                setSectorFilter(e.target.value)
                setPage(1)
              }}
              className="text-xs border border-slate-300 rounded-sm bg-white px-2 py-1.5 outline-none focus:border-[#337ab7] cursor-pointer"
            >
              <option value="">Todos os setores</option>
              {setores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        <TabsContent value="registros" className="flex-1 min-h-0 m-0 overflow-y-auto outline-none">
          {renderTable()}
        </TabsContent>

        <TabsContent value="excluidas" className="flex-1 min-h-0 m-0 overflow-y-auto outline-none">
          {renderTable()}
        </TabsContent>

        {['cadastro', 'cadastro_licitacao'].map((tabValue) => (
          <TabsContent
            key={tabValue}
            value={tabValue}
            className="flex-1 min-h-0 m-0 overflow-y-auto outline-none p-6 bg-white"
          >
            <div className="max-w-7xl mx-auto w-full flex flex-col items-start pb-10">
              <div className="mb-6 w-full border-b border-slate-200 pb-4">
                {renderCadastroActionBars()}
              </div>

              <div className="mb-4 w-full p-3 bg-[#337ab7]/5 border border-[#337ab7]/20 rounded-sm">
                <span className="text-xs font-bold text-[#337ab7] uppercase tracking-wider">
                  Responsável Interno: {selectedProposta?.expand?.user?.name || user?.name || '-'}{' '}
                  <span className="font-normal text-slate-500">
                    (Setor: {selectedProposta?.expand?.user?.setor || user?.setor || 'Comercial'})
                  </span>
                </span>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Código Para pesquisar</label>
                  <input
                    className={cn(inputClass, 'bg-slate-50')}
                    readOnly
                    placeholder="Gerado automaticamente"
                    value={formData.numero_proposta || ''}
                  />
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Representante</label>
                  <SearchableCombobox
                    items={representantes}
                    value={formData.representante || ''}
                    onChange={(id) => setFormData({ ...formData, representante: id })}
                    getLabel={(r) => r.fantasia}
                    getSearchText={(r) => `${r.fantasia || ''} ${r.sigla || ''}`}
                    placeholder="Buscar representante..."
                    emptyMessage="Nenhum representante encontrado."
                    className={cn(
                      inputClass,
                      !formData.representante && 'border-amber-300 bg-amber-50/30',
                    )}
                    onSearch={searchRepresentantes}
                  />
                  {!formData.representante && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Representante é obrigatório
                    </span>
                  )}
                  {formData.representante_original && !formData.representante && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Original: {formData.representante_original}
                    </span>
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Cliente</label>
                  <SearchableCombobox
                    items={clientes}
                    value={formData.cliente || ''}
                    onChange={(id) => handleClienteChange(id)}
                    getLabel={(c) => c.fantasia || c.razao_social}
                    getSearchText={(c) => `${c.fantasia || ''} ${c.razao_social || ''}`}
                    placeholder="Buscar cliente..."
                    emptyMessage="Nenhum cliente encontrado."
                    className={cn(
                      inputClass,
                      !formData.cliente && 'border-amber-300 bg-amber-50/30',
                    )}
                    onSearch={searchClientes}
                  />
                  {!formData.cliente && (
                    <span className="text-[10px] text-amber-600 mt-0.5">Cliente é obrigatório</span>
                  )}
                  {formData.cliente_original && !formData.cliente && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Original: {formData.cliente_original}
                    </span>
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Gerente</label>
                  <select
                    className={inputClass}
                    value={formData.gerente || ''}
                    onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                  >
                    <option value=""></option>
                    {gerentes.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                  {formData.gerente_original && !formData.gerente && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Original: {formData.gerente_original}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Data de Emissão</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.dt_cad ? formData.dt_cad.substring(0, 10) : ''}
                    onChange={(e) => setFormData({ ...formData, dt_cad: e.target.value })}
                  />
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Versão</label>
                  <select
                    className={cn(
                      inputClass,
                      !formData.versao && 'border-amber-300 bg-amber-50/30',
                    )}
                    value={formData.versao || ''}
                    onChange={(e) => handleVersaoChange(e.target.value)}
                  >
                    <option value=""></option>
                    {versoes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.nome}
                      </option>
                    ))}
                  </select>
                  {!formData.versao && (
                    <span className="text-[10px] text-amber-600 mt-0.5">Versão é obrigatória</span>
                  )}
                  {formData.versao_original && !formData.versao && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Original: {formData.versao_original}
                    </span>
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Tipo de Proposta *</label>
                  <select
                    className={cn(
                      inputClass,
                      !formData.tipo_proposta && 'border-amber-300 bg-amber-50/30',
                    )}
                    value={formData.tipo_proposta || ''}
                    onChange={(e) => {
                      const tipoId = e.target.value
                      const tipo = tiposProposta.find((t) => t.id === tipoId)
                      setFormData({
                        ...formData,
                        tipo_proposta: tipoId,
                        ...(tipo
                          ? {
                              prazo_entrega: tipo.prazo_entrega || formData.prazo_entrega,
                              condicoes_pagamento:
                                tipo.condicoes_pagamento || formData.condicoes_pagamento,
                              validade_oferta: tipo.validade_oferta || formData.validade_oferta,
                            }
                          : {}),
                      })
                    }}
                    disabled={!formData.versao}
                  >
                    <option value="">-- Selecione o Tipo de Proposta --</option>
                    {(() => {
                      const versao = versoes.find((v) => v.id === formData.versao)
                      const validIds = versao?.tipos_proposta || []
                      const filtered = tiposProposta.filter(
                        (t) => validIds.includes(t.id) && t.status === 'Ativo',
                      )

                      if (
                        formData.tipo_proposta &&
                        !filtered.some((t) => t.id === formData.tipo_proposta)
                      ) {
                        const selectedButNotActiveOrValid = tiposProposta.find(
                          (t) => t.id === formData.tipo_proposta,
                        )
                        if (selectedButNotActiveOrValid) {
                          filtered.push(selectedButNotActiveOrValid)
                        }
                      }

                      return filtered.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))
                    })()}
                  </select>
                  {!formData.tipo_proposta && (
                    <span className="text-[10px] text-amber-600 mt-0.5">
                      Tipo de Proposta é obrigatório
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Estoque</label>
                  <select
                    className={inputClass}
                    value={estoqueUI}
                    onChange={(e) => setEstoqueUI(e.target.value)}
                  >
                    <option value=""></option>
                    <option value="disponivel">Disponível</option>
                    <option value="indisponivel">Indisponível</option>
                  </select>
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Moeda</label>
                  <select
                    className={inputClass}
                    value={
                      formData.moeda === 'Dolar'
                        ? 'USD'
                        : formData.moeda === 'Real'
                          ? 'BRL'
                          : formData.moeda === 'Euro'
                            ? 'EUR'
                            : formData.moeda === 'US$'
                              ? 'USD'
                              : formData.moeda || ''
                    }
                    onChange={(e) => {
                      const newMoeda = e.target.value
                      const oldMoeda = formData.moeda || 'USD'
                      const currentBase = formData.valor_sem_desconto || 0
                      const convertedBase =
                        Math.round(convertCurrency(currentBase, oldMoeda, newMoeda) * 100) / 100
                      const desc = formData.percentual_desconto || 0
                      const convertedFinal =
                        Math.round(convertedBase * (1 - desc / 100) * 100) / 100

                      setFormData({
                        ...formData,
                        moeda: newMoeda,
                        valor_sem_desconto: convertedBase,
                        valor_final: convertedFinal,
                        valor_atual: convertedFinal,
                      })
                    }}
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Valor sem Desconto</label>
                  <CurrencyInput
                    className={cn(inputClass, 'bg-slate-50 cursor-not-allowed')}
                    value={formData.valor_sem_desconto}
                    currency={formData.moeda || 'US$'}
                    onChange={() => {}}
                    readOnly
                    onClick={() =>
                      toast({
                        title:
                          'Este campo é calculado automaticamente e não pode ser editado manualmente.',
                        variant: 'default',
                      })
                    }
                  />
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Desconto (%)</label>
                  <input
                    type="number"
                    className={cn(
                      inputClass,
                      (formData.percentual_desconto || 0) > 28 &&
                        'border-rose-500 text-rose-600 bg-rose-50 focus:border-rose-500',
                    )}
                    value={
                      formData.percentual_desconto === undefined ? '' : formData.percentual_desconto
                    }
                    onChange={(e) => {
                      let valStr = e.target.value
                      let val = valStr === '' ? undefined : parseFloat(valStr)
                      if (val !== undefined && isNaN(val)) return

                      if (val !== undefined && val > 28) {
                        toast({
                          title: 'O desconto máximo permitido é 28%',
                          variant: 'destructive',
                        })
                      }

                      setFormData((prev) => {
                        const base = prev.valor_sem_desconto || 0
                        const final = Math.round(base * (1 - (val || 0) / 100) * 100) / 100
                        return {
                          ...prev,
                          percentual_desconto: val,
                          valor_final: final,
                          valor_atual: final,
                        }
                      })
                    }}
                    step="0.01"
                    min="0"
                  />
                  {(formData.percentual_desconto || 0) > 28 && (
                    <span className="text-[10px] text-rose-600 mt-1 leading-tight">
                      O desconto máximo permitido é 28%
                    </span>
                  )}
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Valor Final</label>
                  <CurrencyInput
                    className={cn(inputClass, 'bg-slate-50 cursor-not-allowed')}
                    value={formData.valor_final}
                    currency={formData.moeda || 'US$'}
                    onChange={() => {}}
                    readOnly
                    onClick={() =>
                      toast({
                        title:
                          'Este campo é calculado automaticamente e não pode ser editado manualmente.',
                        variant: 'default',
                      })
                    }
                  />
                  {renderConvertedValue()}
                </div>
              </div>

              <div className="text-[11px] font-bold text-slate-700 mb-8 w-full border-b border-slate-200 pb-4 flex items-center gap-4">
                {exchangeRatesLoading ? (
                  <span>Carregando cotações...</span>
                ) : exchangeRates ? (
                  <>
                    <span className="flex items-center gap-1">
                      Dólar do Dia (USD): {formatCurrency(exchangeRates.USD, 'BRL')}
                      <span
                        className={exchangeRates.usdPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                      >
                        ({exchangeRates.usdPct > 0 ? '+' : ''}
                        {exchangeRates.usdPct}%)
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      Euro (EUR): {formatCurrency(exchangeRates.EUR, 'BRL')}
                      <span
                        className={exchangeRates.eurPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                      >
                        ({exchangeRates.eurPct > 0 ? '+' : ''}
                        {exchangeRates.eurPct}%)
                      </span>
                    </span>
                    <span>R$: 1,00</span>
                  </>
                ) : (
                  <span className="text-rose-600">Cotações indisponíveis no momento</span>
                )}
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Prazo de Entrega</label>
                  <input
                    className={inputClass}
                    value={formData.prazo_entrega || ''}
                    onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                  />
                </div>
                <div className="flex flex-col w-full">
                  <label className={labelClass}>Condições de Pagamento</label>
                  <input
                    className={inputClass}
                    value={formData.condicoes_pagamento || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, condicoes_pagamento: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-b border-slate-200 w-full mb-4 pb-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <List className="w-4 h-4" /> Acessórios
                </h3>
              </div>

              <div className="w-full mb-8 border border-slate-200 rounded-sm overflow-x-auto">
                {!formData.versao ? (
                  <div className="py-6 text-center text-slate-500 text-sm">
                    Selecione uma versão para visualizar os acessórios disponíveis.
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px] bg-white border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-normal text-slate-600">Acessório (Nome)</th>
                        <th className="py-2.5 px-4 font-normal text-slate-600">Tipo</th>
                        <th className="py-2.5 px-4 font-normal text-slate-600">Moeda</th>
                        <th className="py-2.5 px-4 font-normal text-slate-600">Valor</th>
                        <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                          Incluir na Proposta
                        </th>
                        <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                          Não exibir na Proposta
                        </th>
                        <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                          Exibir na Proposta
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {acessoriosProposta.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            Nenhum acessório encontrado para esta versão.
                          </td>
                        </tr>
                      ) : (
                        acessoriosProposta.map((acc, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2.5 px-4 text-slate-700">{acc.nome}</td>
                            <td className="py-2.5 px-4 text-slate-700">{acc.tipo || '-'}</td>
                            <td className="py-2.5 px-4 text-slate-700">{acc.moeda || '-'}</td>
                            <td className="py-2.5 px-4 text-slate-700">
                              {formatCurrency(acc.valor, acc.moeda)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="radio"
                                name={`acc_${idx}`}
                                checked={acc.estado === 'incluir'}
                                onChange={() => updateAccEstado(idx, 'incluir')}
                                className="w-3.5 h-3.5 accent-[#337ab7] cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="radio"
                                name={`acc_${idx}`}
                                checked={acc.estado === 'nao_exibir'}
                                onChange={() => updateAccEstado(idx, 'nao_exibir')}
                                className="w-3.5 h-3.5 accent-[#337ab7] cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <input
                                type="radio"
                                name={`acc_${idx}`}
                                checked={acc.estado === 'exibir'}
                                onChange={() => updateAccEstado(idx, 'exibir')}
                                className="w-3.5 h-3.5 accent-[#337ab7] cursor-pointer"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {formData.versao &&
                (() => {
                  const versao = versoes.find((v) => v.id === formData.versao)
                  if (!versao) return null
                  const hasStandards =
                    versao.acessorios_standards && versao.acessorios_standards.trim()
                  const hasConstrutivas =
                    versao.caracteristicas_construtivas &&
                    versao.caracteristicas_construtivas.trim()
                  const hasEspecificacoes =
                    versao.especificacoes_tecnicas && versao.especificacoes_tecnicas.trim()
                  if (!hasStandards && !hasConstrutivas && !hasEspecificacoes) return null
                  return (
                    <div className="w-full mb-8">
                      <div className="border-b border-slate-200 w-full mb-4 pb-2">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Detalhes Técnicos da Versão
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {hasStandards && (
                          <div className="border border-slate-200 rounded-sm p-4 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-700">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                              Acessórios Standards
                            </p>
                            <div
                              className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rich-text-content"
                              dangerouslySetInnerHTML={{
                                __html: versao.acessorios_standards || '',
                              }}
                            />
                          </div>
                        )}
                        {hasConstrutivas && (
                          <div className="border border-slate-200 rounded-sm p-4 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-700">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                              Características Construtivas Principais
                            </p>
                            <div
                              className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rich-text-content"
                              dangerouslySetInnerHTML={{
                                __html: versao.caracteristicas_construtivas || '',
                              }}
                            />
                          </div>
                        )}
                        {hasEspecificacoes && (
                          <div className="border border-slate-200 rounded-sm p-4 bg-slate-50/50 dark:bg-slate-900/20 dark:border-slate-700">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                              Especificações Técnicas Principais
                            </p>
                            <div
                              className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed rich-text-content"
                              dangerouslySetInnerHTML={{
                                __html: versao.especificacoes_tecnicas || '',
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })()}

              {formData.modelo_licitacao && (
                <div className="w-full mb-8 flex flex-col gap-6">
                  <div className="border-b border-slate-200 w-full pb-2">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Informações da Licitação
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Descrição da Proposta</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[60px] resize-y')}
                        value={formData.descricao_proposta || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, descricao_proposta: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Validade da Proposta</label>
                      <input
                        className={inputClass}
                        value={formData.validade_oferta || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, validade_oferta: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Garantia dos Acessórios</label>
                      <input
                        className={inputClass}
                        value={formData.garantia_acessorios || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, garantia_acessorios: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Especificações Técnicas (Adicionais)</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.especificacoes_tecnicas || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, especificacoes_tecnicas: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Materiais Utilizados</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.materiais_utilizados || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, materiais_utilizados: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Certificações</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.certificacoes || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, certificacoes: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Normas Aplicáveis</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.normas_aplicaveis || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, normas_aplicaveis: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Certificações de Segurança</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.certificacoes_seguranca || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, certificacoes_seguranca: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Normas de Segurança</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.normas_seguranca || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, normas_seguranca: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Cobertura da Garantia</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.cobertura_garantia || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, cobertura_garantia: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Assistência Técnica Detalhada</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.assistencia_tecnica_detalhada || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            assistencia_tecnica_detalhada: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col w-full">
                      <label className={labelClass}>Critérios de Aceitação (Testes)</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.criterios_aceitacao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, criterios_aceitacao: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {user && (!selectedProposta || user.id === selectedProposta.user) && (
                <div className="w-full mt-8">
                  <div className="border-b border-slate-200 w-full mb-4 pb-2">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <PenTool className="w-4 h-4" /> Assinatura do Responsável Interno —{' '}
                      {issuerSectorLabel}
                      {!selectedProposta && (
                        <span className="text-[10px] text-amber-600 font-normal ml-1">
                          (Obrigatória para nova proposta)
                        </span>
                      )}
                    </h3>
                  </div>
                  {selectedProposta?.assinatura_representante ? (
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-sm bg-slate-50/50">
                      <img
                        src={pb.files.getURL(
                          selectedProposta as any,
                          selectedProposta.assinatura_representante as string,
                        )}
                        alt="Assinatura do Representante"
                        className="max-h-20 max-w-[200px] object-contain bg-white p-2 border rounded"
                      />
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs text-slate-600">
                          Assinatura registrada para esta proposta.
                        </span>
                      </div>
                    </div>
                  ) : !selectedProposta ? (
                    signatureConfirmed && propostaSignatureBlob ? (
                      <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-sm bg-slate-50/50">
                        <img
                          src={URL.createObjectURL(propostaSignatureBlob)}
                          alt="Assinatura confirmada"
                          className="max-h-20 max-w-[200px] object-contain bg-white p-2 border rounded"
                        />
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                          <span className="text-xs text-slate-600">Assinatura confirmada</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPropostaSignatureBlob(null)
                            setSignatureConfirmed(false)
                          }}
                          className="gap-2 text-xs ml-auto"
                        >
                          <PenTool className="h-4 w-4" /> Refazer Assinatura
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 border-2 border-dashed border-amber-300 rounded-sm">
                        <p className="text-xs text-amber-600 text-center mb-3">
                          A assinatura do representante é obrigatória para cadastrar a proposta.
                        </p>
                        <SignaturePad
                          onConfirm={(blob) => {
                            setPropostaSignatureBlob(blob)
                            setSignatureConfirmed(true)
                          }}
                        />
                      </div>
                    )
                  ) : user.assinatura ? (
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-sm bg-slate-50/50">
                      <img
                        src={pb.files.getURL(user as any, user.assinatura as string)}
                        alt="Assinatura"
                        className="max-h-20 max-w-[200px] object-contain bg-white p-2 border rounded"
                      />
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="text-xs text-slate-600">
                          Usando assinatura padrão do usuário.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-sm">
                      <p className="text-xs text-slate-500 text-center">
                        Esta proposta não possui assinatura registrada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedProposta && (
                <div className="w-full mt-8">
                  <ProposalHistory proposalId={selectedProposta.id} />
                </div>
              )}

              <div className="w-full mt-4 border-t border-slate-200 pt-6">
                {renderCadastroActionBars()}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <ImportadorInteligente
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        config={importConfig}
      />

      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="mb-4 shrink-0">
            <DialogTitle className="text-lg font-normal text-slate-700">
              Histórico da Proposta: {historyProposta?.numero_proposta}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoadingHistory ? (
              <div className="py-12 text-center text-slate-500">Carregando histórico...</div>
            ) : historyLogs.length <= 1 ? (
              <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-md border border-slate-100">
                Nenhum histórico de alteração encontrado
              </div>
            ) : (
              <div className="space-y-6">
                {historyLogs.map((log) => {
                  if (log.isCreate) {
                    return (
                      <div
                        key={log.id}
                        className="border border-slate-200 rounded-md p-4 shadow-sm bg-slate-50"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-slate-700 text-base">
                              Proposta Criada
                            </span>
                            <span className="text-slate-500 text-sm">
                              {log.created && !isNaN(new Date(log.created).getTime())
                                ? format(new Date(log.created), 'dd/MM/yyyy HH:mm')
                                : '-'}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-slate-500 bg-white border-slate-200 font-normal"
                          >
                            Original
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          <strong>Por:</strong>{' '}
                          {log.expand?.user?.name || log.expand?.user?.email || 'Sistema'}
                        </div>
                      </div>
                    )
                  }

                  const versionName =
                    log.versionOld && log.versionNew
                      ? `Versão ${log.versionOld} ➔ ${log.versionNew}`
                      : `Alteração`

                  const logDate = log.created ? new Date(log.created) : new Date()
                  const isValidDate = !isNaN(logDate.getTime())

                  return (
                    <div
                      key={log.id}
                      className="border border-slate-200 rounded-md p-5 shadow-sm bg-white"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#337ab7] text-base">
                            {versionName}
                          </span>
                          <span className="text-slate-500 text-sm">
                            {isValidDate ? format(logDate, 'dd/MM/yyyy HH:mm') : '-'}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-blue-700 bg-blue-50 border-blue-200 font-normal"
                        >
                          Modificada
                        </Badge>
                      </div>
                      <div className="text-sm text-slate-600 mb-4">
                        <strong>Por:</strong>{' '}
                        {log.expand?.user?.name || log.expand?.user?.email || 'Sistema'}
                      </div>

                      {log.diffs && log.diffs.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Alterações:
                          </h4>
                          {log.diffs.map((diff: any, i: number) => {
                            const diffContent = renderDiff(diff)
                            if (!diffContent) return null
                            return (
                              <div
                                key={i}
                                className="bg-slate-50/50 rounded-md border border-slate-100 p-3"
                              >
                                {diffContent}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-100">
                          Nenhum campo principal alterado nesta revisão.
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-xl font-normal text-[#337ab7]">
              Visualizar Proposta: {viewProposta?.numero_proposta}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {viewProposta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-700">
                <div className="col-span-1 md:col-span-2 mb-2 p-3 bg-[#337ab7]/5 border border-[#337ab7]/20 rounded-sm">
                  <span className="text-xs font-bold text-[#337ab7] uppercase tracking-wider">
                    Responsável Interno: {viewProposta.expand?.user?.name || '-'}{' '}
                    <span className="font-normal text-slate-500">
                      (Setor: {viewProposta.expand?.user?.setor || 'Comercial'})
                    </span>
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cliente
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.cliente?.fantasia ||
                      viewProposta.expand?.cliente?.razao_social ||
                      viewProposta.cliente_original ||
                      '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contato
                  </span>
                  <span className="font-medium">{viewProposta.contato || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Telefone
                  </span>
                  <span className="font-medium">{viewProposta.telefone || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Versão
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.versao?.nome || viewProposta.versao_original || '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Representante (Externo)
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.representante?.fantasia ||
                      viewProposta.representante_original ||
                      '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gerente
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.gerente?.nome || viewProposta.gerente_original || '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Setor do Responsável
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.user?.setor || 'Comercial'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </span>
                  <span className="font-medium">{viewProposta.status || 'Em Análise'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Moeda
                  </span>
                  <span className="font-medium">{viewProposta.moeda || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor Final
                  </span>
                  <span className="font-medium text-[#337ab7] text-base">
                    {formatCurrency(viewProposta.valor_final, viewProposta.moeda)}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Prazo de Entrega
                  </span>
                  <span className="font-medium">{viewProposta.prazo_entrega || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Condições de Pagamento
                  </span>
                  <span className="font-medium">{viewProposta.condicoes_pagamento || '-'}</span>
                </div>

                {viewProposta.acessorios_proposta &&
                  viewProposta.acessorios_proposta.length > 0 && (
                    <div className="col-span-1 md:col-span-2 mt-6">
                      <h4 className="text-sm font-bold text-[#337ab7] mb-3 flex items-center gap-2">
                        <List className="w-4 h-4" />
                        Acessórios da Proposta
                      </h4>
                      <div className="border border-slate-200 rounded-sm overflow-hidden">
                        <table className="w-full text-left text-xs bg-white border-collapse">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-3 font-semibold text-slate-600">Acessório</th>
                              <th className="py-2 px-3 font-semibold text-slate-600">Tipo</th>
                              <th className="py-2 px-3 font-semibold text-slate-600">Moeda</th>
                              <th className="py-2 px-3 font-semibold text-slate-600">Valor</th>
                              <th className="py-2 px-3 font-semibold text-slate-600 text-center">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewProposta.acessorios_proposta.map((acc: any, i: number) => {
                              const estado =
                                acc.estado ||
                                (acc.incluir ? 'incluir' : acc.exibir ? 'exibir' : 'nao_exibir')
                              return (
                                <tr
                                  key={i}
                                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                                >
                                  <td className="py-2.5 px-3 text-slate-700">{acc.nome}</td>
                                  <td className="py-2.5 px-3 text-slate-700">{acc.tipo || '-'}</td>
                                  <td className="py-2.5 px-3 text-slate-700">{acc.moeda || '-'}</td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {formatCurrency(acc.valor, acc.moeda)}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {estado === 'incluir' ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0 text-[10px]"
                                      >
                                        Incluir
                                      </Badge>
                                    ) : estado === 'exibir' ? (
                                      <Badge
                                        variant="outline"
                                        className="bg-blue-50 text-blue-700 border-blue-200 px-1 py-0 text-[10px]"
                                      >
                                        Exibir
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-slate-50 text-slate-500 border-slate-200 px-1 py-0 text-[10px]"
                                      >
                                        Não exibir
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!avancarPropostaItem}
        onOpenChange={(open) => !open && setAvancarPropostaItem(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Avançar Proposta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Selecione o novo status para a proposta{' '}
              <strong className="text-slate-900">{avancarPropostaItem?.numero_proposta}</strong>:
            </p>
            <div className="flex bg-slate-100 rounded-sm p-1 gap-1 border border-slate-200">
              {['Em Análise', 'Aprovada', 'Recusada', 'Excluída'].map((statusOption) => {
                const isSelected = novoStatus === statusOption
                return (
                  <button
                    key={statusOption}
                    onClick={() => setNovoStatus(statusOption)}
                    className={cn(
                      'flex-1 text-[11px] font-medium py-1.5 rounded-sm transition-all',
                      isSelected
                        ? statusOption === 'Aprovada'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : statusOption === 'Recusada'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : statusOption === 'Excluída'
                              ? 'bg-slate-500 text-white shadow-sm'
                              : 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200 hover:shadow-sm',
                    )}
                  >
                    {statusOption}
                  </button>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvancarPropostaItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAvancarProposta} className="bg-[#337ab7] hover:bg-[#286090]">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100">
          <DialogHeader className="p-4 pb-2 shrink-0 bg-white border-b border-slate-200 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-normal text-[#337ab7]">
              Pré-visualização do PDF
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center w-full">
            <div className="shadow-lg transform scale-100 md:scale-95 origin-top w-fit">
              {(() => {
                const selectedCliente = clientes.find((c) => c.id === formData.cliente)
                const selectedRep = representantes.find((r) => r.id === formData.representante)
                const selectedVersao = versoes.find((v) => v.id === formData.versao)
                const modelo = selectedVersao?.expand?.modelo

                return (
                  <PropostaDocument
                    proposta={formData as Partial<Proposta>}
                    tipoProposta={
                      tiposProposta.find((t) => t.id === formData.tipo_proposta) || null
                    }
                    clienteNome={
                      selectedCliente?.fantasia ||
                      selectedCliente?.razao_social ||
                      formData.cliente_original ||
                      '-'
                    }
                    clienteEndereco={
                      selectedCliente
                        ? `${selectedCliente.logradouro || ''}, ${selectedCliente.numero || ''} - ${selectedCliente.bairro || ''} - ${selectedCliente.cidade || ''}`.replace(
                            /^[,\s-]+|[,\s-]+$/g,
                            '',
                          )
                        : ''
                    }
                    clienteEmail={selectedCliente?.email || ''}
                    clienteCnpj={selectedCliente?.documento || ''}
                    representanteNome={
                      selectedRep?.fantasia || formData.representante_original || '-'
                    }
                    representanteSigla={
                      selectedRep?.sigla ||
                      selectedRep?.fantasia?.substring(0, 3).toUpperCase() ||
                      '-'
                    }
                    versaoNome={selectedVersao?.nome || formData.versao_original || '-'}
                    versaoImagemUrl={
                      selectedVersao?.imagem_preview
                        ? pb.files.getURL(selectedVersao as any, selectedVersao.imagem_preview)
                        : null
                    }
                    categoriaNome={
                      modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'
                    }
                    marcaNome={modelo?.expand?.marca?.nome || '-'}
                    gerenteNome={
                      gerentes.find((g) => g.id === formData.gerente)?.nome ||
                      formData.gerente_original ||
                      '-'
                    }
                    acessorios={acessoriosProposta.filter(
                      (a) => a.estado === 'incluir' || a.estado === 'exibir',
                    )}
                    acessoriosStandards={selectedVersao?.acessorios_standards || ''}
                    caracteristicasConstrutivas={selectedVersao?.caracteristicas_construtivas || ''}
                    especificacoesTecnicas={selectedVersao?.especificacoes_tecnicas || ''}
                    assinaturaRepresentanteUrl={
                      selectedProposta?.assinatura_representante
                        ? pb.files.getURL(
                            selectedProposta as any,
                            selectedProposta.assinatura_representante as string,
                          )
                        : propostaSignatureBlob
                          ? URL.createObjectURL(propostaSignatureBlob)
                          : null
                    }
                    representanteAssinaturaUrl={
                      selectedProposta && user?.assinatura
                        ? pb.files.getURL(user as any, user.assinatura as string)
                        : null
                    }
                    issuerName={user?.name}
                    issuerSectorLabel={issuerSectorLabel}
                    gerenteAssinaturaUrl={(() => {
                      const gerente = gerentes.find((gt) => gt.id === formData.gerente)
                      const gUser = gerente?.expand?.usuario
                      return gUser?.assinatura
                        ? pb.files.getURL(gUser as any, gUser.assinatura as string)
                        : null
                    })()}
                  />
                )
              })()}
            </div>
          </div>
          <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0 gap-2">
            <Button variant="outline" onClick={() => setIsPreviewModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!!selectedProposta && !isDirty}
              className="bg-[#337ab7] hover:bg-[#286090]"
            >
              Salvar e Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cancelar Proposta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja cancelar a proposta{' '}
              <strong className="text-slate-900">{selectedProposta?.numero_proposta}</strong>? Esta
              ação moverá a proposta para &quot;Propostas Excluídas&quot;.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleCancelProposta} className="bg-rose-600 hover:bg-rose-700">
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
