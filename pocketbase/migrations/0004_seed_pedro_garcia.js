migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'pedro.garcia@example.com')
      return // already seeded
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('pedro.garcia@example.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Pedro Garcia')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'pedro.garcia@example.com')
      app.delete(record)
    } catch (_) {}
  },
)
