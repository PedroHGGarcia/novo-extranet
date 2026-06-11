migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let record = null

    try {
      record = app.findAuthRecordByEmail('_pb_users_auth_', 'pedro.garcia@bener.com.br')
    } catch (_) {
      try {
        record = app.findFirstRecordByData('_pb_users_auth_', 'name', 'Pedro Garcia')
      } catch (_) {
        record = new Record(users)
        record.set('name', 'Pedro Garcia')
      }
    }

    record.setEmail('pedro.garcia@bener.com.br')
    record.setPassword('bener123')
    record.setVerified(true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'pedro.garcia@bener.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
