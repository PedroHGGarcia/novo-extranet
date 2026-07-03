import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { getErrorMessage } from '@/lib/pocketbase/errors'

interface PriceItem {
  id: string
  descricao: string
  quantidade: number
  valorUnitario: number
  moeda: string
}

interface CustomSection {
  titulo: string
  descricao: string
  imagem?: string
}

const defaultForm: Record<string, any> = {
  cliente: '',
  representante: '',
  versao: '',
  gerente: '',
  dt_cad: format(new Date(), 'yyyy-MM-dd'),
  moeda: 'USD',
  valor_sem_desconto: 0,
  percentual_desconto: 0,
  valor_final: 0,
  valor_atual: 0,
  prazo_entrega: '',
  condicoes_pagamento: '',
  descricao_proposta: '',
  especificacoes_tecnicas: '',
  materiais_utilizados: '',
  certificacoes: '',
  normas_aplicaveis: '',
  certificacoes_seguranca: '',
  normas_seguranca: '',
  cobertura_garantia: '',
  assistencia_tecnica_detalhada: '',
  criterios_aceitacao: '',
  garantia_acessorios: '',
  validade_oferta: '',
  treinamento_tecnico: '',
  transporte_seguro: '',
  imposto_ipi: '',
  imposto_icms: '',
}

