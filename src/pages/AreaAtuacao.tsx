import { Card, CardContent } from '@/components/ui/card'
import { MapaTerritoriosReps } from '@/components/MapaTerritoriosReps'

export default function AreaAtuacao() {
  return (
    <div className="flex h-full w-full flex-col p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Área de Atuação</h1>
        <p className="text-gray-500">
          Visualize a cobertura geográfica dos representantes no mapa interativo.
        </p>
      </div>
      <Card className="flex-1 overflow-hidden shadow-sm border rounded-xl min-h-[500px] relative">
        <CardContent className="h-full p-0">
          <MapaTerritoriosReps />
        </CardContent>
      </Card>
    </div>
  )
}
