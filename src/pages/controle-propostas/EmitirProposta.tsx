import { useState, useEffect } from 'react'
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
import { printProposal } from '@/lib/pdf-generator'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/components/ui/use-toast'

const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'US$' ? 'USD' : currency || 'BRL',
    }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}

const CurrencyInput = ({
  value,
  onChange,
  currency,
  className,
}: {
  value: number | undefined
  onChange: (val: number) => void
  currency: string
  className: string
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
      type={isFocused ? 'number' : 'text'}
      className={className}
      value={isFocused ? (value ?? '') : localValue}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        const val = parseFloat(e.target.value)
        onChange(isNaN(val) ? 0 : val)
      }}
      step="0.01"
    />
  )
}

export default function EmitirProposta() {
  const { toast } = useToast()
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
  const [acessoriosProposta, setAcessoriosProposta] = useState<any[]>([])

  // Local UI states for fields not directly in the Proposta schema
  const [estoqueUI, setEstoqueUI] = useState('')
  const [descontoUI, setDescontoUI] = useState('')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

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

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField
      const res = await getPropostasPaginated(page, perPage, sortParam)
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (error) {
      console.error('Failed to load propostas', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, sortField, sortDirection])

  useEffect(() => {
    getTiposProposta()
      .then(setTiposProposta)
      .catch(() => {})
    pb.collection('gerentes')
      .getFullList({ sort: 'nome' })
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
      .getFullList({ sort: 'nome' })
      .then(setVersoes)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'cadastro') {
      if (selectedProposta) {
        setFormData({
          ...selectedProposta,
          revisao: selectedProposta.revisao || 'A',
          moeda: selectedProposta.moeda || 'US$',
          valor_sem_desconto: selectedProposta.valor_sem_desconto || 0,
          valor_atual: selectedProposta.valor_atual || 0,
          valor_final: selectedProposta.valor_final || 0,
          nota_rep: selectedProposta.nota_rep || 1,
        })

        if (
          selectedProposta.acessorios_proposta &&
          selectedProposta.acessorios_proposta.length > 0
        ) {
          setAcessoriosProposta(
            selectedProposta.acessorios_proposta.map((a: any) => ({
              ...a,
              incluir: a.incluir ?? a.estado === 'incluir',
              exibir: a.exibir ?? (a.estado === 'exibir' || a.estado === 'incluir'),
            })),
          )
        } else {
          loadAcessorios(selectedProposta.versao)
        }
      } else {
        setFormData({
          revisao: 'A',
          moeda: 'US$',
          valor_sem_desconto: 0,
          valor_atual: 0,
          valor_final: 0,
          nota_rep: 1,
        })
        loadAcessorios('')
      }
    }
  }, [selectedProposta, activeTab])

  const loadAcessorios = async (versaoId?: string) => {
    if (!versaoId) {
      setAcessoriosProposta([])
      return
    }
    try {
      const filter = `versoes ~ "${versaoId}"`
      const list = await pb.collection('acessorios').getFullList({ filter })
      const initial = list.map((a) => ({
        id: a.id,
        nome: a.nome,
        tipo: a.tipo,
        valor: a.valor,
        moeda: a.moeda,
        incluir: false,
        exibir: true,
      }))
      setAcessoriosProposta(initial)
    } catch (e) {
      console.error('Failed to load accessories', e)
    }
  }

  const handleVersaoChange = (versaoId: string) => {
    const versao = versoes.find((v) => v.id === versaoId)
    setFormData((prev) => ({
      ...prev,
      versao: versaoId,
      ...(versao
        ? {
            valor_sem_desconto: versao.valor || 0,
            valor_atual: versao.valor || 0,
            valor_final: versao.valor || 0,
            moeda: versao.moeda === 'USD' ? 'US$' : versao.moeda || prev.moeda,
          }
        : {}),
    }))
    loadAcessorios(versaoId)
  }

  const renderConvertedValue = () => {
    if (!formData.valor_final || !exchangeRates) return null

    if (formData.moeda === 'US$' || formData.moeda === 'USD') {
      return (
        <div className="text-[10px] text-slate-500 mt-1">
          Aprox. {formatCurrency(formData.valor_final * exchangeRates.USD, 'BRL')}
        </div>
      )
    }
    if (formData.moeda === 'EUR') {
      return (
        <div className="text-[10px] text-slate-500 mt-1">
          Aprox. {formatCurrency(formData.valor_final * exchangeRates.EUR, 'BRL')}
        </div>
      )
    }
    if (formData.moeda === 'BRL') {
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

  const handleEdit = (item: Proposta) => {
    setSelectedProposta(item)
    setActiveTab('cadastro')
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
        if (oldAcc.incluir !== newAcc.incluir)
          accDiffs.push(
            `Incluir: ${oldAcc.incluir ? 'Sim' : 'Não'} ➔ ${newAcc.incluir ? 'Sim' : 'Não'}`,
          )
        if (oldAcc.exibir !== newAcc.exibir)
          accDiffs.push(
            `Exibir: ${oldAcc.exibir ? 'Sim' : 'Não'} ➔ ${newAcc.exibir ? 'Sim' : 'Não'}`,
          )
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
    if (field.includes('valor') || field.includes('desconto')) {
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

  const handleCreateNew = () => {
    setSelectedProposta(null)
    setActiveTab('cadastro')
  }

  const handleSave = async () => {
    if (!formData.tipo_proposta) {
      toast({ title: 'Selecione um Tipo de Proposta obrigatório', variant: 'destructive' })
      return
    }

    try {
      if (selectedProposta) {
        await updateProposta(selectedProposta.id, {
          ...formData,
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta atualizada com sucesso' })
      } else {
        await pb.collection('propostas').create({
          ...formData,
          numero_proposta: formData.numero_proposta || 'NOVA-0',
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta criada com sucesso' })
      }
      loadData()
      setActiveTab('registros')
    } catch (e) {
      toast({ title: 'Erro ao salvar proposta', variant: 'destructive' })
    }
  }

  const handleGerarPDF = () => {
    if (!selectedProposta) {
      toast({
        title: 'Selecione ou salve uma proposta primeiro para gerar o PDF',
        variant: 'destructive',
      })
      return
    }

    const tp = selectedProposta.expand?.tipo_proposta
    const cliente = selectedProposta.expand?.cliente
    const versao = selectedProposta.expand?.versao
    const representante = selectedProposta.expand?.representante

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({ title: 'O bloqueador de pop-ups bloqueou a impressão.', variant: 'destructive' })
      return
    }

    const tpCondPagto =
      selectedProposta.condicoes_pagamento || tp?.condicoes_pagamento || 'A combinar.'
    const tpPrazo = selectedProposta.prazo_entrega || tp?.prazo_entrega || 'A combinar.'
    const formasPagto = tp?.formas_pagamento_selecionadas?.length
      ? tp.formas_pagamento_selecionadas.join(', ')
      : ''

    const acessoriosHTML =
      selectedProposta.acessorios_proposta?.length > 0
        ? `
        <div class="section">
          <h3>Acessórios Inclusos</h3>
          <ul class="acc-list">
            ${selectedProposta.acessorios_proposta
              .filter((a: any) => a.incluir || a.estado === 'incluir')
              .map((a: any) => `<li>${a.nome}</li>`)
              .join('')}
          </ul>
        </div>
        `
        : ''

    const termosHTML = tp
      ? `
      <div class="section terms">
        <h3>Termos e Condições Comerciais (${tp.nome})</h3>
        
        <div class="terms-grid">
          ${tp.frase_preco ? `<div class="term-box"><strong>Frase do Preço:</strong> ${tp.frase_preco}</div>` : ''}
          <div class="term-box"><strong>Prazo de Entrega:</strong> ${tpPrazo}</div>
          <div class="term-box"><strong>Condições de Pagamento:</strong> ${tpCondPagto}</div>
          ${formasPagto ? `<div class="term-box"><strong>Formas de Pagamento (Pedido):</strong> ${formasPagto}</div>` : ''}
        </div>

        ${tp.garantia ? `<div class="term-content"><h4>Garantia</h4><p>${tp.garantia}</p></div>` : ''}
        ${tp.assistencia_tecnica ? `<div class="term-content"><h4>Assistência Técnica</h4><p>${tp.assistencia_tecnica}</p></div>` : ''}
        ${tp.treinamento_tecnico ? `<div class="term-content"><h4>Treinamento Técnico</h4><p>${tp.treinamento_tecnico}</p></div>` : ''}
        ${tp.transporte_seguro ? `<div class="term-content"><h4>Transporte/Seguro</h4><p>${tp.transporte_seguro}</p></div>` : ''}
        ${tp.validade_oferta ? `<div class="term-content"><h4>Validade desta Oferta</h4><p>${tp.validade_oferta}</p></div>` : ''}
        ${tp.imposto_ipi ? `<div class="term-content"><h4>Imposto IPI</h4><p>${tp.imposto_ipi}</p></div>` : ''}
        ${tp.imposto_icms ? `<div class="term-content"><h4>Imposto ICMS</h4><p>${tp.imposto_icms}</p></div>` : ''}
      </div>
    `
      : ''

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Proposta Comercial - ${selectedProposta.numero_proposta}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { 
            font-family: 'Inter', sans-serif; 
            padding: 40px; 
            color: #1e293b; 
            line-height: 1.6; 
            max-width: 900px;
            margin: 0 auto;
          }
          h1 { color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; margin-bottom: 30px; }
          h2 { color: #334155; margin-top: 40px; font-size: 1.25em; font-weight: 600; }
          h3 { color: #337ab7; margin-top: 30px; font-size: 1.1em; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
          .header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .info-block { background: #f8fafc; padding: 20px; border-radius: 6px; border: 1px solid #e2e8f0; }
          .info-block p { margin: 8px 0; font-size: 0.95em; }
          .info-block strong { color: #475569; display: inline-block; min-width: 120px; }
          .section { margin-top: 40px; }
          .acc-list { margin: 0; padding-left: 20px; font-size: 0.95em; color: #475569; }
          .acc-list li { margin-bottom: 5px; }
          .total-box { 
            margin-top: 40px; 
            padding: 20px; 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            border-radius: 6px; 
            text-align: right; 
          }
          .total-box span { display: block; font-size: 0.9em; color: #166534; margin-bottom: 5px; }
          .total-box strong { font-size: 1.5em; color: #15803d; }
          .terms-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0 30px 0; }
          .term-box { background: #f1f5f9; padding: 12px 15px; border-radius: 4px; font-size: 0.9em; }
          .term-box strong { display: block; color: #334155; margin-bottom: 4px; }
          .term-content { margin-bottom: 25px; }
          .term-content h4 { margin: 0 0 8px 0; color: #475569; font-size: 1em; }
          .term-content p { margin: 0; font-size: 0.9em; color: #64748b; white-space: pre-wrap; text-align: justify; }
          @media print {
            body { padding: 0; }
            .info-block, .term-box, .total-box { break-inside: avoid; border: 1px solid #ccc; }
            .term-content { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>Proposta Comercial #${selectedProposta.numero_proposta}</h1>

        <div class="header-grid">
          <div class="info-block">
            <h3 style="margin-top:0; color:#334155">Cliente</h3>
            <p><strong>Nome/Razão:</strong> ${cliente?.fantasia || cliente?.razao_social || selectedProposta.cliente_original || '-'}</p>
            <p><strong>Contato:</strong> ${selectedProposta.contato || '-'}</p>
            <p><strong>Telefone:</strong> ${selectedProposta.telefone || '-'}</p>
          </div>
          <div class="info-block">
            <h3 style="margin-top:0; color:#334155">Informações da Proposta</h3>
            <p><strong>Data de Emissão:</strong> ${format(new Date(selectedProposta.created || new Date()), 'dd/MM/yyyy')}</p>
            <p><strong>Representante:</strong> ${representante?.fantasia || selectedProposta.representante_original || '-'}</p>
            <p><strong>Revisão:</strong> ${selectedProposta.revisao || 'A'}</p>
          </div>
        </div>

        <div class="section">
          <h3>Equipamento / Modelo</h3>
          <p style="font-size: 1.1em; color: #1e293b; font-weight: 600;">
            ${versao?.nome || selectedProposta.versao_original || 'Não especificado'}
          </p>
        </div>

        ${acessoriosHTML}

        <div class="total-box">
          <span>Valor Total Final</span>
          <strong>${formatCurrency(selectedProposta.valor_final, selectedProposta.moeda)}</strong>
        </div>

        ${termosHTML}

      </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 700)
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
    const normFrom = from === 'US$' ? 'USD' : from
    const normTo = to === 'US$' ? 'USD' : to
    if (normFrom === normTo) return value

    let inBrl = value
    if (normFrom === 'USD') inBrl = value * exchangeRates.USD
    if (normFrom === 'EUR') inBrl = value * exchangeRates.EUR

    if (normTo === 'USD') return inBrl / exchangeRates.USD
    if (normTo === 'EUR') return inBrl / exchangeRates.EUR
    return inBrl
  }

  const updateAcc = (index: number, field: 'incluir' | 'exibir', value: boolean) => {
    const newAcc = [...acessoriosProposta]
    const oldIncluir = newAcc[index].incluir
    newAcc[index][field] = value
    setAcessoriosProposta(newAcc)

    if (field === 'incluir' && oldIncluir !== value) {
      const acc = newAcc[index]
      const accMoeda = acc.moeda || 'BRL'
      const propMoeda = formData.moeda || 'US$'
      const convertedValue = convertCurrency(acc.valor || 0, accMoeda, propMoeda)

      setFormData((prev) => {
        const current = prev.valor_final || 0
        const next = value ? current + convertedValue : current - convertedValue
        const roundedNext = Math.round(next * 100) / 100
        return {
          ...prev,
          valor_final: roundedNext,
          valor_atual: roundedNext,
          valor_sem_desconto: roundedNext,
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

  const renderCadastroActionBars = () => (
    <div className="flex gap-2">
      <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
        PESQUISAR
      </Button>
      <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
        VISUALIZAR PROPOSTA
      </Button>
      <Button
        onClick={handleSave}
        className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal"
      >
        SALVAR PROPOSTA
      </Button>
      <Button
        onClick={() => {
          if (selectedProposta) {
            printProposal(selectedProposta)
          } else {
            toast({ title: 'Salve a proposta antes de gerar o PDF', variant: 'default' })
          }
        }}
        disabled={!selectedProposta}
        className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal disabled:opacity-50"
      >
        GERAR PDF
      </Button>
    </div>
  )

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px]'
  const labelClass = 'text-[11px] font-bold text-slate-700 mb-1'

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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              onClick={() => {
                if (activeTab !== 'cadastro' && !selectedProposta) {
                  handleCreateNew()
                }
              }}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-4">
            {activeTab === 'registros' && renderTopPagination()}
          </div>
        </div>

        <TabsContent value="registros" className="flex-1 min-h-0 m-0 overflow-y-auto outline-none">
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
                {renderSortableHead('Representante', 'representante_original')}
                {renderSortableHead('Nota Rep.', 'nota_rep')}
                {renderSortableHead('Valor', 'valor_final')}
                {renderSortableHead('Dt. Cad', 'dt_cad')}
                {renderSortableHead('Por', 'created')}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                    Nenhuma proposta encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50 border-b border-slate-200 group"
                  >
                    <TableCell className="align-top py-2.5 px-3">
                      <Checkbox
                        className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="align-top py-2 px-3 min-w-[100px] border-r border-slate-100">
                      <div className="text-slate-600 text-xs mb-1">{item.numero_proposta}</div>
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
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px]">
                      {item.nota_rep || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                      {formatCurrency(item.valor_final, item.moeda)}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                      {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                      {item.expand?.user?.name || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent
          value="cadastro"
          className="flex-1 min-h-0 m-0 overflow-y-auto outline-none p-6 bg-white"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col items-start pb-10">
            <div className="mb-6 w-full border-b border-slate-200 pb-4">
              {renderCadastroActionBars()}
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
                <select
                  className={inputClass}
                  value={formData.representante || ''}
                  onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
                >
                  <option value=""></option>
                  {representantes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fantasia}
                    </option>
                  ))}
                </select>
                {formData.representante_original && !formData.representante && (
                  <span className="text-[10px] text-amber-600 mt-0.5">
                    Original: {formData.representante_original}
                  </span>
                )}
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Cliente</label>
                <select
                  className={inputClass}
                  value={formData.cliente || ''}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                >
                  <option value=""></option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fantasia || c.razao_social}
                    </option>
                  ))}
                </select>
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

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Versão</label>
                <select
                  className={inputClass}
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
                  onChange={(e) => setFormData({ ...formData, tipo_proposta: e.target.value })}
                >
                  <option value="">-- Selecione o Tipo de Proposta --</option>
                  {tiposProposta.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Tipo de Proposta *</label>
                <select
                  className={inputClass}
                  required
                  value={formData.tipo_proposta || ''}
                  onChange={(e) => setFormData({ ...formData, tipo_proposta: e.target.value })}
                >
                  <option value=""></option>
                  {tiposProposta.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.nome}
                    </option>
                  ))}
                </select>
              </div>
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
                  value={formData.moeda || ''}
                  onChange={(e) => {
                    const newMoeda = e.target.value
                    const oldMoeda = formData.moeda || 'US$'
                    const currentTotal = formData.valor_final || 0
                    const convertedTotal =
                      Math.round(convertCurrency(currentTotal, oldMoeda, newMoeda) * 100) / 100
                    setFormData({
                      ...formData,
                      moeda: newMoeda,
                      valor_final: convertedTotal,
                      valor_atual: convertedTotal,
                      valor_sem_desconto: convertedTotal,
                    })
                  }}
                >
                  <option value="BRL">BRL</option>
                  <option value="US$">US$</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Valor</label>
                <CurrencyInput
                  className={inputClass}
                  value={formData.valor_final}
                  currency={formData.moeda || 'US$'}
                  onChange={(val) =>
                    setFormData({
                      ...formData,
                      valor_final: val,
                      valor_atual: val,
                      valor_sem_desconto: val,
                    })
                  }
                />
                {renderConvertedValue()}
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Desconto</label>
                <select
                  className={inputClass}
                  value={descontoUI}
                  onChange={(e) => setDescontoUI(e.target.value)}
                >
                  <option value=""></option>
                  <option value="5%">5%</option>
                  <option value="10%">10%</option>
                </select>
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
                        Exibir na Proposta
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {acessoriosProposta.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
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
                            <Checkbox
                              checked={acc.incluir}
                              onCheckedChange={(checked) => updateAcc(idx, 'incluir', !!checked)}
                              className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <Checkbox
                              checked={acc.exibir}
                              onCheckedChange={(checked) => updateAcc(idx, 'exibir', !!checked)}
                              className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="w-full mt-4 border-t border-slate-200 pt-6">
              {renderCadastroActionBars()}
            </div>
          </div>
        </TabsContent>
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
                              {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
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
                            {format(new Date(log.created), 'dd/MM/yyyy HH:mm')}
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
                    Representante
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
                                Incluído
                              </th>
                              <th className="py-2 px-3 font-semibold text-slate-600 text-center">
                                Exibido
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {viewProposta.acessorios_proposta.map((acc: any, i: number) => (
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
                                  {acc.incluir || acc.estado === 'incluir' ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0 text-[10px]"
                                    >
                                      Sim
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-slate-50 text-slate-500 border-slate-200 px-1 py-0 text-[10px]"
                                    >
                                      Não
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {acc.exibir ||
                                  acc.estado === 'exibir' ||
                                  acc.estado === 'incluir' ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-emerald-50 text-emerald-700 border-emerald-200 px-1 py-0 text-[10px]"
                                    >
                                      Sim
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-slate-50 text-slate-500 border-slate-200 px-1 py-0 text-[10px]"
                                    >
                                      Não
                                    </Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
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
    </div>
  )
}
