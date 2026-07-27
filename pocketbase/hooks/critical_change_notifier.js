onRecordUpdate((e) => {
  try {
    if (!e || !e.record) return
    var rec = e.record
    var colName = rec.collectionName || ''

    var userId = ''
    try {
      if (e.auth && e.auth.id) userId = e.auth.id
      else if (rec.get('user')) userId = rec.get('user')
    } catch (_) {}

    if (colName === 'projetos' || colName === 'propostas') {
      var userName = 'Usuário'
      if (userId) {
        try {
          var u = $app.findRecordById('users', userId)
          if (u) {
            userName = u.getString('name') || u.get('name') || u.getString('email') || 'Usuário'
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
})
