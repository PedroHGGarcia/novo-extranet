migrate(
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'pedro.garcia@bener.com.br')
      record.set('role', 'admin')
      app.save(record)
    } catch (_) {
      // Record does not exist - skip
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'pedro.garcia@bener.com.br')
      record.set('role', 'user')
      app.save(record)
    } catch (_) {
      // Record does not exist - skip
    }
  },
)
