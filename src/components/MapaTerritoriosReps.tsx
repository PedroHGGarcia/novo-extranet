import {
  MapContainer,
  TileLayer,
  Polygon,
  Tooltip,
  Popup,
  LayersControl,
  FeatureGroup,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  representantesVeker,
  poligonosEspeciais,
  type Representante,
} from '@/data/territorios-veker'

const { BaseLayer, Overlay } = LayersControl

const MAP_CENTER: [number, number] = [-20.466799, -45.086393]
const MAP_ZOOM = 6

function parseRgbaFill(rgba: string): { color: string; opacity: number } {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!match) return { color: rgba, opacity: 0.3 }
  const [, r, g, b, a] = match
  return { color: `rgb(${r}, ${g}, ${b})`, opacity: a ? parseFloat(a) : 1 }
}

function TerritoryPolygon({ rep }: { rep: Representante }) {
  const { color, opacity } = parseRgbaFill(rep.corPreenchimento)
  return (
    <Polygon
      positions={rep.coordenadas}
      pathOptions={{
        color: rep.corBorda,
        fillColor: color,
        fillOpacity: opacity,
        weight: 2,
      }}
    >
      <Tooltip sticky>{rep.nome}</Tooltip>
      <Popup>
        <div className="p-1">
          <p className="font-bold text-sm text-gray-900">{rep.nome}</p>
          {rep.descricao && <p className="text-xs text-gray-500 mt-1">{rep.descricao}</p>}
        </div>
      </Popup>
    </Polygon>
  )
}

export function MapaTerritoriosReps() {
  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        style={{ height: '100%', width: '100%', background: '#e0f3f8' }}
        scrollWheelZoom
      >
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </BaseLayer>
          <Overlay checked name="Representantes Veker">
            <FeatureGroup>
              {representantesVeker.map((rep, i) => (
                <TerritoryPolygon key={`rep-${i}`} rep={rep} />
              ))}
            </FeatureGroup>
          </Overlay>
          <Overlay checked name="Polígonos">
            <FeatureGroup>
              {poligonosEspeciais.map((rep, i) => (
                <TerritoryPolygon key={`pol-${i}`} rep={rep} />
              ))}
            </FeatureGroup>
          </Overlay>
        </LayersControl>
      </MapContainer>
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white px-6 py-2 shadow-lg text-gray-800 pointer-events-none rounded-lg"
        style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}
      >
        REPS VEKER
      </div>
    </div>
  )
}
