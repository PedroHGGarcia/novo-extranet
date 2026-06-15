migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      const admin = app.findAuthRecordByEmail('users', 'bianca@bener.com.br')
      admin.set('role', 'admin')
      admin.set('name', 'Admin')
      app.save(admin)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('bianca@bener.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      record.set('role', 'admin')
      app.save(record)
    }

    try {
      const user = app.findAuthRecordByEmail('users', 'vendedor@bener.com.br')
      user.set('role', 'user')
      user.set('name', 'Vendedor')
      app.save(user)
    } catch (_) {
      const record = new Record(users)
      record.setEmail('vendedor@bener.com.br')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Vendedor')
      record.set('role', 'user')
      app.save(record)
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('users', 'bianca@bener.com.br')
      app.delete(admin)
    } catch (_) {}
    try {
      const user = app.findAuthRecordByEmail('users', 'vendedor@bener.com.br')
      app.delete(user)
    } catch (_) {}
  },
)
