import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createUsuario, updateUsuario, type Usuario } from '@/services/usuarios'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

interface UserEditSheetProps {
  user: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function UserEditSheet({ user, open, onOpenChange, onSaved }: UserEditSheetProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email,
          confirmEmail: user.email,
          password: '',
        })
      } else {
        setFormData({ name: '', email: '', confirmEmail: '', password: '' })
      }
      setErrors({})
    }
  }, [user, open])

  const handleSave = async () => {
    setSaving(true)
    setErrors({})
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const newErrors: Record<string, string> = {}
    const safeName = (formData.name ?? '').trim()
    const safeEmail = (formData.email ?? '').trim()
    const safePassword = formData.password ?? ''

    if (!safeName) newErrors.name = 'Nome é obrigatório'

    if (user) {
      if (safeEmail && safeEmail !== user.email) {
        if (!emailRegex.test(safeEmail)) newErrors.email = 'Formato de e-mail inválido'
        if (safeEmail !== (formData.confirmEmail ?? '').trim())
          newErrors.confirmEmail = 'Os e-mails não coincidem'
      }
      if (safePassword && safePassword.length < 8)
        newErrors.password = 'A senha deve ter no mínimo 8 caracteres'
    } else {
      if (!safeEmail) newErrors.email = 'E-mail é obrigatório'
      else if (!emailRegex.test(safeEmail)) newErrors.email = 'Formato de e-mail inválido'
      if (safeEmail !== (formData.confirmEmail ?? '').trim())
        newErrors.confirmEmail = 'Os e-mails não coincidem'
      if (!safePassword) newErrors.password = 'Senha é obrigatória'
      else if (safePassword.length < 8)
        newErrors.password = 'A senha deve ter no mínimo 8 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaving(false)
      return
    }

    try {
      if (user) {
        const payload: Record<string, any> = { name: safeName }
        if (safeEmail && safeEmail !== user.email) payload.email = safeEmail
        if (safePassword) {
          payload.password = safePassword
          payload.passwordConfirm = safePassword
        }
        await updateUsuario(user.id, payload)
        toast({ title: 'Usuário atualizado com sucesso!' })
      } else {
        await createUsuario({
          name: safeName,
          email: safeEmail,
          password: safePassword,
          passwordConfirm: safePassword,
          role: 'user',
        })
        toast({
          title: 'Usuário criado! Use "Gerenciar Acessos" para configurar permissões.',
        })
      }
      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      const fieldErrors = extractFieldErrors(e)
      if (Object.keys(fieldErrors).length > 0) setErrors(fieldErrors)
      else
        toast({
          title: 'Erro ao salvar usuário',
          description: getErrorMessage(e),
          variant: 'destructive',
        })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{user ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
          <SheetDescription className="sr-only">
            Preencha os dados abaixo para {user ? 'editar o' : 'criar um novo'} usuário.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                if (errors.email) setErrors({ ...errors, email: '' })
              }}
              className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmEmail">Confirmar E-mail</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={formData.confirmEmail}
              onChange={(e) => {
                setFormData({ ...formData, confirmEmail: e.target.value })
                if (errors.confirmEmail) setErrors({ ...errors, confirmEmail: '' })
              }}
              className={errors.confirmEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.confirmEmail && (
              <span className="text-xs text-red-500">{errors.confirmEmail}</span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">
              Senha {user && <span className="text-muted-foreground font-normal">(opcional)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-success hover:bg-brand-success/90"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
