migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'bianca@bener.com.br')
      if (!record.getString('setor')) {
        record.set('setor', 'Administrativo')
        app.save(record)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'bianca@bener.com.br')
      record.set('setor', '')
      app.save(record)
    } catch (_) {}
  },
)
