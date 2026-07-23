import { useState, useEffect, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelectRelation } from '@/components/MultiSelectRelation'
import { getRepresentante, updateRepresentante, getRegioes } from '@/services/cadastros'
import { getCategorias } from '@/services/produtos'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  )
}

const FIELDS = [
  'fantasia',
  'razao_social',
  'sigla',
  'documento',
  'telefone_principal',
  'telefone',
  'emails',
  'cep',
  'logradouro',
  'numero',
  'bairro',
  'cidade',
  'uf',
  'complementos',
  'rd_station_id',
  'regiao_texto',
  'status',
]

export default function RepresentanteEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categorias, setCategorias] = useState<any[]>([])
  const [regioes, setRegioes] = useState<any[]>([])
  const [coordenadasText, setCoordenadasText] = useState('')

  const set = (k: string, v: any) => setFormData((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    const load = async () => {
      try {
        const [rep, cats, regs] = await Promise.all([
          getRepresentante(id!),
          getCategorias(),
          getRegioes(),
        ])
        const data: Record<string, any> = { status: 'Ativo' }
        FIELDS.forEach((f) => {
          data[f] = (rep as any)[f] ?? ''
        })
        data.categorias_rel = Array.isArray(rep.categorias_rel)
          ? rep.categorias_rel
          : rep.categorias_rel
            ? [rep.categorias_rel]
            : []
        data.regioes_rel = Array.isArray(rep.regioes_rel)
          ? rep.regioes_rel
          : rep.regioes_rel
            ? [rep.regioes_rel]
            : []
        setFormData(data)
        setCoordenadasText(rep.coordenadas ? JSON.stringify(rep.coordenadas, null, 2) : '')
        setCategorias(cats)
        setRegioes(regs)
      } catch {
        toast({ title: 'Erro ao carregar representante', variant: 'destructive' })
        navigate('/cadastros/representantes')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async () => {
    setErrors({})
    if (!formData.fantasia?.trim()) {
      setErrors({ fantasia: 'Fantasia é obrigatória' })
      return
    }
    if (!formData.documento?.trim()) {
      setErrors({ documento: 'Documento é obrigatório' })
      return
    }
    let coords = formData.coordenadas
    if (coordenadasText.trim()) {
      try {
        coords = JSON.parse(coordenadasText)
      } catch {
        setErrors({ coordenadas: 'JSON inválido' })
        return
      }
    } else {
      coords = null
    }
    setIsSubmitting(true)
    try {
      await updateRepresentante(id!, { ...formData, coordenadas: coords })
      toast({ title: 'Perfil atualizado com sucesso' })
      navigate('/cadastros/representantes')
    } catch (err) {
      setErrors(extractFieldErrors(err))
      toast({ title: 'Erro ao atualizar representante', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const txt = (k: string) => ({
    value: formData[k] || '',
    onChange: (e: any) => set(k, e.target.value),
  })

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cadastros/representantes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Editar Representante</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/cadastros/representantes')}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Dados Gerais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Fantasia *" error={errors.fantasia}>
              <Input {...txt('fantasia')} />
            </Field>
            <Field label="Razão Social">
              <Input {...txt('razao_social')} />
            </Field>
            <Field label="Sigla">
              <Input {...txt('sigla')} />
            </Field>
            <Field label="CPF/CNPJ *" error={errors.documento}>
              <Input {...txt('documento')} />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Contato</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Telefone Principal">
              <Input {...txt('telefone_principal')} />
            </Field>
            <Field label="Telefone">
              <Input {...txt('telefone')} />
            </Field>
            <Field label="Emails">
              <Input {...txt('emails')} />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Endereço</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="CEP">
              <Input {...txt('cep')} />
            </Field>
            <Field label="Logradouro" className="md:col-span-2">
              <Input {...txt('logradouro')} />
            </Field>
            <Field label="Número">
              <Input {...txt('numero')} />
            </Field>
            <Field label="Bairro">
              <Input {...txt('bairro')} />
            </Field>
            <Field label="Complementos">
              <Input {...txt('complementos')} />
            </Field>
            <Field label="Cidade">
              <Input {...txt('cidade')} />
            </Field>
            <Field label="UF">
              <Input {...txt('uf')} />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Relações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Categorias">
              <MultiSelectRelation
                options={categorias}
                value={formData.categorias_rel || []}
                onChange={(v) => set('categorias_rel', v)}
                getLabel={(i) => i.nome}
              />
            </Field>
            <Field label="Regiões">
              <MultiSelectRelation
                options={regioes}
                value={formData.regioes_rel || []}
                onChange={(v) => set('regioes_rel', v)}
                getLabel={(i) => i.nome}
              />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Metadados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="RD Station ID">
              <Input {...txt('rd_station_id')} />
            </Field>
            <Field label="Região (texto)">
              <Input {...txt('regiao_texto')} />
            </Field>
            <Field label="Status">
              <Select value={formData.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Coordenadas (JSON)" error={errors.coordenadas}>
              <Textarea
                value={coordenadasText}
                onChange={(e) => setCoordenadasText(e.target.value)}
                className="resize-none font-mono text-xs"
                rows={4}
                placeholder='Ex: [{"lat": -23.5, "lng": -46.6}]'
              />
            </Field>
          </div>
        </div>
      </Card>
    </div>
  )
}