export function useLicitacao() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>(defaultForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [clientes, setClientes] = useState<any[]>([])
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [versoes, setVersoes] = useState<any[]>([])
  const [gerentes, setGerentes] = useState<any[]>([])
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [memoriaObservacoes, setMemoriaObservacoes] = useState('')
  const [customSections, setCustomSections] = useState<CustomSection[]>([])
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)

  useEffect(() => {
    pb.collection('gerentes')
      .getFullList({ sort: 'nome', expand: 'usuario' })
      .then(setGerentes)
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
    if (!user) return
    const isGerente = gerentes.some((g) => g.usuario === user.id)
    setHasAccess(user.role === 'admin' || !!user.can_issue_bidding_proposals || isGerente)
    setLoading(false)
  }, [user, gerentes])

  const issuerSectorLabel = useMemo(() => {
    if (!user) return 'Comercial'
    if (user.setor) return user.setor
    const ug = gerentes.find((g) => g.usuario === user.id)
    return ug?.cargo || 'Comercial'
  }, [user, gerentes])

  const searchClientes = useCallback(async (query: string) => {
    const res = await pb.collection('clientes').getList(1, 20, {
      filter: `documento ~ "${query}" || razao_social ~ "${query}" || fantasia ~ "${query}"`,
      sort: 'fantasia',
    })
    setClientes((prev) => {
      const ids = new Set(prev.map((c) => c.id))
      const fresh = res.items.filter((c) => !ids.has(c.id))
      return fresh.length ? [...prev, ...fresh] : prev
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

  const handleClienteChange = useCallback(
    (clienteId: string) => {
      if (!clienteId) {
        setFormData((p) => ({ ...p, cliente: '' }))
        return
      }
      setFormData((p) => ({ ...p, cliente: clienteId }))
      const existing = clientes.find((c) => c.id === clienteId)
      if (!existing) {
        pb.collection('clientes')
          .getOne(clienteId)
          .then((c) => {
            setClientes((prev) => (prev.some((p) => p.id === c.id) ? prev : [...prev, c]))
          })
          .catch(() => {})
      }
    },
    [clientes],
  )

  const handleVersaoChange = useCallback(
    (versaoId: string) => {
      const versao = versoes.find((v) => v.id === versaoId)
      if (!versao) {
        setFormData((p) => ({ ...p, versao: '' }))
        return
      }
      const base = versao.valor || 0
      const desc = formData.percentual_desconto || 0
      const final = Math.round(base * (1 - desc / 100) * 100) / 100
      const moeda = versao.moeda === 'Real' ? 'BRL' : versao.moeda === 'Euro' ? 'EUR' : 'USD'
      setFormData((p) => ({
        ...p,
        versao: versaoId,
        valor_sem_desconto: base,
        valor_final: final,
        valor_atual: final,
        moeda,
      }))
    },
    [versoes, formData.percentual_desconto],
  )

  const handleDiscountChange = useCallback((v: number) => {
    setFormData((p) => {
      const base = p.valor_sem_desconto || 0
      const final = Math.round(base * (1 - v / 100) * 100) / 100
      return { ...p, percentual_desconto: v, valor_final: final, valor_atual: final }
    })
  }, [])

  const addPriceItem = useCallback(() => {
    setPriceItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), descricao: '', quantidade: 1, valorUnitario: 0, moeda: 'BRL' },
    ])
  }, [])
  const updatePriceItem = useCallback((id: string, patch: Partial<PriceItem>) => {
    setPriceItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }, [])
  const removePriceItem = useCallback((id: string) => {
    setPriceItems((prev) => prev.filter((p) => p.id !== id))
  }, [])
  const updateMemoriaObservacao = useCallback((v: string) => setMemoriaObservacoes(v), [])

  const removeSectionImage = useCallback((index: number) => {
    setCustomSections((prev) => prev.map((s, i) => (i === index ? { ...s, imagem: undefined } : s)))
  }, [])

  const uploadSectionImage = useCallback(async (index: number, file: File) => {
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      const record = await pb.collection('imagens_editor').create(fd)
      const url = pb.files.getURL(record, record.arquivo)
      setCustomSections((prev) => prev.map((s, i) => (i === index ? { ...s, imagem: url } : s)))
    } catch {
      /* noop */
    }
  }, [])

  const resetForm = useCallback(() => {
    setFormData(defaultForm)
    setErrors({})
    setPriceItems([])
    setMemoriaObservacoes('')
    setCustomSections([])
    setSignatureBlob(null)
    setSignatureConfirmed(false)
    setCreatedId(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    const errs: Record<string, string> = {}
    if (!formData.cliente) errs.cliente = 'Cliente é obrigatório'
    if (!formData.representante) errs.representante = 'Representante é obrigatório'
    if (!formData.versao) errs.versao = 'Versão é obrigatória'
    if (!signatureConfirmed) errs.assinatura = 'Assinatura é obrigatória'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') fd.append(k, String(v))
      })
      fd.append('user', user?.id || '')
      fd.append('numero_proposta', 'NOVA-0')
      fd.append('modelo_licitacao', 'true')
      fd.append('status', 'Em Análise')
      fd.append('revisao', 'A')
      fd.append('nota_rep', '1')
      if (customSections.length > 0) fd.append('secoes_adicionais', JSON.stringify(customSections))
      if (signatureBlob) fd.append('assinatura_representante', signatureBlob, 'assinatura.png')
      const created = await pb.collection('propostas').create(fd)
      setCreatedId(created.id)
    } catch (e) {
      setErrors({ submit: getErrorMessage(e) })
    } finally {
      setSubmitting(false)
    }
  }, [formData, signatureConfirmed, signatureBlob, customSections, user])

  return {
    loading,
    hasAccess,
    user,
    formData,
    setFormData,
    errors,
    clientes,
    representantes,
    versoes,
    gerentes,
    searchClientes,
    searchRepresentantes,
    handleClienteChange,
    handleVersaoChange,
    handleDiscountChange,
    priceItems,
    addPriceItem,
    updatePriceItem,
    removePriceItem,
    memoriaObservacoes,
    updateMemoriaObservacao,
    customSections,
    setCustomSections,
    removeSectionImage,
    uploadSectionImage,
    signatureBlob,
    setSignatureBlob,
    signatureConfirmed,
    setSignatureConfirmed,
    submitting,
    createdId,
    resetForm,
    handleSubmit,
    issuerSectorLabel,
  }
}
