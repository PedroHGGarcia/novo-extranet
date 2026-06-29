import { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AreaMap } from '@/components/AreaMap'
import { MapLayerControl } from '@/components/MapLayerControl'
import { getRepresentantes } from '@/services/cadastros'
import { parseKml } from '@/lib/kml-utils'
import { repsToLayer, kmlToLayers, getPlaceholderLayer, type MapLayer } from '@/lib/map-features'
import { Button } from '@/components/ui/button'
import { Upload, AlertTriangle, X } from 'lucide-react'

export default function AreaAtuacao() {
  const [layers, setLayers] = useState<MapLayer[]>([])
  const [loading, setLoading] = useState(true)
  const [isPlaceholder, setIsPlaceholder] = useState(false)
  const [showWarning, setShowWarning] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const reps = await getRepresentantes()
        const hasCoords = reps.some(
          (r: any) => r.coordenadas && Array.isArray(r.coordenadas) && r.coordenadas.length > 2,
        )
        if (hasCoords) {
          setLayers([repsToLayer(reps)])
          setIsPlaceholder(false)
        } else {
          setLayers([getPlaceholderLayer()])
          setIsPlaceholder(true)
        }
      } catch {
        setLayers([getPlaceholderLayer()])
        setIsPlaceholder(true)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleToggleLayer = (layerId: string) => {
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)))
  }

  const handleKmlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const kmlDoc = parseKml(text)
    const kmlLayers = kmlToLayers(kmlDoc)
    if (kmlLayers.length > 0) {
      setLayers((prev) => {
        const base = prev.filter((l) => !l.id.startsWith('kml-') && l.id !== 'placeholder')
        return [...base, ...kmlLayers]
      })
      setIsPlaceholder(false)
      setShowWarning(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpdateMap = () => fileInputRef.current?.click()

  return (
    <div className="flex h-full w-full flex-col p-6 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Área de Atuação</h1>
          <p className="text-gray-500">
            Visualize a cobertura geográfica dos representantes no mapa interativo.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml"
            onChange={handleKmlUpload}
            className="hidden"
          />
          <Button variant="outline" onClick={handleUpdateMap} className="gap-2">
            <Upload className="w-4 h-4" />
            Atualizar Mapa (KML)
          </Button>
        </div>
      </div>

      {isPlaceholder && showWarning && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            <strong>Modo Placeholder:</strong> Não há coordenadas reais no banco de dados. Exibindo
            pontos simulados dos representantes. Faça upload de um arquivo KML para visualizar dados
            reais.
          </p>
          <button
            onClick={() => setShowWarning(false)}
            className="text-amber-600 hover:text-amber-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <Card className="flex-1 overflow-hidden shadow-sm border rounded-xl min-h-[500px] relative">
        <CardContent className="h-full p-0 relative">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-gray-50">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
            </div>
          ) : (
            <>
              <AreaMap
                layers={layers}
                title="REPS VEKER"
                centerCoords={{ lat: -20.466799, lon: -45.086393 }}
                zoomLevel={6}
                autoFit={!isPlaceholder}
              />
              <MapLayerControl layers={layers} onToggle={handleToggleLayer} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
