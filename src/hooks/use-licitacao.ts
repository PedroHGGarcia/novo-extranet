import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import type { PriceItem } from '@/hooks/use-memoria-calculo'

export function useLicitacao() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [gerentes, setGerentes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [versoes, setVersoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null)
  const [signatureConfirmed, setSignatureConfirmed] = useState(false)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<Record<string, any>>({
    moeda: 'USD',
    status: 'Em Análise',
    modelo_licitacao: true,
    valor_sem_desconto: 0,
    valor_atual: 0,
    valor_final: 0,
    percentual_desconto: 0,
    nota_rep: 1,
    revisao: 'A',
    dt_cad: format(new Date(), 'yyyy-MM-dd'),
  })
  const [customSections, setCustomSections] = useState<
    Array<{ titulo: string; descricao: string; imagem?: string }>
  >([])
  const [priceItems, setPriceItems] = useState<PriceItem[]>([])
  const [memoriaObservacoes, setMemoriaObservacoes] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([
      pb
        .collection('gerentes')
        .getFullList({ sort: 'nome', expand: 'usuario' })
        .catch(() => []),
      pb
        .collection('clientes')
        .getFullList({ sort: 'fantasia' })
        .catch(() => []),
      pb
        .collection('representantes')
        .getFullList({ sort: 'fantasia' })
        .catch(() => []),
      pb
        .collection('versoes')
        .getFullList({ sort: 'nome', expand: 'modelo.marca,modelo.produto.categoria' })
        .catch(() => []),
    ]).then(([ger, cli, rep, ver]) => {
      setGerentes(ger)
      setClientes(cli)
      setRepresentantes(rep)
      setVersoes(ver)
      setLoading(false)
    })
  }, [])

  const hasAccess =
    user?.role === 'admin' ||
    user?.can_issue_bidding_proposals === true ||
    gerentes.some((g) => g.usuario === user?.id)

  const issuerSectorLabel = useMemo(() => {
    if (!user) return 'Representante'
    const g = gerentes.find((x) => x.usuario === user.id)
    if (g?.cargo) return g.cargo
    return user.role === 'admin' ? 'Setor Comercial' : 'Representante'
  }, [user, gerentes])

  const searchClientes = useCallback(async (q: string) => {
    const r = await pb.collection('clientes').getList(1, 20, {
      filter: `documento ~ "${q}" || razao_social ~ "${q}" || fantasia ~ "${q}"`,
      sort: 'fantasia',
    })
    return r.items
  }, [])

  const searchRepresentantes = useCallback(async (q: string) => {
    const r = await pb.collection('representantes').getList(1, 20, {
      filter: `documento ~ "${q}" || fantasia ~ "${q}"`,
      sort: 'fantasia',
    })
    return r.items
  }, [])

  const handleVersaoChange = (versaoId: string) => {
    const v = versoes.find((x) => x.id === versaoId)
    if (!v) return
    const base = v.valor || 0
    const desc = formData.percentual_desconto || 0
    const final = Math.round(base * (1 - desc / 100) * 100) / 100
    const moeda =
      v.moeda === 'Dolar' || v.moeda === 'US$'
        ? 'USD'
        : v.moeda === 'Real'
          ? 'BRL'
          : v.moeda === 'Euro'
            ? 'EUR'
            : v.moeda || 'USD'
    setFormData((prev) => ({
      ...prev,
      versao: versaoId,
      valor_sem_desconto: base,
      valor_atual: final,
      valor_final: final,
      moeda,
    }))
  }

  const handleClienteChange = (id: string) => {
    const c = clientes.find((x) => x.id === id)
    setFormData((prev) => ({
      ...prev,
      cliente: id,
      contato: c?.contato || '',
      telefone: c?.telefone || c?.celular || '',
    }))
  }

  const handleDiscountChange = (val: number) => {
    if (val > 28) toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
    const base = formData.valor_sem_desconto || 0
    const final = Math.round(base * (1 - (val || 0) / 100) * 100) / 100
    setFormData((prev) => ({
      ...prev,
      percentual_desconto: val,
      valor_final: final,
      valor_atual: final,
    }))
  }

  const handleSubmit = async () => {
    const errs: Record<string, string> = {}
    if (!formData.cliente) errs.cliente = 'Cliente é obrigatório'
    if (!formData.versao) errs.versao = 'Versão é obrigatória'
    if (!formData.representante) errs.representante = 'Representante é obrigatório'
    for (const [i, s] of customSections.entries()) {
      if (!s.titulo.trim()) errs[`secao_${i}_titulo`] = 'Título é obrigatório'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' })
      return
    }
    if ((formData.percentual_desconto || 0) > 28) {
      toast({ title: 'O desconto máximo permitido é 28%', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      const fields = {
        ...formData,
        user: user?.id,
        modelo_licitacao: true,
        numero_proposta: formData.numero_proposta || 'NOVA-0',
        secoes_adicionais: JSON.stringify({
          custom_sections: customSections,
          itens_precos: priceItems,
          memoria_observacoes: memoriaObservacoes,
        }),
      }
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null) {
          fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v))
        }
      }
      fd.append('acessorios_proposta', JSON.stringify([]))
      if (signatureBlob) {
        fd.append('assinatura_representante', signatureBlob, 'assinatura-representante.png')
      }
      const created = await pb.collection('propostas').create(fd)
      setCreatedId(created.id)
      toast({ title: 'Proposta de licitação criada com sucesso!' })
    } catch (e) {
      toast({
        title: 'Erro ao criar proposta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const uploadSectionImage = async (index: number, file: File) => {
    try {
      const fd = new FormData()
      fd.append('arquivo', file)
      const record = await pb.collection('imagens_editor').create(fd)
      const imageUrl = pb.files.getURL(record, record.arquivo)
      const updated = [...customSections]
      updated[index] = { ...updated[index], imagem: imageUrl }
      setCustomSections(updated)
    } catch (e) {
      toast({
        title: 'Erro ao enviar imagem',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const removeSectionImage = (index: number) => {
    const updated = [...customSections]
    updated[index] = { ...updated[index], imagem: undefined }
    setCustomSections(updated)
  }

  const addPriceItem = () => {
    const nextNum = String(priceItems.length + 1).padStart(2, '0')
    setPriceItems([
      ...priceItems,
      {
        _01_unidade: nextNum,
        descricao_item: '',
        quantidade: 1,
        unidade_medida: 'un',
        preco_custo_unitario: 0,
        desconto_percentual: 0,
        comissao_percentual: 0,
        markup_percentual: 0,
        encargos_percentual: 0,
        preco_venda_total_secao7: 0,
      },
    ])
  }

  const updatePriceItem = (index: number, field: keyof PriceItem, value: any) => {
    const updated = [...priceItems]
    updated[index] = { ...updated[index], [field]: value }
    setPriceItems(updated)
  }

  const removePriceItem = (index: number) => {
    setPriceItems(priceItems.filter((_, i) => i !== index))
  }

  const updateMemoriaObservacao = (unidade: string, obs: string) => {
    setMemoriaObservacoes({ ...memoriaObservacoes, [unidade]: obs })
  }

  const resetForm = () => {
    setCreatedId(null)
    setSignatureBlob(null)
    setSignatureConfirmed(false)
    setErrors({})
    setCustomSections([])
    setPriceItems([])
    setMemoriaObservacoes({})
    setFormData({
      moeda: 'USD',
      status: 'Em Análise',
      modelo_licitacao: true,
      valor_sem_desconto: 0,
      valor_atual: 0,
      valor_final: 0,
      percentual_desconto: 0,
      nota_rep: 1,
      revisao: 'A',
      dt_cad: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  return {
    user,
    loading,
    hasAccess,
    submitting,
    createdId,
    formData,
    setFormData,
    errors,
    clientes,
    representantes,
    versoes,
    gerentes,
    signatureConfirmed,
    signatureBlob,
    setSignatureBlob,
    setSignatureConfirmed,
    issuerSectorLabel,
    handleVersaoChange,
    handleClienteChange,
    handleDiscountChange,
    handleSubmit,
    resetForm,
    searchClientes,
    searchRepresentantes,
    customSections,
    setCustomSections,
    uploadSectionImage,
    removeSectionImage,
    priceItems,
    addPriceItem,
    updatePriceItem,
    removePriceItem,
    memoriaObservacoes,
    updateMemoriaObservacao,
  }
}
