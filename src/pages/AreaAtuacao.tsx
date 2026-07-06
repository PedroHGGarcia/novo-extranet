import { useState } from 'react'
import { UploadCloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapaTerritoriosReps } from '@/components/MapaTerritoriosReps'
import { KmlImportDialog } from '@/components/KmlImportDialog'

export default function AreaAtuacao() {
  const [importOpen, setImportOpen] = useState(false)

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
          <MapaTerritoriosReps />
        </CardContent>
      </Card>
      <KmlImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
