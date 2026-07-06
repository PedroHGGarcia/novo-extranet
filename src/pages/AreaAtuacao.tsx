import { useState } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KmlImportDialog } from '@/components/KmlImportDialog'

const GOOGLE_MY_MAPS_URL =
  'https://www.google.com/maps/d/embed?mid=11MTMOmKAA2gbutWJQJ9YoXaef4capGo&hl=pt-BR&ehbc=2E312F'

export default function AreaAtuacao() {
  const [importOpen, setImportOpen] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  return (
    <div className="flex h-full w-full flex-col p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Área de Atuação</h1>
          <p className="text-gray-500">
            Visualize a cobertura geográfica dos representantes no mapa interativo.
          </p>
        </div>
        <Button onClick={() => setImportOpen(true)} className="flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          Importar KML
        </Button>
      </div>
      <Card className="flex-1 overflow-hidden shadow-sm border rounded-xl min-h-[500px] relative">
        <CardContent className="h-full p-0">
          <div className="relative h-full w-full">
            {!iframeLoaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#e0f3f8]">
                <Loader2 className="h-8 w-8 animate-spin text-[#337ab7]" />
                <p className="mt-3 text-sm text-gray-500">Carregando mapa...</p>
              </div>
            )}
            <iframe
              src={GOOGLE_MY_MAPS_URL}
              title="Mapa de Área de Atuação"
              className="h-full w-full border-0"
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              style={{ minHeight: '500px' }}
            />
          </div>
        </CardContent>
      </Card>
      <KmlImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
