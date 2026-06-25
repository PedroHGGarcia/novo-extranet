import { UserCircle, Upload } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'

export default function Perfil() {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [nome, setNome] = useState(user?.name || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (user?.assinatura && user?.id) {
      setPreviewUrl(
        `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${user.id}/${user.assinatura}`,
      )
    }
    if (user?.name) {
      setNome(user.name)
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 1048576) {
        toast({ title: 'A imagem deve ter no máximo 1MB', variant: 'destructive' })
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    if (!user) return
    setIsUpdating(true)
    try {
      const formData = new FormData()
      formData.append('name', nome)
      if (selectedFile) {
        formData.append('assinatura', selectedFile)
      }

      await pb.collection('users').update(user.id, formData)
      toast({ title: 'Perfil atualizado com sucesso!' })
      await pb.collection('users').authRefresh()
    } catch (e) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' })
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
          <div className="grid gap-2 pt-2 border-t mt-2">
            <Label>Assinatura Digital</Label>
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center mt-2">
              <div className="w-full sm:w-64 h-32 border-2 border-dashed border-slate-200 rounded-md flex items-center justify-center bg-slate-50 relative overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Assinatura Preview"
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-slate-400 text-sm p-4">
                    Nenhuma assinatura cadastrada
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Selecionar Imagem
                </Button>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  A imagem deve ser PNG ou JPG com fundo transparente ou branco. Tamanho máximo:
                  1MB.
                </p>
              </div>
            </div>
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
    </div>
  )
}
