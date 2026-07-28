import { UserCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { UserSignatureSection } from '@/components/UserSignatureSection'
import { ChangePasswordSection } from '@/components/ChangePasswordSection'

export default function Perfil() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [nome, setNome] = useState(user?.name || '')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (user?.name) {
      setNome(user.name)
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setIsUpdating(true)
    try {
      await pb.collection('users').update(user.id, { name: nome })
      toast({ title: 'Usuário atualizado com sucesso' })
      await refreshUser()
    } catch (e) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <UserCircle className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Perfil</h1>
      </div>

      <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm max-w-2xl">
        <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-normal text-gray-700">Meus Dados</CardTitle>
          <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'} className="uppercase">
            {user?.role === 'admin' ? 'Administrador' : 'Usuário Padrão'}
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || ''}
              readOnly
              className="bg-gray-50"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-brand-success hover:bg-brand-success/90 font-medium px-8 text-xs h-9 rounded-sm"
          >
            {isUpdating ? 'SALVANDO...' : 'ATUALIZAR PERFIL'}
          </Button>
        </CardFooter>
      </Card>

      <UserSignatureSection />

      <ChangePasswordSection />
    </div>
  )
}
