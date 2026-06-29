import { kmlColorToHex, type KmlDocument, type KmlPlacemark } from './kml-utils'

export type MapFeature =
  | {
      id: string
      type: 'point'
      coordinates: [number, number]
      name: string
      description: string
      color: string
    }
  | {
      id: string
      type: 'polygon'
      coordinates: [number, number][]
      name: string
      description: string
      fillColor: string
      fillOpacity: number
      strokeColor: string
      strokeWidth: number
    }
  | {
      id: string
      type: 'line'
      coordinates: [number, number][]
      name: string
      description: string
      color: string
      width: number
    }

export interface MapLayer {
  id: string
  name: string
  visible: boolean
  features: MapFeature[]
}

const COLORS = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#46f0f0',
  '#f032e6',
  '#bcf60c',
]

export function sortClockwise(points: [number, number][]): [number, number][] {
  if (!points || points.length < 3) return points
  const cx = points.reduce((s, p) => s + p[1], 0) / points.length
  const cy = points.reduce((s, p) => s + p[0], 0) / points.length
  return [...points].sort(
    (a, b) => Math.atan2(a[0] - cy, a[1] - cx) - Math.atan2(b[0] - cy, b[1] - cx),
  )
}

function placemarkToFeature(pm: KmlPlacemark, id: string): MapFeature {
  const style = pm.style || {}
  if (pm.type === 'point') {
    const color = style.iconColor ? kmlColorToHex(style.iconColor).color : '#3388ff'
    return {
      id,
      type: 'point',
      coordinates: pm.coordinates[0],
      name: pm.name,
      description: pm.description,
      color,
    }
  }
  if (pm.type === 'polygon') {
    const { color, opacity } = style.polyColor
      ? kmlColorToHex(style.polyColor)
      : { color: '#3388ff', opacity: 0.3 }
    const strokeColor = style.lineColor ? kmlColorToHex(style.lineColor).color : color
    return {
      id,
      type: 'polygon',
      coordinates: pm.coordinates,
      name: pm.name,
      description: pm.description,
      fillColor: color,
      fillOpacity: style.polyFill === false ? 0 : opacity || 0.3,
      strokeColor,
      strokeWidth: style.lineWidth || 2,
    }
  }
  const lineColor = style.lineColor ? kmlColorToHex(style.lineColor).color : '#3388ff'
  return {
    id,
    type: 'line',
    coordinates: pm.coordinates,
    name: pm.name,
    description: pm.description,
    color: lineColor,
    width: style.lineWidth || 3,
  }
}

export function kmlToLayers(kmlDoc: KmlDocument): MapLayer[] {
  return kmlDoc.folders.map((folder, fi) => ({
    id: `kml-${fi}`,
    name: folder.name,
    visible: true,
    features: folder.placemarks.map((pm, pi) => placemarkToFeature(pm, `kml-${fi}-${pi}`)),
  }))
}

export function repsToLayer(reps: any[]): MapLayer {
  return {
    id: 'representantes',
    name: 'Representantes',
    visible: true,
    features: reps
      .filter((r) => r.coordenadas && Array.isArray(r.coordenadas) && r.coordenadas.length > 2)
      .map((r, i) => ({
        id: r.id,
        type: 'polygon' as const,
        coordinates: sortClockwise(r.coordenadas as [number, number][]),
        name: r.fantasia || r.nome || 'Representante',
        description: [r.cidade, r.uf].filter(Boolean).join(' - '),
        fillColor: COLORS[i % COLORS.length],
        fillOpacity: 0.3,
        strokeColor: COLORS[i % COLORS.length],
        strokeWidth: 2,
      })),
  }
}

const PLACEHOLDER_NAMES = [
  'WLADIMIR',
  'ALMEIDA',
  'SANTANA',
  'JOSUÉ',
  'VICTOR HUGO',
  'AURÉLIO',
  'RAMON - MARCOS SANCHES',
  'FLÁVIO MARTINS',
  'RENATO',
]

export function getPlaceholderLayer(): MapLayer {
  const center: [number, number] = [-20.466799, -45.086393]
  const features: MapFeature[] = PLACEHOLDER_NAMES.map((name, i) => {
    const angle = (i / PLACEHOLDER_NAMES.length) * Math.PI * 2
    const dist = 0.35
    return {
      id: `placeholder-${i}`,
      type: 'point',
      coordinates: [center[0] + Math.sin(angle) * dist, center[1] + Math.cos(angle) * dist],
      name,
      description: 'Representante (dados simulados)',
      color: COLORS[i % COLORS.length],
    }
  })
  return { id: 'placeholder', name: 'Placeholder', visible: true, features }
}
