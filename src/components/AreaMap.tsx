import React, { useState, useRef, useEffect } from 'react'

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

export interface PolygonData {
  id: string
  name: string
  color: string
  points: [number, number][]
}

export function sortClockwise(points: [number, number][]): [number, number][] {
  if (!points || points.length < 3) return points

  const cx = points.reduce((sum, p) => sum + p[1], 0) / points.length
  const cy = points.reduce((sum, p) => sum + p[0], 0) / points.length

  return [...points].sort((a, b) => {
    const angleA = Math.atan2(a[0] - cy, a[1] - cx)
    const angleB = Math.atan2(b[0] - cy, b[1] - cx)
    return angleA - angleB
  })
}

interface AreaMapProps {
  polygons: PolygonData[]
}

export function AreaMap({ polygons }: AreaMapProps) {
  const [zoom, setZoom] = useState(6)
  const [center, setCenter] = useState({ lat: -23.5, lon: -48.0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [selectedPoly, setSelectedPoly] = useState<{ name: string; x: number; y: number } | null>(
    null,
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const prevPolygonIds = useRef<string | null>(null)

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || polygons.length === 0) return

    const currentPolygonIds = polygons.map((p) => p.id).join(',')
    if (prevPolygonIds.current === currentPolygonIds) return

    prevPolygonIds.current = currentPolygonIds

    let minLat = Infinity
    let maxLat = -Infinity
    let minLon = Infinity
    let maxLon = -Infinity

    polygons.forEach((poly) => {
      poly.points.forEach((p) => {
        if (p[0] < minLat) minLat = p[0]
        if (p[0] > maxLat) maxLat = p[0]
        if (p[1] < minLon) minLon = p[1]
        if (p[1] > maxLon) maxLon = p[1]
      })
    })

    if (minLat === Infinity) return

    const centerLat = (minLat + maxLat) / 2
    const centerLon = (minLon + maxLon) / 2

    setCenter({ lat: centerLat, lon: centerLon })

    const pMin = project(minLat, minLon, 0)
    const pMax = project(maxLat, maxLon, 0)

    const dx = Math.abs(pMax.x - pMin.x) || 0.0001
    const dy = Math.abs(pMax.y - pMin.y) || 0.0001

    const paddingX = Math.max(dimensions.width - 60, dimensions.width * 0.8)
    const paddingY = Math.max(dimensions.height - 60, dimensions.height * 0.8)

    const zoomX = Math.log2(paddingX / dx)
    const zoomY = Math.log2(paddingY / dy)

    let newZoom = Math.min(zoomX, zoomY)
    if (!Number.isFinite(newZoom)) newZoom = 12
    newZoom = Math.max(3, Math.min(newZoom, 14))

    setZoom(newZoom)
  }, [polygons, dimensions.width, dimensions.height])

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        })
      }
    })
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const zoomDelta = -e.deltaY * 0.002
      setZoom((z) => Math.min(Math.max(z + zoomDelta, 3), 18))
    }

    // @ts-expect-error
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      setDragStart({ x: e.clientX, y: e.clientY })

      const currentCenterProj = project(center.lat, center.lon, zoom)
      const newCenterProj = { x: currentCenterProj.x - dx, y: currentCenterProj.y - dy }
      setCenter(unproject(newCenterProj.x, newCenterProj.y, zoom))
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  const Z = Math.round(zoom)
  const scale = Math.pow(2, zoom - Z)
  const TILE_SIZE = 256
  const centerP = project(center.lat, center.lon, Z)

  const minX = centerP.x - dimensions.width / 2 / scale
  const maxX = centerP.x + dimensions.width / 2 / scale
  const minY = centerP.y - dimensions.height / 2 / scale
  const maxY = centerP.y + dimensions.height / 2 / scale

  const startCol = Math.max(0, Math.floor(minX / TILE_SIZE))
  const endCol = Math.min(Math.pow(2, Z) - 1, Math.floor(maxX / TILE_SIZE))
  const startRow = Math.max(0, Math.floor(minY / TILE_SIZE))
  const endRow = Math.min(Math.pow(2, Z) - 1, Math.floor(maxY / TILE_SIZE))

  const tiles = []
  for (let x = startCol; x <= endCol; x++) {
    for (let y = startRow; y <= endRow; y++) {
      tiles.push({ x, y, z: Z })
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#e0f3f8] select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        handleMouseUp()
      }}
      onClick={() => setSelectedPoly(null)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg width="100%" height="100%">
        <g
          transform={`translate(${dimensions.width / 2}, ${dimensions.height / 2}) scale(${scale}) translate(${-centerP.x}, ${-centerP.y})`}
        >
          {tiles.map((t) => (
            <image
              key={`${t.z}/${t.x}/${t.y}`}
              href={`https://tile.openstreetmap.org/${t.z}/${t.x}/${t.y}.png`}
              x={t.x * TILE_SIZE}
              y={t.y * TILE_SIZE}
              width={TILE_SIZE}
              height={TILE_SIZE}
              preserveAspectRatio="none"
              opacity={0.8}
            />
          ))}

          {polygons.map((poly) => {
            const projectedPoints = poly.points.map((p) => project(p[0], p[1], Z))
            const pointsAttr = projectedPoints.map((p) => `${p.x},${p.y}`).join(' ')

            return (
              <g key={poly.id}>
                <polygon
                  points={pointsAttr}
                  fill={poly.color}
                  fillOpacity={selectedPoly?.name === poly.name ? 0.6 : 0.3}
                  stroke={poly.color}
                  strokeWidth={2 / scale}
                  className="transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    const rect = containerRef.current?.getBoundingClientRect()
                    if (rect) {
                      setSelectedPoly({
                        name: poly.name,
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                      })
                    }
                  }}
                />
                {projectedPoints.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={3 / scale}
                    fill={poly.color}
                    stroke="white"
                    strokeWidth={1 / scale}
                    className="pointer-events-none"
                  />
                ))}
              </g>
            )
          })}
        </g>
      </svg>

      {selectedPoly && (
        <div
          className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-15px]"
          style={{ left: selectedPoly.x, top: selectedPoly.y }}
        >
          {selectedPoly.name}
          <div className="absolute w-3 h-3 bg-gray-900 rotate-45 left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-2 rounded shadow text-xs text-gray-600 pointer-events-none">
        Role o scroll para zoom • Arraste para mover
      </div>
    </div>
  )
}
