import React, { useState, useRef, useEffect } from 'react'
import type { MapFeature, MapLayer } from '@/lib/map-features'

function project(lat: number, lon: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom)
  const x = ((lon + 180) / 360) * scale
  const latRad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale
  return { x, y }
}

function unproject(x: number, y: number, zoom: number) {
  const scale = 256 * Math.pow(2, zoom)
  const lon = (x / scale) * 360 - 180
  const n = Math.PI - (2 * Math.PI * y) / scale
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))
  return { lat, lon }
}

interface SelectedFeature {
  name: string
  description: string
  x: number
  y: number
}

interface AreaMapProps {
  layers: MapLayer[]
  centerCoords?: { lat: number; lon: number }
  zoomLevel?: number
  title?: string
  autoFit?: boolean
}

export function AreaMap({ layers, centerCoords, zoomLevel, title, autoFit = true }: AreaMapProps) {
  const [zoom, setZoom] = useState(zoomLevel ?? 6)
  const [center, setCenter] = useState(centerCoords ?? { lat: -20.466799, lon: -45.086393 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selected, setSelected] = useState<SelectedFeature | null>(null)
  const [hovered, setHovered] = useState<{ name: string; x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevKey = useRef<string | null>(null)

  useEffect(() => {
    if (!autoFit || dimensions.width === 0) return
    const allFeatures = layers.flatMap((l) => l.features)
    if (allFeatures.length === 0) return
    const key = allFeatures.map((f) => f.id).join(',')
    if (prevKey.current === key) return
    prevKey.current = key

    let minLat = Infinity,
      maxLat = -Infinity,
      minLon = Infinity,
      maxLon = -Infinity
    allFeatures.forEach((f) => {
      const coords = f.type === 'point' ? [f.coordinates] : f.coordinates
      coords.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat
        if (lat > maxLat) maxLat = lat
        if (lon < minLon) minLon = lon
        if (lon > maxLon) maxLon = lon
      })
    })
    if (minLat === Infinity) return
    setCenter({ lat: (minLat + maxLat) / 2, lon: (minLon + maxLon) / 2 })
    const pMin = project(minLat, minLon, 0)
    const pMax = project(maxLat, maxLon, 0)
    const dx = Math.abs(pMax.x - pMin.x) || 0.0001
    const dy = Math.abs(pMax.y - pMin.y) || 0.0001
    const padX = Math.max(dimensions.width - 80, dimensions.width * 0.8)
    const padY = Math.max(dimensions.height - 80, dimensions.height * 0.8)
    let z = Math.min(Math.log2(padX / dx), Math.log2(padY / dy))
    if (!Number.isFinite(z)) z = 12
    setZoom(Math.max(3, Math.min(z, 14)))
  }, [layers, dimensions.width, dimensions.height, autoFit])

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0])
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        })
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => Math.min(Math.max(z + -e.deltaY * 0.002, 3), 18))
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setHovered(null)
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setDragStart({ x: e.clientX, y: e.clientY })
      const cp = project(center.lat, center.lon, zoom)
      setCenter(unproject(cp.x - dx, cp.y - dy, zoom))
    } else if (hovered && rect) {
      setHovered({ ...hovered, x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  const Z = Math.round(zoom)
  const scale = Math.pow(2, zoom - Z)
  const TILE = 256
  const centerP = project(center.lat, center.lon, Z)
  const minX = centerP.x - dimensions.width / 2 / scale
  const maxX = centerP.x + dimensions.width / 2 / scale
  const minY = centerP.y - dimensions.height / 2 / scale
  const maxY = centerP.y + dimensions.height / 2 / scale
  const startCol = Math.max(0, Math.floor(minX / TILE))
  const endCol = Math.min(Math.pow(2, Z) - 1, Math.floor(maxX / TILE))
  const startRow = Math.max(0, Math.floor(minY / TILE))
  const endRow = Math.min(Math.pow(2, Z) - 1, Math.floor(maxY / TILE))
  const tiles: { x: number; y: number; z: number }[] = []
  for (let x = startCol; x <= endCol; x++)
    for (let y = startRow; y <= endRow; y++) tiles.push({ x, y, z: Z })

  const visibleFeatures = layers.filter((l) => l.visible).flatMap((l) => l.features)

  const handleFeatureClick = (e: React.MouseEvent, feature: MapFeature) => {
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect)
      setSelected({
        name: feature.name,
        description: feature.description,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#e0f3f8] select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => {
        setIsDragging(false)
        setHovered(null)
      }}
      onClick={() => setSelected(null)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {title && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white px-6 py-2 shadow-lg text-gray-800 pointer-events-none"
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            borderRadius: '8px',
          }}
        >
          {title}
        </div>
      )}
      <svg width="100%" height="100%">
        <g
          transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2}) scale(${scale}) translate(${-centerP.x}, ${-centerP.y})`}
        >
          {tiles.map((t) => (
            <image
              key={`${t.z}/${t.x}/${t.y}`}
              href={`https://mt1.google.com/vt/lyrs=m&hl=pt-BR&x=${t.x}&y=${t.y}&z=${t.z}`}
              x={t.x * TILE}
              y={t.y * TILE}
              width={TILE}
              height={TILE}
              preserveAspectRatio="none"
              opacity={1}
            />
          ))}
          {visibleFeatures.map((f) => {
            if (f.type === 'point') {
              const p = project(f.coordinates[0], f.coordinates[1], Z)
              return (
                <circle
                  key={f.id}
                  cx={p.x}
                  cy={p.y}
                  r={10 / scale}
                  fill={f.color}
                  fillOpacity={0.7}
                  stroke="white"
                  strokeWidth={2 / scale}
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onClick={(e) => handleFeatureClick(e, f)}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect)
                      setHovered({
                        name: f.name,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      })
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            }
            if (f.type === 'polygon') {
              const pts = f.coordinates.map(([lat, lon]) => project(lat, lon, Z))
              return (
                <polygon
                  key={f.id}
                  points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                  fill={f.fillColor}
                  fillOpacity={f.fillOpacity}
                  stroke={f.strokeColor}
                  strokeWidth={f.strokeWidth / scale}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={(e) => handleFeatureClick(e, f)}
                  onMouseEnter={(e) => {
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect)
                      setHovered({
                        name: f.name,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      })
                  }}
                  onMouseLeave={() => setHovered(null)}
                />
              )
            }
            const pts = f.coordinates.map(([lat, lon]) => project(lat, lon, Z))
            return (
              <polyline
                key={f.id}
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={f.color}
                strokeWidth={f.width / scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cursor-pointer"
                onClick={(e) => handleFeatureClick(e, f)}
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect)
                    setHovered({ name: f.name, x: e.clientX - rect.left, y: e.clientY - rect.top })
                }}
                onMouseLeave={() => setHovered(null)}
              />
            )
          })}
        </g>
      </svg>
      {selected && (
        <div
          className="absolute z-50 px-3 py-2 bg-white rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px] border border-gray-200"
          style={{ left: selected.x, top: selected.y }}
        >
          <p
            className="font-bold text-sm text-gray-900"
            dangerouslySetInnerHTML={{ __html: selected.name }}
          />
          {selected.description && (
            <div
              className="text-xs text-gray-500 mt-1 max-w-md break-words whitespace-pre-wrap overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: selected.description }}
            />
          )}
          <div className="absolute w-3 h-3 bg-white rotate-45 left-1/2 -translate-x-1/2 -bottom-1 border-r border-b border-gray-200" />
        </div>
      )}
      {hovered && !selected && (
        <div
          className="absolute z-50 px-2.5 py-1 bg-gray-900 text-white rounded text-xs font-medium pointer-events-none whitespace-nowrap shadow-lg"
          style={{ left: hovered.x, top: hovered.y - 28, transform: 'translateX(-50%)' }}
        >
          <span dangerouslySetInnerHTML={{ __html: hovered.name }} />
        </div>
      )}
      <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded shadow text-xs text-gray-600 pointer-events-none">
        Role o scroll para zoom • Arraste para mover
      </div>
    </div>
  )
}
