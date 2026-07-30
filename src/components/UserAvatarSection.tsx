import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { UserCircle, Upload, CheckCircle } from 'lucide-react'

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ACCEPTED_FORMATS = ['image/png', 'image/jpeg', 'image/gif']

export function UserAvatarSection() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = user?.avatar
    ? `${pb.files.getURL(user as any, user.avatar as string)}?t=${user.updated || Date.now()}`
    : null

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (!ACCEPTED_FORMATS.includes(file.type)) {
      const msg = 'Formato inválido. Formatos aceitos: PNG, JPG, GIF.'
      setError(msg)
      toast({ title: 'Formato inválido', description: msg, variant: 'destructive' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      const msg = 'Arquivo muito grande. Tamanho máximo: 2MB.'
      setError(msg)
      toast({ title: 'Arquivo muito grande', description: msg, variant: 'destructive' })
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const updatedRecord = await pb.collection('users').update(user.id, formData)
      updateUser(updatedRecord)
      toast({ title: 'Avatar atualizado com sucesso!' })
    } catch (err) {
      const msg = getErrorMessage(err)
      setError(msg)
      toast({
        title: 'Erro ao atualizar avatar',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm max-w-2xl">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-normal text-gray-700">
          <UserCircle className="h-5 w-5" /> Foto de Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-24 w-24 rounded-full object-cover border-2 border-slate-200"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-1">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 shrink-0">
              <UserCircle className="h-12 w-12 text-slate-400" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-500">
              Formatos aceitos: PNG, JPG, GIF. Tamanho máximo: 2MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              onChange={handleUpload}
              className="hidden"
              id="avatar-upload"
            />
            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => fileInputRef.current?.click()}
              className="w-fit"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSaving ? 'Enviando...' : 'Selecionar Imagem'}
            </Button>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
