import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProjeto, createProjeto, updateProjeto } from '@/services/projetos'
import { searchClientesPaginated } from '@/services/cadastros'
import { extractFieldErrors, type FieldErrors } from '@/lib/pocketbase/errors'
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
import { SearchableCombobox } from '@/components/SearchableCombobox'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'

export default function ProjetosForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = !!id

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cliente: '',
    status: 'Em Andamento',
    ooo: '',
  })
  const [clientes, setClientes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    getProjeto(id)
      .then((proj) => {
        setFormData({
          nome: proj.nome || '',
          descricao: proj.descricao || '',
          cliente: proj.cliente || '',
          status: proj.status || 'Em Andamento',
          ooo: proj.ooo || '',
        })
        if (proj.cliente) {
          pb.collection('clientes')
            .getOne(proj.cliente)
            .then((c) => setClientes([c]))
            .catch(() => {})
        }
      })
      .catch(() => {
        toast({ title: 'Projeto não encontrado', variant: 'destructive' })
        navigate('/projetos')
      })
      .finally(() => setIsLoading(false))
  }, [id])

  const handleSubmit = async () => {
    setFieldErrors({})
    const errors: FieldErrors = {}
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório'
    if (!formData.cliente) errors.cliente = 'Cliente é obrigatório'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao,
        cliente: formData.cliente,
        status: formData.status,
        ooo: formData.ooo,
      }
      if (isEditing && id) {
        await updateProjeto(id, payload)
        toast({ title: 'Projeto atualizado com sucesso!' })
      } else {
        await createProjeto(payload)
        toast({ title: 'Projeto criado com sucesso!' })
      }
      navigate('/projetos')
    } catch (err: any) {
      const extracted = extractFieldErrors(err)
      if (Object.keys(extracted).length > 0) {
        setFieldErrors(extracted)
      }
      toast({
        title: 'Erro ao salvar projeto',
        description: err?.message || 'Verifique os campos e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => navigate('/projetos')}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Salvar
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{isEditing ? 'Editar Projeto' : 'Novo Projeto'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-2 md:col-span-2">
            <Label className={fieldErrors.nome ? 'text-destructive' : ''}>Nome *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={fieldErrors.nome ? 'border-destructive' : ''}
            />
            {fieldErrors.nome && <p className="text-xs text-destructive">{fieldErrors.nome}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label className={fieldErrors.cliente ? 'text-destructive' : ''}>Cliente *</Label>
            <SearchableCombobox
              items={clientes}
              value={formData.cliente}
              onChange={(cid) => setFormData({ ...formData, cliente: cid })}
              getLabel={(c) => c.fantasia || c.razao_social}
              getSearchText={(c) => `${c.fantasia || ''} ${c.razao_social || ''}`}
              placeholder="Buscar cliente..."
              onPaginatedSearch={searchClientesPaginated}
              className={fieldErrors.cliente ? 'border-destructive ring-destructive' : ''}
            />
            {fieldErrors.cliente && (
              <p className="text-xs text-destructive">{fieldErrors.cliente}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                <SelectItem value="Concluído">Concluído</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.ooo}
              onChange={(e) => setFormData({ ...formData, ooo: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
