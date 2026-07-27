import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { updateProjeto, createProjetoWithPropostas, type Projeto } from '@/services/projetos'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SearchableCombobox } from '@/components/SearchableCombobox'
import { SearchableMultiSelect } from '@/components/SearchableMultiSelect'
import { searchClientesPaginated } from '@/services/cadastros'
import { getUnlinkedPropostasPaginated } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'

export function ProjectForm({ projeto, onBack }: { projeto: Projeto | null; onBack: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [clientes, setClientes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cliente: '',
    status: 'Em Andamento',
  })
  const [selectedPropostas, setSelectedPropostas] = useState<string[]>([])
  const [propostasRefreshSignal, setPropostasRefreshSignal] = useState(0)

  useRealtime('propostas', () => {
    setPropostasRefreshSignal((prev) => prev + 1)
  })

  useEffect(() => {
    setSelectedPropostas([])
  }, [formData.cliente])

  const handlePropostaSearch = useCallback(
    (query: string, page: number) => getUnlinkedPropostasPaginated(query, page, formData.cliente),
    [formData.cliente],
  )

  const isDirty = useMemo(() => {
    if (!projeto) return true
    const normNome = formData.nome || ''
    const normDesc = formData.descricao || ''
    const normCliente = formData.cliente || ''
    const normStatus = formData.status || 'Em Andamento'

    const initNome = projeto.nome || ''
    const initDesc = projeto.descricao || ''
    const initCliente = projeto.cliente || ''
    const initStatus = projeto.status || 'Em Andamento'

    return (
      normNome !== initNome ||
      normDesc !== initDesc ||
      normCliente !== initCliente ||
      normStatus !== initStatus
    )
  }, [formData, projeto])

  useEffect(() => {
    if (projeto) {
      setFormData({
        nome: projeto.nome,
        descricao: projeto.descricao || '',
        cliente: projeto.cliente,
        status: projeto.status || 'Em Andamento',
      })
      if (projeto.cliente) {
        pb.collection('clientes')
          .getOne(projeto.cliente)
          .then((c) => setClientes([c]))
          .catch(() => {})
      }
    }
  }, [projeto, user])

  const handleSave = async () => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setFieldErrors({})
    let hasError = false
    const errors: FieldErrors = {}

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório'
      hasError = true
    }
    if (!formData.cliente) {
      errors.cliente = 'Cliente é obrigatório'
      hasError = true
    }

    if (hasError) {
      setFieldErrors(errors)
      isSubmittingRef.current = false
      return
    }

    if (!user?.id) {
      toast({
        title: 'Erro ao salvar',
        description: 'Sessão expirada. Faça login novamente.',
        variant: 'destructive',
        className: 'bg-red-600 text-white border-red-700',
      })
      isSubmittingRef.current = false
      return
    }

    if (projeto && !isDirty) {
      toast({ title: 'Nenhuma alteração detectada', variant: 'default' })
      isSubmittingRef.current = false
      return
    }

    setIsSubmitting(true)

    const payload: any = {
      nome: formData.nome,
      descricao: formData.descricao,
      cliente: formData.cliente,
      status: formData.status,
    }

    try {
      if (projeto) {
        await updateProjeto(projeto.id, payload)
        toast({
          title: 'Projeto salvo com sucesso!',
          className: 'bg-emerald-600 text-white border-emerald-700',
        })
      } else {
        const { linkedCount } = await createProjetoWithPropostas(payload, selectedPropostas)
        toast({
          title: 'Projeto criado com sucesso!',
          description: linkedCount > 0 ? `${linkedCount} proposta(s) vinculada(s).` : undefined,
          className: 'bg-emerald-600 text-white border-emerald-700',
        })
        setSelectedPropostas([])
      }
      onBack()
    } catch (e: any) {
      if (!projeto && e.isLinkError) {
        if (e.rollbackFailed) {
          toast({
            title: 'Projeto criado, mas houve erro ao vincular propostas',
            description:
              'O projeto foi criado, mas algumas propostas não puderam ser vinculadas. Tente vincular manualmente na página do projeto.',
            variant: 'default',
            className: 'bg-amber-600 text-white border-amber-700',
          })
          onBack()
        } else {
          toast({
            title: 'Erro ao salvar projeto',
            description: e.message || 'A criação do projeto foi cancelada.',
            variant: 'destructive',
            className: 'bg-red-600 text-white border-red-700',
          })
        }
      } else {
        const extractedErrors = extractFieldErrors(e)
        setFieldErrors(extractedErrors)
        let errorMsg = e.message || 'Erro inesperado'
        if (Object.keys(extractedErrors).length > 0) {
          errorMsg +=
            ' - ' +
            Object.entries(extractedErrors)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')
        }
        toast({
          title: 'Erro ao salvar projeto',
          description: errorMsg,
          variant: 'destructive',
          className: 'bg-red-600 text-white border-red-700',
        })
      }
    } finally {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{projeto ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2 md:col-span-2">
            <Label className={fieldErrors.nome ? 'text-destructive' : ''}>Nome do Projeto *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={fieldErrors.nome ? 'border-destructive' : ''}
            />
            {fieldErrors.nome && <p className="text-xs text-destructive">{fieldErrors.nome}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className={fieldErrors.descricao ? 'text-destructive' : ''}>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className={fieldErrors.descricao ? 'border-destructive' : ''}
            />
            {fieldErrors.descricao && (
              <p className="text-xs text-destructive">{fieldErrors.descricao}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className={fieldErrors.cliente ? 'text-destructive' : ''}>Cliente *</Label>
            <SearchableCombobox
              items={clientes}
              value={formData.cliente}
              onChange={(id) => setFormData({ ...formData, cliente: id })}
              getLabel={(c) => c.fantasia || c.razao_social}
              getSearchText={(c) => `${c.fantasia || ''} ${c.razao_social || ''}`}
              placeholder="Buscar cliente..."
              onPaginatedSearch={searchClientesPaginated}
              className={
                fieldErrors.cliente
                  ? 'border-destructive ring-destructive'
                  : !formData.cliente
                    ? 'border-amber-300 bg-amber-50/30'
                    : ''
              }
            />
            {fieldErrors.cliente && (
              <p className="text-xs text-destructive">{fieldErrors.cliente}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className={fieldErrors.status ? 'text-destructive' : ''}>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className={fieldErrors.status ? 'border-destructive' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.status && <p className="text-xs text-destructive">{fieldErrors.status}</p>}
          </div>
          {!projeto && (
            <div className="space-y-2 md:col-span-2">
              <Label>Vincular Propostas</Label>
              <SearchableMultiSelect
                value={selectedPropostas}
                onChange={setSelectedPropostas}
                getLabel={(p: any) => p.numero_proposta || 'Sem número'}
                getSubLabel={(p: any) => p.expand?.cliente?.fantasia || 'Sem cliente'}
                placeholder={
                  formData.cliente
                    ? 'Selecionar propostas para vincular...'
                    : 'Selecione um cliente primeiro'
                }
                emptyMessage={
                  formData.cliente
                    ? 'Nenhuma proposta disponível para este cliente.'
                    : 'Selecione um cliente para ver propostas.'
                }
                onPaginatedSearch={handlePropostaSearch}
                refreshSignal={propostasRefreshSignal}
                dependentValue={formData.cliente}
              />
              <p className="text-xs text-muted-foreground">
                Apenas propostas sem projeto vinculado são exibidas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
