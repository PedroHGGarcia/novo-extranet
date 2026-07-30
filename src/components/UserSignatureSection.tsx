import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { SignaturePad } from '@/components/SignaturePad'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/hooks/use-auth'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { PenTool, Upload, CheckCircle } from 'lucide-react'

export function UserSignatureSection() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const assinaturaUrl = user?.assinatura
    ? pb.files.getURL(user as any, user.assinatura as string)
    : null

  const handleSaveDrawn = async (blob: Blob, hash: string) => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('assinatura', blob, 'assinatura.png')
      if (hash) formData.append('assinatura_hash', hash)
      await pb.collection('users').update(user.id, formData)
      await refreshUser()
      toast({ title: 'Assinatura salva com sucesso!' })
    } catch (e) {
      toast({
        title: 'Erro ao salvar assinatura',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('assinatura', file)
      await pb.collection('users').update(user.id, formData)
      await refreshUser()
      toast({ title: 'Assinatura salva com sucesso!' })
    } catch (err) {
      toast({
        title: 'Erro ao salvar assinatura',
        description: getErrorMessage(err),
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
          <PenTool className="h-5 w-5" /> Assinatura Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {assinaturaUrl && (
          <div className="mb-4 p-3 border border-slate-200 rounded-lg bg-slate-50">
            <p className="text-xs font-medium text-slate-500 mb-2">Assinatura Atual</p>
            <div className="flex items-center gap-3">
              <img
                src={assinaturaUrl}
                alt="Assinatura atual"
                className="max-h-20 max-w-[200px] object-contain bg-white p-2 border rounded"
              />
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </div>
        )}
        <Tabs defaultValue="draw">
          <TabsList>
            <TabsTrigger value="draw">Desenhar</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="draw" className="mt-4">
            <SignaturePad onConfirm={handleSaveDrawn} disabled={isSaving} />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-300 rounded-lg">
              <Upload className="h-10 w-10 text-slate-400" />
              <p className="text-sm text-slate-500 text-center">
                Clique para selecionar uma imagem de assinatura (PNG ou JPG)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleUpload}
                className="hidden"
                id="assinatura-upload"
              />
              <Button
                variant="outline"
                disabled={isSaving}
                onClick={() => fileInputRef.current?.click()}
              >
                {isSaving ? 'Salvando...' : 'Selecionar Arquivo'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
