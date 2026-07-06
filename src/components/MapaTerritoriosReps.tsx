import { useState, useEffect } from 'react'
import { AreaMap } from '@/components/AreaMap'
import { repsToLayer, type MapLayer } from '@/lib/map-features'
import { getRepresentantes } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'

export function MapaTerritoriosReps() {
  const [layers, setLayers] = useState<MapLayer[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const reps = await getRepresentantes()
      const layer = repsToLayer(reps)
      setLayers([layer])
    } catch (err) {
      console.error('Failed to load representatives:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('representantes', () => {
    loadData()
  })

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#e0f3f8]">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <AreaMap
        layers={layers}
        title="REPS VEKER"
        centerCoords={{ lat: -20.466799, lon: -45.086393 }}
        zoomLevel={5}
      />
    </div>
  )
}
