routerAdd(
  'POST',
  '/backend/v1/kml-import',
  (e) => {
    var body = e.requestInfo().body || {}
    var kmlText = body.kml || ''

    if (!kmlText.trim()) {
      return e.badRequestError('KML content is required')
    }

    function parseStyleContent(content) {
      var style = {}
      var ls = content.match(/<LineStyle>([\s\S]*?)<\/LineStyle>/)
      if (ls) {
        var lc = ls[1].match(/<color>([^<]+)<\/color>/)
        if (lc) style.lineColor = lc[1].trim()
        var lw = ls[1].match(/<width>([^<]+)<\/width>/)
        if (lw) style.lineWidth = parseFloat(lw[1].trim())
      }
      var ps = content.match(/<PolyStyle>([\s\S]*?)<\/PolyStyle>/)
      if (ps) {
        var pc = ps[1].match(/<color>([^<]+)<\/color>/)
        if (pc) style.polyColor = pc[1].trim()
        var pf = ps[1].match(/<fill>([^<]+)<\/fill>/)
        if (pf) style.polyFill = pf[1].trim() !== '0'
      }
      return style
    }

    var styles = {}
    var styleRegex = /<Style\s+id="([^"]+)">([\s\S]*?)<\/Style>/g
    var match
    while ((match = styleRegex.exec(kmlText)) !== null) {
      styles[match[1]] = parseStyleContent(match[2])
    }

    var mapRegex = /<StyleMap\s+id="([^"]+)">([\s\S]*?)<\/StyleMap>/g
    while ((match = mapRegex.exec(kmlText)) !== null) {
      var mapId = match[1]
      var nm = match[2].match(/<key>normal<\/key>\s*<styleUrl>([^<]+)<\/styleUrl>/)
      if (nm) {
        var tid = nm[1].trim().replace('#', '')
        if (styles[tid]) styles[mapId] = styles[tid]
      }
    }

    var placemarks = []
    var pmRegex = /<Placemark>([\s\S]*?)<\/Placemark>/g
    while ((match = pmRegex.exec(kmlText)) !== null) {
      var content = match[1]
      var nameM = content.match(/<name>([^<]+)<\/name>/)
      var descM = content.match(/<description>([^<]*)<\/description>/)
      var surlM = content.match(/<styleUrl>([^<]+)<\/styleUrl>/)
      var coordsM = content.match(/<coordinates>([\s\S]*?)<\/coordinates>/)

      if (nameM && coordsM) {
        var coords = coordsM[1]
          .trim()
          .split(/\s+/)
          .map(function (pair) {
            var parts = pair.split(',')
            return [parseFloat(parts[1]), parseFloat(parts[0])]
          })
          .filter(function (c) {
            return !isNaN(c[0]) && !isNaN(c[1])
          })

        var sid = surlM ? surlM[1].trim().replace('#', '') : ''
        var st = styles[sid] || {}

        placemarks.push({
          name: nameM[1].trim(),
          description: descM ? descM[1].trim() : '',
          style: st,
          coordinates: coords,
        })
      }
    }

    var updated = []
    var notFound = []

    for (var i = 0; i < placemarks.length; i++) {
      var pm = placemarks[i]
      if (pm.coordinates.length < 3) {
        $app.logger().warn('KML import: insufficient coordinates', 'name', pm.name)
        continue
      }
      try {
        var record = $app.findFirstRecordByData('representantes', 'fantasia', pm.name)
        var kmlStyle = {
          lineColor: pm.style.lineColor || 'ff000000',
          lineWidth: pm.style.lineWidth || 1.2,
          polyColor: pm.style.polyColor || '4d000000',
          polyFill: pm.style.polyFill !== false,
          description: pm.description || '',
        }
        record.set('coordenadas', pm.coordinates)
        record.set('kml_style', kmlStyle)
        $app.save(record)
        updated.push(pm.name)
      } catch (_) {
        $app.logger().warn('KML import: representative not found', 'name', pm.name)
        notFound.push(pm.name)
      }
    }

    return e.json(200, {
      processed: placemarks.length,
      updated: updated,
      notFound: notFound,
    })
  },
  $apis.requireAuth(),
)
