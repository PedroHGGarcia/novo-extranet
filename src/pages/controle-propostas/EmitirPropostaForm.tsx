import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { List, Eye, FileText, PenTool, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getProposta, updateProposta, type Proposta } from '@/services/propostas'
import { getTiposProposta, type TipoProposta } from '@/services/tipos-propostas'
import { searchClientesPaginated, getGerentes } from '@/services/cadastros'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { PropostaDocument } from '@/components/PropostaDocument'
import { SignaturePad } from '@/components/SignaturePad'
import { SearchableCombobox } from '@/components/SearchableCombobox'
import { VersionSelector } from '@/components/VersionSelector'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { getProjetosByCliente } from '@/services/projetos'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import pb from '@/lib/pocketbase/client'
import { formatCurrency, mapCurrencyCode, CurrencyInput } from './utils'
import { ReCaptcha } from '@/components/ReCaptcha'
import { verifyReCaptchaToken } from '@/services/recaptcha'

interface EmitirPropostaFormProps {
  selectedProposta: Proposta | null
  onSaved: () => void
  onCancel: () => void
}

export function EmitirPropostaForm({
  selectedProposta,
  onSaved,
  onCancel,
}: EmitirPropostaFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [gerentes, setGerentes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [versoes, setVersoes] = useState<any[]>([])
  const [tiposProposta, setTiposProposta] = useState<TipoProposta[]>([])
  const [projetos, setProjetos] = useState<any[]>([])

  const [formData, setFormData] = useState<Partial<Proposta>>({})
  const [initialFormData, setInitialFormData] = useState<Partial<Proposta>>({})
  const [acessoriosProposta, setAcessoriosProposta] = useState<any[]>([])
  const [initialAcessorios, setInitialAcessorios] = useState<any[]>([])
  const [estoqueUI, setEstoqueUI] = useState('')
  const [propostaSignatureBlob, setPropostaSignatureBlob] = useState<Blob | null>(null)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [useProfileSignature, setUseProfileSignature] = useState(false)
  const [formTouched, setFormTouched] = useState(false)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)

  const [exchangeRates, setExchangeRates] = useState<{
    USD: number
    EUR: number
    usdPct: number
    eurPct: number
  } | null>(null)
  const [exchangeRatesLoading, setExchangeRatesLoading] = useState(true)

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetchExchangeRates = async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)
      try {
        const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL', {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const d = await res.json()
        if (!d?.USDBRL?.bid || !d?.EURBRL?.bid) throw new Error('Invalid response format')
        if (mounted) {
          setExchangeRates({
            USD: parseFloat(d.USDBRL.bid),
            usdPct: parseFloat(d.USDBRL.pctChange),
            EUR: parseFloat(d.EURBRL.bid),
            eurPct: parseFloat(d.EURBRL.pctChange),
          })
        }
      } catch {
        if (mounted) setExchangeRates(null)
      } finally {
        clearTimeout(timeoutId)
        if (mounted) setExchangeRatesLoading(false)
      }
    }
    fetchExchangeRates()
    pb.collection('representantes')
      .getFullList({ sort: 'fantasia' })
      .then((r) => {
        if (mounted) setRepresentantes(r)
      })
      .catch(() => {})
    pb.collection('versoes')
      .getFullList({ sort: 'nome', expand: 'modelo.marca,modelo.produto.categoria' })
      .then((r) => {
        if (mounted) setVersoes(r)
      })
      .catch(() => {})
    getGerentes()
      .then((r) => {
        if (mounted) setGerentes(r)
      })
      .catch(() => {})
    getTiposProposta()
      .then((r) => {
        if (mounted) setTiposProposta(r)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (selectedProposta) {
      const mappedData = {
        ...selectedProposta,
        revisao: selectedProposta.revisao || 'A',
        moeda: mapCurrencyCode(selectedProposta.moeda),
        valor_sem_desconto: selectedProposta.valor_sem_desconto || 0,
        valor_atual: selectedProposta.valor_atual || 0,
        valor_final: selectedProposta.valor_final || 0,
        percentual_desconto: selectedProposta.percentual_desconto || 0,
        nota_rep: selectedProposta.nota_rep || 1,
      }
      setFormData(mappedData)
      setInitialFormData(mappedData)
      if (selectedProposta.acessorios_proposta?.length > 0) {
        const buildAcc = () =>
          selectedProposta.acessorios_proposta.map((a: any) => {
            let estado = a.estado
            if (!estado) {
              estado = a.incluir ? 'incluir' : a.exibir ? 'exibir' : 'nao_exibir'
            }
            return { ...a, estado }
          })
        setAcessoriosProposta(buildAcc())
        setInitialAcessorios(buildAcc())
      } else {
        loadAcessorios(selectedProposta.versao)
      }
    } else {
      const newFormData = {
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
        modelo_licitacao: false,
        projeto: '',
      }
      setFormData(newFormData)
      setInitialFormData(newFormData)
      loadAcessorios('')
      setPropostaSignatureBlob(null)
      setSignatureConfirmed(false)
      setUseProfileSignature(!!user?.assinatura)
      setRecaptchaToken(null)
    }
  }, [selectedProposta, user])

  useEffect(() => {
    if (selectedProposta?.cliente) {
      pb.collection('clientes')
        .getOne(selectedProposta.cliente)
        .then((c) => setClientes((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c])))
        .catch(() => {})
    }
  }, [selectedProposta])

  useEffect(() => {
    if (!formData.cliente) {
      setProjetos([])
      return
    }
    getProjetosByCliente(formData.cliente)
      .then(setProjetos)
      .catch(() => setProjetos([]))
  }, [formData.cliente])

  useEffect(() => {
    if (selectedProposta?.projeto) {
      pb.collection('projetos')
        .getOne(selectedProposta.projeto)
        .then((p) => setProjetos((prev) => (prev.some((i) => i.id === p.id) ? prev : [...prev, p])))
        .catch(() => {})
    }
  }, [selectedProposta])

  const loadAcessorios = async (versaoId?: string) => {
    if (!versaoId) {
      setAcessoriosProposta([])
      setInitialAcessorios([])
      return
    }
    try {
      const list = await pb
        .collection('acessorios')
        .getFullList({ filter: `versoes ~ "${versaoId}"` })
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
      if (!selectedProposta || !selectedProposta.acessorios_proposta?.length)
        setInitialAcessorios(buildAcc())
    } catch (e) {
      console.error('Failed to load accessories', e)
    }
  }

  const convertCurrency = (value: number, from: string, to: string) => {
    if (!exchangeRates || value === 0) return value
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
          moeda: mapCurrencyCode(versao.moeda),
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

  const handleClienteChange = (clienteId: string) => {
    if (!clienteId) {
      setFormData((prev) => ({ ...prev, cliente: '', contato: '', telefone: '', projeto: '' }))
      return
    }
    const cliente = clientes.find((c) => c.id === clienteId)
    if (cliente) {
      setFormData((prev) => ({
        ...prev,
        cliente: clienteId,
        contato: cliente.contato || '',
        telefone: cliente.telefone || cliente.celular || '',
        projeto: '',
      }))
    } else {
      setFormData((prev) => ({ ...prev, cliente: clienteId, projeto: '' }))
      pb.collection('clientes')
        .getOne(clienteId)
        .then((c) => {
          setClientes((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]))
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
      const convertedValue = convertCurrency(
        acc.valor || 0,
        acc.moeda || 'BRL',
        formData.moeda || 'USD',
      )
      setFormData((prev) => {
        const currentBase = prev.valor_sem_desconto || 0
        const nextBase =
          novoEstado === 'incluir' ? currentBase + convertedValue : currentBase - convertedValue
        const roundedBase = Math.round(nextBase * 100) / 100
        const desc = prev.percentual_desconto || 0
        const nextFinal = Math.round(roundedBase * (1 - desc / 100) * 100) / 100
        return {
          ...prev,
          valor_sem_desconto: roundedBase,
          valor_final: nextFinal,
          valor_atual: nextFinal,
        }
      })
    }
  }

  const searchRepresentantes = useCallback(async (query: string) => {
    const res = await pb.collection('representantes').getList(1, 20, {
      filter: `documento ~ "${query}" || fantasia ~ "${query}"`,
      sort: 'fantasia',
    })
    return res.items
  }, [])

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
      if (norm1 !== norm2) return true
    }
    return JSON.stringify(acessoriosProposta) !== JSON.stringify(initialAcessorios)
  }, [formData, initialFormData, acessoriosProposta, initialAcessorios, selectedProposta])

  useUnsavedChanges(selectedProposta ? isDirty : formTouched)

  const missingFields = useMemo(() => {
    const missing: string[] = []
    if (!formData.cliente) missing.push('Cliente')
    if (!formData.versao) missing.push('Versão')
    if (!formData.representante) missing.push('Representante')
    if (!formData.tipo_proposta) missing.push('Tipo de Proposta')
    if (!selectedProposta && !signatureConfirmed && !useProfileSignature) missing.push('Assinatura')
    if (!selectedProposta && !recaptchaToken) missing.push('reCAPTCHA')
    return missing
  }, [
    formData.cliente,
    formData.versao,
    formData.representante,
    formData.tipo_proposta,
    selectedProposta,
    signatureConfirmed,
    useProfileSignature,
    recaptchaToken,
  ])

  const requiredFieldsValid = missingFields.length === 0

  const issuerSectorLabel = useMemo(() => {
    if (!user) return 'Responsável Interno'
    if (user.setor) return user.setor
    const userGerente = gerentes.find((g) => g.usuario === user.id)
    if (userGerente?.cargo) return userGerente.cargo
    if (user.role === 'admin') return 'Comercial'
    return 'Comercial'
  }, [user, gerentes])

  const handleSave = async () => {
    if ((formData.percentual_desconto || 0) > 28) {
      toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
      return
    }
    if (!formData.cliente) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    if (!formData.versao) {
      toast({ title: 'Selecione uma versão', variant: 'destructive' })
      return
    }
    if (!formData.representante) {
      toast({ title: 'Selecione um representante', variant: 'destructive' })
      return
    }
    if (!formData.tipo_proposta) {
      toast({ title: 'Selecione um Tipo de Proposta', variant: 'destructive' })
      return
    }
    if (!selectedProposta && !signatureConfirmed && !useProfileSignature) {
      toast({ title: 'Assinatura do representante é obrigatória', variant: 'destructive' })
      return
    }
    if (!selectedProposta && !recaptchaToken) {
      toast({
        title: 'Verificação de segurança obrigatória',
        description: 'Por favor, complete a verificação reCAPTCHA para emitir a proposta.',
        variant: 'destructive',
      })
      return
    }
    if (selectedProposta && user?.id !== selectedProposta.user) {
      toast({ title: 'Sem permissão para modificar', variant: 'destructive' })
      return
    }

    if (!selectedProposta && recaptchaToken) {
      const verification = await verifyReCaptchaToken(recaptchaToken)
      if (!verification.success && !verification.fallback) {
        toast({
          title: 'Falha na verificação do reCAPTCHA',
          description:
            verification.error || 'Falha na verificação do reCAPTCHA. Por favor, tente novamente.',
          variant: 'destructive',
        })
        return
      }
    }

    const cleanData = stripSystemFields(formData)
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(cleanData)) {
      if (value !== undefined) sanitized[key] = value
    }
    ;['cliente', 'versao', 'representante', 'gerente', 'tipo_proposta', 'projeto'].forEach((f) => {
      if (sanitized[f] === '') sanitized[f] = null
    })

    try {
      if (selectedProposta) {
        await updateProposta(selectedProposta.id, {
          ...sanitized,
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta atualizada com sucesso' })
        setInitialFormData({ ...formData })
        setInitialAcessorios(acessoriosProposta.map((a) => ({ ...a })))
        setFormTouched(false)
        onSaved()
        return
      } else {
        const fd = new FormData()
        for (const [key, value] of Object.entries(sanitized)) {
          if (value !== undefined && value !== null)
            fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        }
        fd.append('user', user?.id || '')
        fd.append('numero_proposta', sanitized.numero_proposta || 'NOVA-0')
        fd.append('acessorios_proposta', JSON.stringify(acessoriosProposta))
        if (recaptchaToken) {
          fd.append('recaptcha_token', recaptchaToken)
        }
        if (propostaSignatureBlob) {
          fd.append(
            'assinatura_representante',
            propostaSignatureBlob,
            'assinatura-representante.png',
          )
        } else if (useProfileSignature && user?.assinatura) {
          const sigUrl = pb.files.getURL(user as any, user.assinatura as string)
          const sigRes = await fetch(sigUrl)
          const sigBlob = await sigRes.blob()
          fd.append('assinatura_representante', sigBlob, 'assinatura-representante.png')
        }
        await pb.collection('propostas').create(fd)
        toast({ title: 'Proposta criada com sucesso!' })
        onSaved()
        return
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

  const handlePreviewPDF = () => {
    if ((formData.percentual_desconto || 0) > 28) {
      toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
      return
    }
    if (!formData.cliente) {
      toast({ title: 'Selecione um cliente', variant: 'destructive' })
      return
    }
    if (!formData.dt_cad)
      setFormData((prev) => ({ ...prev, dt_cad: format(new Date(), 'yyyy-MM-dd') }))
    setIsPreviewModalOpen(true)
  }

  const handleCancelProposta = async () => {
    if (!selectedProposta) return
    if (user?.id !== selectedProposta.user) {
      toast({ title: 'Sem permissão', variant: 'destructive' })
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
      onCancel()
    } catch (e) {
      toast({ title: 'Erro ao cancelar', description: getErrorMessage(e), variant: 'destructive' })
    }
  }

  const printProposal = () => {
    if (!selectedProposta?.id) {
      toast({ title: 'Salve antes de gerar o PDF', variant: 'default' })
      return
    }
    window.open(`/controle-propostas/proposta-pdf/${selectedProposta.id}`, '_blank')
  }

  const inputClass =
    'w-full bg-background border border-input rounded-md px-3 py-2 outline-none text-slate-700 text-sm focus:border-primary focus:ring-1 focus:ring-ring min-h-[38px] transition-colors'
  const labelClass = 'text-sm font-medium text-slate-700 mb-2'
  const isOverDiscount = (formData.percentual_desconto || 0) > 28
  const isOwner = !selectedProposta || user?.id === selectedProposta.user
  const canSave = !isOverDiscount && isOwner && requiredFieldsValid

  const renderActionBar = () => (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2 flex-wrap items-center">
        <Button
          onClick={handlePreviewPDF}
          disabled={isOverDiscount || !formData.cliente}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 h-auto text-sm shadow-none font-medium disabled:opacity-50"
        >
          Visualizar proposta
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className={cn(
            'text-primary-foreground rounded-md px-4 py-2 h-auto text-sm shadow-none font-medium transition-all',
            canSave
              ? 'bg-primary hover:bg-primary/90 ring-2 ring-primary/30 ring-offset-1'
              : 'bg-primary disabled:opacity-50',
          )}
        >
          {selectedProposta ? 'ATUALIZAR PROPOSTA' : 'GERAR PROPOSTA'}
        </Button>
        <Button
          onClick={printProposal}
          disabled={!selectedProposta || isOverDiscount}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-md px-4 py-2 h-auto text-sm shadow-none font-medium disabled:opacity-50"
        >
          GERAR PDF
        </Button>
        {selectedProposta && (
          <Button
            onClick={() => setIsCancelDialogOpen(true)}
            disabled={!isOwner}
            className="bg-rose-600 hover:bg-rose-700 text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal disabled:opacity-50"
          >
            Cancelar
          </Button>
        )}
        {selectedProposta && (
          <span
            className={cn(
              'text-[10px] font-medium ml-auto flex items-center gap-1',
              isDirty ? 'text-amber-600' : 'text-emerald-600',
            )}
          >
            {isDirty ? '● Alterações não salvas' : '✓ Salvo'}
          </span>
        )}
        {!selectedProposta && formTouched && (
          <span className="text-[10px] font-medium ml-auto text-amber-600">
            ● Alterações não salvas
          </span>
        )}
      </div>
      {missingFields.length > 0 && (
        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 animate-fade-in">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
          Campos obrigatórios pendentes: {missingFields.join(', ')}
        </div>
      )}
    </div>
  )

  return (
    <div
      className="flex flex-col h-full overflow-y-auto bg-white"
      onChange={() => setFormTouched(true)}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col items-start p-6 pb-10">
        <div className="mb-6 w-full border-b border-slate-200 pb-4">{renderActionBar()}</div>

        <div className="mb-4 w-full p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            Responsável Interno: {selectedProposta?.expand?.user?.name || user?.name || '-'}{' '}
            <span className="font-normal text-slate-500">
              (Setor: {selectedProposta?.expand?.user?.setor || user?.setor || 'Comercial'})
            </span>
          </span>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="flex flex-col w-full">
            <label className={labelClass}>Código</label>
            <input
              className={cn(inputClass, 'bg-muted')}
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
              <span className="text-[10px] text-amber-600 mt-0.5">Representante é obrigatório</span>
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
              className={cn(inputClass, !formData.cliente && 'border-amber-300 bg-amber-50/30')}
              onPaginatedSearch={searchClientesPaginated}
            />
            {!formData.cliente && (
              <span className="text-[10px] text-amber-600 mt-0.5">Cliente é obrigatório</span>
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
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
            <VersionSelector
              versions={versoes}
              value={formData.versao || ''}
              onChange={(id) => handleVersaoChange(id)}
              className={cn(!formData.versao && 'border-amber-300 bg-amber-50/30')}
            />
            {!formData.versao && (
              <span className="text-[10px] text-amber-600 mt-0.5">Versão é obrigatória</span>
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
                let updatedAcc = acessoriosProposta
                let valueChange = 0
                if (tipo?.acessorios_default?.length > 0 && acessoriosProposta.length > 0) {
                  const defaults = tipo.acessorios_default
                  updatedAcc = acessoriosProposta.map((acc) => {
                    const def = defaults.find((d) => d.acessorio_id === acc.id)
                    return def ? { ...acc, estado: def.estado } : acc
                  })
                  const propMoeda = formData.moeda || 'USD'
                  updatedAcc.forEach((acc, idx) => {
                    const oldInc = acessoriosProposta[idx].estado === 'incluir'
                    const newInc = acc.estado === 'incluir'
                    if (newInc && !oldInc)
                      valueChange += convertCurrency(acc.valor || 0, acc.moeda || 'BRL', propMoeda)
                    else if (!newInc && oldInc)
                      valueChange -= convertCurrency(acc.valor || 0, acc.moeda || 'BRL', propMoeda)
                  })
                  setAcessoriosProposta(updatedAcc)
                }
                const newBase =
                  valueChange !== 0
                    ? Math.round(((formData.valor_sem_desconto || 0) + valueChange) * 100) / 100
                    : formData.valor_sem_desconto
                const desc = formData.percentual_desconto || 0
                const newFinal =
                  valueChange !== 0
                    ? Math.round(newBase * (1 - desc / 100) * 100) / 100
                    : formData.valor_final
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
                  ...(valueChange !== 0
                    ? { valor_sem_desconto: newBase, valor_final: newFinal, valor_atual: newFinal }
                    : {}),
                })
              }}
              disabled={!formData.versao}
            >
              <option value="">-- Selecione --</option>
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
                  const extra = tiposProposta.find((t) => t.id === formData.tipo_proposta)
                  if (extra) filtered.push(extra)
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
          <div className="flex flex-col w-full">
            <label className={labelClass}>Vincular ao Projeto</label>
            <SearchableCombobox
              items={projetos}
              value={formData.projeto || ''}
              onChange={(id) => setFormData({ ...formData, projeto: id })}
              getLabel={(p) => p.nome}
              getSearchText={(p) => p.nome}
              placeholder="Selecionar projeto..."
              emptyMessage="Nenhum projeto encontrado."
              className={inputClass}
            />
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="flex flex-col w-full">
            <label className={labelClass}>Estoque</label>
            <select
              className={cn(inputClass, 'cursor-pointer')}
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
              className={cn(inputClass, 'cursor-pointer')}
              value={mapCurrencyCode(formData.moeda)}
              onChange={(e) => {
                const newMoeda = e.target.value
                const oldMoeda = formData.moeda || 'USD'
                const currentBase = formData.valor_sem_desconto || 0
                const convertedBase =
                  Math.round(convertCurrency(currentBase, oldMoeda, newMoeda) * 100) / 100
                const desc = formData.percentual_desconto || 0
                const convertedFinal = Math.round(convertedBase * (1 - desc / 100) * 100) / 100
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
              className={cn(inputClass, 'bg-muted cursor-not-allowed')}
              value={formData.valor_sem_desconto}
              currency={formData.moeda || 'US$'}
              onChange={() => {}}
              readOnly
              onClick={() =>
                toast({ title: 'Campo calculado automaticamente', variant: 'default' })
              }
            />
          </div>
          <div className="flex flex-col w-full">
            <label className={labelClass}>Desconto (%)</label>
            <input
              type="number"
              className={cn(
                inputClass,
                isOverDiscount && 'border-rose-500 text-rose-600 bg-rose-50 focus:border-rose-500',
              )}
              value={formData.percentual_desconto === undefined ? '' : formData.percentual_desconto}
              onChange={(e) => {
                let val = e.target.value === '' ? undefined : parseFloat(e.target.value)
                if (val !== undefined && isNaN(val)) return
                if (val !== undefined && val > 28)
                  toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
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
            {isOverDiscount && (
              <span className="text-[10px] text-rose-600 mt-1">
                O desconto máximo permitido é 28%
              </span>
            )}
          </div>
          <div className="flex flex-col w-full">
            <label className={labelClass}>Valor Final</label>
            <CurrencyInput
              className={cn(inputClass, 'bg-muted cursor-not-allowed')}
              value={formData.valor_final}
              currency={formData.moeda || 'US$'}
              onChange={() => {}}
              readOnly
              onClick={() =>
                toast({ title: 'Campo calculated automaticamente', variant: 'default' })
              }
            />
            {formData.valor_final && exchangeRates && mapCurrencyCode(formData.moeda) === 'USD' && (
              <div className="text-[10px] text-slate-500 mt-1">
                Aprox. {formatCurrency(formData.valor_final * exchangeRates.USD, 'BRL')}
              </div>
            )}
            {formData.valor_final &&
              !exchangeRates &&
              !exchangeRatesLoading &&
              mapCurrencyCode(formData.moeda) === 'USD' && (
                <div className="text-[10px] text-slate-400 mt-1">Aprox. Indisponível</div>
              )}
            {formData.valor_final && exchangeRates && mapCurrencyCode(formData.moeda) === 'EUR' && (
              <div className="text-[10px] text-slate-500 mt-1">
                Aprox. {formatCurrency(formData.valor_final * exchangeRates.EUR, 'BRL')}
              </div>
            )}
            {formData.valor_final &&
              !exchangeRates &&
              !exchangeRatesLoading &&
              mapCurrencyCode(formData.moeda) === 'EUR' && (
                <div className="text-[10px] text-slate-400 mt-1">Aprox. Indisponível</div>
              )}
            {formData.valor_final && exchangeRates && mapCurrencyCode(formData.moeda) === 'BRL' && (
              <div className="text-[10px] text-slate-500 mt-1">
                Aprox. {formatCurrency(formData.valor_final / exchangeRates.USD, 'USD')}
              </div>
            )}
            {formData.valor_final &&
              !exchangeRates &&
              !exchangeRatesLoading &&
              mapCurrencyCode(formData.moeda) === 'BRL' && (
                <div className="text-[10px] text-slate-400 mt-1">Aprox. Indisponível</div>
              )}
          </div>
        </div>

        <div className="text-sm font-medium text-foreground mb-8 w-full border-b border-border pb-4 flex items-center gap-4">
          {exchangeRatesLoading ? (
            <span>Carregando cotações...</span>
          ) : exchangeRates ? (
            <>
              <span className="flex items-center gap-1">
                Dólar (USD): {formatCurrency(exchangeRates.USD, 'BRL')}
                <span className={exchangeRates.usdPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({exchangeRates.usdPct > 0 ? '+' : ''}
                  {exchangeRates.usdPct}%)
                </span>
              </span>
              <span className="flex items-center gap-1">
                Euro (EUR): {formatCurrency(exchangeRates.EUR, 'BRL')}
                <span className={exchangeRates.eurPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  ({exchangeRates.eurPct > 0 ? '+' : ''}
                  {exchangeRates.eurPct}%)
                </span>
              </span>
              <span>R$: 1,00</span>
            </>
          ) : (
            <span className="flex flex-col gap-1 text-amber-600">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Taxa de câmbio temporariamente indisponível
              </span>
              <span className="flex items-center gap-4 text-slate-500">
                <span>Dólar (USD): Indisponível</span>
                <span>Euro (EUR): Indisponível</span>
                <span>R$: 1,00</span>
              </span>
            </span>
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
              onChange={(e) => setFormData({ ...formData, condicoes_pagamento: e.target.value })}
            />
          </div>
        </div>

        <div className="border-b border-border w-full mb-4 pb-2">
          <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
            <List className="w-5 h-5 text-primary" /> Acessórios
          </h3>
        </div>
        <div className="w-full mb-8 border border-input rounded-lg overflow-x-auto">
          {!formData.versao ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              Selecione uma versão para visualizar os acessórios disponíveis.
            </div>
          ) : (
            <table className="w-full text-left text-[11px] bg-white border-collapse">
              <thead className="bg-slate-50 border-b border-input">
                <tr>
                  <th className="py-2.5 px-4 font-normal text-slate-600">Acessório</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600">Tipo</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600">Moeda</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600">Valor</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600 text-center">Incluir</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600 text-center">Não exibir</th>
                  <th className="py-2.5 px-4 font-normal text-slate-600 text-center">Exibir</th>
                </tr>
              </thead>
              <tbody>
                {acessoriosProposta.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Nenhum acessório encontrado.
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
                          className="w-4 h-4 accent-primary cursor-pointer border border-input bg-background text-slate-700 transition-colors focus:border-primary focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="radio"
                          name={`acc_${idx}`}
                          checked={acc.estado === 'nao_exibir'}
                          onChange={() => updateAccEstado(idx, 'nao_exibir')}
                          className="w-4 h-4 accent-primary cursor-pointer border border-input bg-background text-slate-700 transition-colors focus:border-primary focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="radio"
                          name={`acc_${idx}`}
                          checked={acc.estado === 'exibir'}
                          onChange={() => updateAccEstado(idx, 'exibir')}
                          className="w-4 h-4 accent-primary cursor-pointer border border-input bg-background text-slate-700 transition-colors focus:border-primary focus:ring-1 focus:ring-ring"
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
            const sections = [
              { label: 'Acessórios Standards', content: versao.acessorios_standards },
              {
                label: 'Características Construtivas Principais',
                content: versao.caracteristicas_construtivas,
              },
              {
                label: 'Especificações Técnicas Principais',
                content: versao.especificacoes_tecnicas,
              },
            ].filter((s) => s.content?.trim())
            if (sections.length === 0) return null
            return (
              <div className="w-full mb-8">
                <div className="border-b border-border w-full mb-4 pb-2">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> Detalhes Técnicos da Versão
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {sections.map((s, i) => (
                    <div key={i} className="border border-slate-200 rounded-sm p-4 bg-slate-50/50">
                      <p className="text-[11px] font-bold text-slate-700 mb-2 uppercase">
                        {s.label}
                      </p>
                      <div
                        className="text-xs text-slate-600 leading-relaxed rich-text-content overflow-visible max-h-none h-auto"
                        dangerouslySetInnerHTML={{ __html: s.content || '' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

        {user && (!selectedProposta || user.id === selectedProposta.user) && (
          <div className="w-full mt-8">
            <div className="border-b border-border w-full mb-4 pb-2">
              <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" /> Assinatura do Responsável Interno —{' '}
                {issuerSectorLabel}
                {!selectedProposta && (
                  <span className="text-[10px] text-amber-600 font-normal ml-1">
                    (Obrigatória para nova proposta)
                  </span>
                )}
              </h3>
            </div>
            {selectedProposta?.assinatura_representante ? (
              <div className="flex items-center gap-4 p-4 border border-input rounded-sm bg-slate-50/50">
                <img
                  src={pb.files.getURL(
                    selectedProposta as any,
                    selectedProposta.assinatura_representante as string,
                  )}
                  alt="Assinatura"
                  className="max-h-20 max-w-[200px] object-contain bg-white p-2 border border-input rounded"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs text-slate-600">Assinatura registrada.</span>
                </div>
              </div>
            ) : !selectedProposta ? (
              signatureConfirmed && propostaSignatureBlob ? (
                <div className="flex items-center gap-4 p-4 border border-input rounded-sm bg-slate-50/50">
                  <img
                    src={URL.createObjectURL(propostaSignatureBlob)}
                    alt="Assinatura confirmada"
                    className="max-h-20 max-w-[200px] object-contain bg-white p-2 border border-input rounded"
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
                    <PenTool className="h-4 w-4" /> Refazer
                  </Button>
                </div>
              ) : useProfileSignature && user?.assinatura ? (
                <div className="flex items-center gap-4 p-4 border border-input rounded-sm bg-slate-50/50">
                  <img
                    src={pb.files.getURL(user as any, user.assinatura as string)}
                    alt="Assinatura do perfil"
                    className="max-h-20 max-w-[200px] object-contain bg-white p-2 border border-input rounded"
                  />
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                    <span className="text-xs text-slate-600">Assinatura carregada do perfil</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseProfileSignature(false)}
                    className="gap-2 text-xs ml-auto"
                  >
                    <PenTool className="h-4 w-4" /> Limpar
                  </Button>
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-input rounded-sm">
                  <p className="text-xs text-amber-600 text-center mb-3">
                    A assinatura do representante é obrigatória.
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
              <div className="flex items-center gap-4 p-4 border border-input rounded-sm bg-slate-50/50">
                <img
                  src={pb.files.getURL(user as any, user.assinatura as string)}
                  alt="Assinatura"
                  className="max-h-20 max-w-[200px] object-contain bg-white p-2 border border-input rounded"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs text-slate-600">
                    Usando assinatura padrão do usuário.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-input rounded-sm">
                <p className="text-xs text-slate-500 text-center">
                  Esta proposta não possui assinatura registrada.
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedProposta && (
          <div className="w-full mt-6 mb-2 flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg bg-slate-50/50">
            <label className="text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-primary" /> Verificação de Segurança (reCAPTCHA)
              *
            </label>
            <ReCaptcha
              siteKey={
                import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6Lesv2ktAAAAABPaB6AooD1iPf09yZv90uaMbCz'
              }
              onVerify={(token) => setRecaptchaToken(token)}
              onExpire={() => setRecaptchaToken(null)}
              onError={() => setRecaptchaToken(null)}
            />
            {!recaptchaToken && (
              <p className="text-[11px] text-amber-600 mt-2">
                A verificação reCAPTCHA é obrigatória para emitir uma nova proposta.
              </p>
            )}
          </div>
        )}

        <div className="w-full mt-4 border-t border-slate-200 pt-6">{renderActionBar()}</div>
      </div>

      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-100">
          <DialogHeader className="p-4 pb-2 shrink-0 bg-white border-b border-slate-200 flex flex-row items-center justify-between">
            <DialogTitle className="text-lg font-normal text-primary">
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
                          : useProfileSignature && user?.assinatura
                            ? pb.files.getURL(user as any, user.assinatura as string)
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
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
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
              ação moverá a proposta para "Propostas Excluídas".
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
