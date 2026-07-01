import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SignaturePad } from '@/components/SignaturePad'
import { useToast } from '@/components/ui/use-toast'
import pb from '@/lib/pocketbase/client'
import { type Proposta } from '@/services/propostas'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { PenTool, CheckCircle } from 'lucide-react'

interface ClientSignatureSectionProps {
  proposta: Proposta
  onSigned: () => void
}

export function ClientSignatureSection({ proposta, onSigned }: ClientSignatureSectionProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [signed, setSigned] = useState(!!proposta.assinatura_cliente)

  const representanteAssinaturaUrl = proposta.expand?.user?.assinatura
    ? pb.files.getURL(proposta.expand.user as any, proposta.expand.user.assinatura as string)
    : null

  const clienteAssinaturaUrl = proposta.assinatura_cliente
    ? pb.files.getURL(proposta as any, proposta.assinatura_cliente as string)
    : null

  const handleConfirm = async (blob: Blob) => {
    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append('assinatura_cliente', blob, 'assinatura-cliente.png')
      formData.append('status', 'Aprovada')
      await pb.collection('propostas').update(proposta.id, formData)
      setSigned(true)
      toast({
        title: 'Proposta assinada com sucesso!',
        description: 'Status atualizado para Aprovada.',
      })
      onSigned()
    } catch (e) {
      toast({
        title: 'Erro ao assinar proposta',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mt-6 no-print shadow-sm">
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-normal text-gray-700">
          <PenTool className="h-5 w-5" /> Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium mb-2 text-gray-600">Assinatura do Representante</p>
            <div className="border-2 border-slate-200 rounded-lg bg-white h-40 flex items-center justify-center">
              {representanteAssinaturaUrl ? (
                <img
                  src={representanteAssinaturaUrl}
                  alt="Assinatura do Representante"
                  className="max-h-32 max-w-full object-contain"
                />
              ) : (
                <p className="text-sm text-slate-400">Sem assinatura cadastrada</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2 text-gray-600">Assinatura do Cliente</p>
            {signed ? (
              <div className="border-2 border-green-300 rounded-lg bg-green-50 h-40 flex items-center justify-center relative">
                {clienteAssinaturaUrl && (
                  <img
                    src={clienteAssinaturaUrl}
                    alt="Assinatura do Cliente"
                    className="max-h-32 max-w-full object-contain"
                  />
                )}
                <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-600" />
              </div>
            ) : (
              <SignaturePad onConfirm={handleConfirm} disabled={isSaving} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
