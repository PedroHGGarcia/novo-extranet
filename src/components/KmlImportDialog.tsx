import { useState } from 'react'
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { importKml, type KmlImportResult } from '@/services/kml-import'

interface KmlImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function KmlImportDialog({ open, onOpenChange, onSuccess }: KmlImportDialogProps) {
  const { toast } = useToast()
  const [kmlText, setKmlText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KmlImportResult | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setKmlText(evt.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!kmlText.trim()) {
      toast({ title: 'Erro', description: 'Forneça o conteúdo KML.', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await importKml(kmlText)
      setResult(res)
      toast({
        title: 'Importação concluída',
        description: `${res.updated.length} representantes atualizados.`,
      })
      onSuccess?.()
    } catch (err) {
      toast({
        title: 'Erro na importação',
        description: err instanceof Error ? err.message : 'Falha ao processar KML.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = (val: boolean) => {
    if (!loading) {
      onOpenChange(val)
      if (!val) {
        setKmlText('')
        setResult(null)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-primary" />
            Importar KML
          </DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo KML ou cole o conteúdo para atualizar as áreas dos
            representantes.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg border border-green-200 bg-green-50 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-green-700">Atualizados</div>
                  <div className="text-2xl font-bold text-green-900">{result.updated.length}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex-1 rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-amber-700">Não encontrados</div>
                  <div className="text-2xl font-bold text-amber-900">{result.notFound.length}</div>
                </div>
                <AlertCircle className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            {result.notFound.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800 mb-1">Nomes não encontrados:</p>
                <p className="text-xs text-amber-700">{result.notFound.join(', ')}</p>
              </div>
            )}
            <Button onClick={() => handleClose(false)} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => document.getElementById('kml-file-input')?.click()}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Selecionar Arquivo KML
              </Button>
              <input
                id="kml-file-input"
                type="file"
                accept=".kml"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <Textarea
              placeholder="Cole o conteúdo KML aqui..."
              value={kmlText}
              onChange={(e) => setKmlText(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
            <Button onClick={handleImport} disabled={loading || !kmlText.trim()} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Importar KML'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
