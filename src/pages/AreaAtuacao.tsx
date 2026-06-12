import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AreaMap, sortClockwise, type PolygonData } from '@/components/AreaMap'
import { getRepresentantes } from '@/services/cadastros'

const COLORS = [
  'red',
  'blue',
  'green',
  'purple',
  'orange',
  'darkred',
  'lightred',
  'beige',
  'darkblue',
]

export default function AreaAtuacao() {
  const [polygons, setPolygons] = useState<PolygonData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const reps = await getRepresentantes()
        const parsed = reps
          .filter((r) => r.coordenadas && Array.isArray(r.coordenadas) && r.coordenadas.length > 2)
          .map((r, i) => {
            const rawPoints = r.coordenadas as [number, number][]
            const sortedPoints = sortClockwise(rawPoints)
            return {
              id: r.id,
              name: r.fantasia || r.nome || 'Representante',
              color: COLORS[i % COLORS.length],
              points: sortedPoints,
            }
          })
        setPolygons(parsed)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="flex h-full w-full flex-col p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Área de Atuação</h1>
        <p className="text-gray-500">
          Visualize a cobertura geográfica dos representantes no mapa interactivo.
        </p>
      </div>

      <Card className="flex-1 overflow-hidden shadow-sm border rounded-xl min-h-[500px]">
        <CardContent className="h-full p-0 relative">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
            </div>
          ) : (
            <AreaMap polygons={polygons} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
