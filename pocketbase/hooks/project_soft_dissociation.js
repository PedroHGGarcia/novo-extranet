onRecordDelete((e) => {
  try {
    if (!e || !e.record) return
    var projectId = e.record.id
    if (projectId) {
      var propostas = $app.findRecordsByFilter(
        'propostas',
        'projeto = {:pid}',
        '-created',
        500,
        0,
        { pid: projectId },
      )
      if (propostas && propostas.length > 0) {
        for (var i = 0; i < propostas.length; i++) {
          var p = propostas[i]
          if (p) {
            p.set('projeto', null)
            $app.save(p)
          }
        }
      }
    }
  } catch (_) {}
}, 'projetos')
