import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AreaMap, sortClockwise, type PolygonData } from '@/components/AreaMap'
import { getRepresentantes } from '@/services/cadastros'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

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

interface RepData extends PolygonData {
  uf: string
}

export default function AreaAtuacao() {
  const [allReps, setAllReps] = useState<RepData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUf, setSelectedUf] = useState('all')
  const [selectedRep, setSelectedRep] = useState('all')

  useEffect(() => {
    async function loadData() {
      try {
        const reps = await getRepresentantes()
        const parsed: RepData[] = reps
          .filter((r) => r.coordenadas && Array.isArray(r.coordenadas) && r.coordenadas.length > 2)
          .map((r, i) => {
            const rawPoints = r.coordenadas as [number, number][]
            const sortedPoints = sortClockwise(rawPoints)
            return {
              id: r.id,
              name: r.fantasia || r.nome || 'Representante',
              uf: r.uf || '',
              color: COLORS[i % COLORS.length],
              points: sortedPoints,
            }
          })
        setAllReps(parsed)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const ufs = Array.from(new Set(allReps.map((r) => r.uf).filter(Boolean))).sort()
  const repOptions = allReps
    .filter((r) => selectedUf === 'all' || r.uf === selectedUf)
    .sort((a, b) => a.name.localeCompare(b.name))

  const filteredPolygons = allReps.filter((r) => {
    if (selectedUf !== 'all' && r.uf !== selectedUf) return false
    if (selectedRep !== 'all' && r.id !== selectedRep) return false
    return true
  })

  const handleUfChange = (uf: string) => {
    setSelectedUf(uf)
    setSelectedRep('all')
  }

  const clearFilters = () => {
    setSelectedUf('all')
    setSelectedRep('all')
  }

  return (
    <div className="flex h-full w-full flex-col p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Área de Atuação</h1>
        <p className="text-gray-500">
          Visualize a cobertura geográfica dos representantes no mapa interactivo.
        </p>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
        <div className="flex-1 space-y-1 w-full sm:max-w-xs">
          <label className="text-sm font-medium">Estado (UF)</label>
          <Select value={selectedUf} onValueChange={handleUfChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Estados</SelectItem>
              {ufs.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1 w-full sm:max-w-xs">
          <label className="text-sm font-medium">Representante</label>
          <Select value={selectedRep} onValueChange={setSelectedRep}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os Representantes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Representantes</SelectItem>
              {repOptions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
          Limpar Filtros
        </Button>
      </Card>

      <Card className="flex-1 overflow-hidden shadow-sm border rounded-xl min-h-[500px]">
        <CardContent className="h-full p-0 relative">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
            </div>
          ) : (
            <AreaMap polygons={filteredPolygons} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
