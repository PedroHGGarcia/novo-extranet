export interface KmlStyle {
  iconColor?: string
  polyColor?: string
  polyFill?: boolean
  lineColor?: string
  lineWidth?: number
}

export interface KmlPlacemark {
  name: string
  description: string
  type: 'point' | 'polygon' | 'line'
  coordinates: [number, number][]
  style?: KmlStyle
}

export interface KmlFolder {
  name: string
  placemarks: KmlPlacemark[]
}

export interface KmlDocument {
  folders: KmlFolder[]
}

export function kmlColorToHex(kmlColor: string): { color: string; opacity: number } {
  if (!kmlColor || kmlColor.length < 8) return { color: '#3388ff', opacity: 1 }
  const aa = parseInt(kmlColor.substring(0, 2), 16)
  const bb = kmlColor.substring(2, 4)
  const gg = kmlColor.substring(4, 6)
  const rr = kmlColor.substring(6, 8)
  return { color: `#${rr}${gg}${bb}`, opacity: Math.round((aa / 255) * 100) / 100 }
}

export function parseKml(kmlText: string): KmlDocument {
  const parser = new DOMParser()
  const doc = parser.parseFromString(kmlText, 'text/xml')
  if (doc.querySelector('parsererror')) return { folders: [] }

  const styles = new Map<string, KmlStyle>()
  Array.from(doc.getElementsByTagName('Style')).forEach((el) => {
    const id = el.getAttribute('id')
    if (!id) return
    const style = extractStyle(el)
    if (Object.keys(style).length > 0) styles.set(id, style)
  })

  const folders: KmlFolder[] = []
  const docEl = doc.getElementsByTagName('Document')[0] || doc.documentElement

  Array.from(docEl.children).forEach((child) => {
    if (child.tagName === 'Folder') {
      const folder = parseFolderEl(child, styles)
      if (folder) folders.push(folder)
    }
  })

  if (folders.length === 0) {
    const placemarks = parsePlacemarksFromEl(docEl, styles)
    if (placemarks.length > 0) folders.push({ name: 'Geral', placemarks })
  }

  return { folders }
}

function extractStyle(el: Element): KmlStyle {
  const style: KmlStyle = {}
  const iconStyle = el.getElementsByTagName('IconStyle')[0]
  if (iconStyle) {
    const c = iconStyle.getElementsByTagName('color')[0]?.textContent?.trim()
    if (c) style.iconColor = c
  }
  const polyStyle = el.getElementsByTagName('PolyStyle')[0]
  if (polyStyle) {
    const c = polyStyle.getElementsByTagName('color')[0]?.textContent?.trim()
    if (c) style.polyColor = c
    const f = polyStyle.getElementsByTagName('fill')[0]?.textContent?.trim()
    if (f !== undefined && f !== '') style.polyFill = f !== '0'
  }
  const lineStyle = el.getElementsByTagName('LineStyle')[0]
  if (lineStyle) {
    const c = lineStyle.getElementsByTagName('color')[0]?.textContent?.trim()
    if (c) style.lineColor = c
    const w = lineStyle.getElementsByTagName('width')[0]?.textContent?.trim()
    if (w) style.lineWidth = parseInt(w, 10)
  }
  return style
}

function parseFolderEl(el: Element, styles: Map<string, KmlStyle>): KmlFolder | null {
  const name = el.getElementsByTagName('name')[0]?.textContent?.trim() || 'Sem nome'
  const placemarks = parsePlacemarksFromEl(el, styles)
  return placemarks.length > 0 ? { name, placemarks } : null
}

function parsePlacemarksFromEl(parent: Element, styles: Map<string, KmlStyle>): KmlPlacemark[] {
  const result: KmlPlacemark[] = []
  Array.from(parent.getElementsByTagName('Placemark')).forEach((pmEl) => {
    if (pmEl.parentElement !== parent) return
    const name = pmEl.getElementsByTagName('name')[0]?.textContent?.trim() || ''
    const description = pmEl.getElementsByTagName('description')[0]?.textContent?.trim() || ''

    let style: KmlStyle | undefined
    const styleUrl = pmEl.getElementsByTagName('styleUrl')[0]?.textContent?.trim()
    if (styleUrl) style = styles.get(styleUrl.replace('#', ''))
    const inlineStyleEl = Array.from(pmEl.children).find((c) => c.tagName === 'Style')
    if (inlineStyleEl) {
      const inline = extractStyle(inlineStyleEl)
      if (Object.keys(inline).length > 0) style = { ...style, ...inline }
    }

    const point = pmEl.getElementsByTagName('Point')[0]
    if (point) {
      const coords = parseCoords(point.getElementsByTagName('coordinates')[0]?.textContent || '')
      if (coords.length > 0)
        result.push({ name, description, type: 'point', coordinates: [coords[0]], style })
      return
    }
    const polygon = pmEl.getElementsByTagName('Polygon')[0]
    if (polygon) {
      const ob = polygon.getElementsByTagName('outerBoundaryIs')[0]
      const coords = parseCoords(ob?.getElementsByTagName('coordinates')[0]?.textContent || '')
      if (coords.length > 0)
        result.push({ name, description, type: 'polygon', coordinates: coords, style })
      return
    }
    const ls = pmEl.getElementsByTagName('LineString')[0]
    if (ls) {
      const coords = parseCoords(ls.getElementsByTagName('coordinates')[0]?.textContent || '')
      if (coords.length > 0)
        result.push({ name, description, type: 'line', coordinates: coords, style })
    }
  })
  return result
}

function parseCoords(text: string): [number, number][] {
  return text
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const parts = pair.split(',')
      return [Number(parts[1]), Number(parts[0])] as [number, number]
    })
    .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon))
}
