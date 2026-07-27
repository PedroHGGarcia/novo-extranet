onRecordUpdate((e) => {
  try {
    if (!e || !e.record) return
    var rec = e.record
    var statusChanged = false
    try {
      if (rec.original()) {
        statusChanged = rec.getString('status') !== rec.original().getString('status')
      }
    } catch (_) {}

    if (statusChanged) {
      var userId = ''
      if (e.auth && e.auth.id) {
        userId = e.auth.id
      } else if (rec.get('user')) {
        userId = rec.get('user')
      }

      if (userId) {
        rec.set('ultimo_usuario_status', userId)
      }
      rec.set('data_alteracao_status', new Date().toISOString().split('T')[0])
    }
  } catch (_) {}
}, 'propostas')
