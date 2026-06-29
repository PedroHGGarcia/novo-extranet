import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MapLayer } from '@/lib/map-features'

interface MapLayerControlProps {
  layers: MapLayer[]
  onToggle: (layerId: string) => void
}

export function MapLayerControl({ layers, onToggle }: MapLayerControlProps) {
  if (layers.length === 0) return null

  return (
    <div className="absolute top-16 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[180px] max-w-[220px]">
      <div className="px-3 py-2 border-b border-gray-200">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Camadas</span>
      </div>
      <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => onToggle(layer.id)}
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors',
              layer.visible ? 'bg-blue-50 text-gray-800' : 'text-gray-500 hover:bg-gray-50',
            )}
          >
            <span
              className={cn(
                'flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0',
                layer.visible ? 'bg-blue-500 border-blue-500' : 'border-gray-300',
              )}
            >
              {layer.visible && <Check className="w-3 h-3 text-white" />}
            </span>
            <span className="flex-1 text-left truncate">{layer.name}</span>
            <span className="text-xs text-gray-400 shrink-0">{layer.features.length}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
