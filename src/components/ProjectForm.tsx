import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createProjeto, updateProjeto, type Projeto } from '@/services/projetos'
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
import { searchClientesPaginated } from '@/services/cadastros'
import pb from '@/lib/pocketbase/client'

export function ProjectForm({ projeto, onBack }: { projeto: Projeto | null; onBack: () => void }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cliente: '',
    status: 'Em Andamento',
    user: user?.id || '',
  })

  useEffect(() => {
    if (projeto) {
      setFormData({
        nome: projeto.nome,
        descricao: projeto.descricao || '',
        cliente: projeto.cliente,
        status: projeto.status || 'Em Andamento',
        user: projeto.user || user?.id || '',
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
    if (!formData.nome) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }
    if (!formData.cliente) {
      toast({ title: 'Cliente é obrigatório', variant: 'destructive' })
      return
    }
    setIsSubmitting(true)
    try {
      if (projeto) {
        await updateProjeto(projeto.id, formData)
        toast({ title: 'Projeto atualizado com sucesso' })
      } else {
        await createProjeto(formData)
        toast({ title: 'Projeto criado com sucesso' })
      }
      onBack()
    } catch (e: any) {
      toast({ title: e.message || 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
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
            <Label>Nome do Projeto *</Label>
            <Input
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
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
            <Label>Cliente *</Label>
            <SearchableCombobox
              items={clientes}
              value={formData.cliente}
              onChange={(id) => setFormData({ ...formData, cliente: id })}
              getLabel={(c) => c.fantasia || c.razao_social}
              getSearchText={(c) => `${c.fantasia || ''} ${c.razao_social || ''}`}
              placeholder="Buscar cliente..."
              onPaginatedSearch={searchClientesPaginated}
              className={!formData.cliente ? 'border-amber-300 bg-amber-50/30' : ''}
            />
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
        </CardContent>
      </Card>
    </div>
  )
}
