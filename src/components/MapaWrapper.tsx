import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

const MapaTerritoriosReps = lazy(() =>
  import('@/components/MapaTerritoriosReps').then((m) => ({
    default: m.MapaTerritoriosReps,
  })),
)

export function MapaWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-[#e0f3f8]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Carregando mapa...</p>
          </div>
        </div>
      }
    >
      <MapaTerritoriosReps />
    </Suspense>
  )
}
