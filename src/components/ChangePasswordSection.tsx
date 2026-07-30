import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

export function ChangePasswordSection() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!currentPassword) {
      errs.currentPassword = 'Informe sua senha atual.'
    }
    if (!newPassword) {
      errs.newPassword = 'Informe a nova senha.'
    } else if (newPassword.length < 8) {
      errs.newPassword = 'A senha deve ter no mínimo 8 caracteres.'
    } else if (!/[0-9]/.test(newPassword)) {
      errs.newPassword = 'A senha deve conter pelo menos um número.'
    } else if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      errs.newPassword = 'A senha deve conter pelo menos um caractere especial.'
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirme a nova senha.'
    } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errs.confirmPassword = 'As senhas não coincidem.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!user) return
    if (!validate()) return

    setIsSaving(true)
    setErrors({})

    try {
      await pb.collection('users').authWithPassword(user.email, currentPassword)
      await pb.collection('users').update(user.id, {
        password: newPassword,
        passwordConfirm: newPassword,
      })
      toast({ title: 'Senha alterada com sucesso!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      const msg = getErrorMessage(e).toLowerCase()
      if (msg.includes('failed to authenticate') || msg.includes('invalid login')) {
        setErrors({ currentPassword: 'Senha atual incorreta.' })
      } else {
        toast({
          title: 'Erro ao alterar senha',
          description: getErrorMessage(e),
          variant: 'destructive',
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm max-w-2xl">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-normal text-gray-700">
          <Lock className="h-5 w-5" /> Alterar Senha
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="current-password">Senha Atual</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
          />
          {errors.currentPassword && (
            <p className="text-sm text-red-500">{errors.currentPassword}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-password">Nova Senha</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
          {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end border-t pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-brand-success hover:bg-brand-success/90 font-medium px-8 text-xs h-9 rounded-sm"
        >
          {isSaving ? 'SALVANDO...' : 'SALVAR SENHA'}
        </Button>
      </CardFooter>
    </Card>
  )
}
