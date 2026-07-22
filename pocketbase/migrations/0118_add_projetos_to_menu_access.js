migrate(
  (app) => {
    var allUsers = app.findRecordsByFilter('users', "id != ''", '-created', 10000, 0)
    for (var i = 0; i < allUsers.length; i++) {
      var record = allUsers[i]
      var existing = record.get('menu_access')
      var access = {}
      if (existing && typeof existing === 'object') {
        access = existing
      }
      if (access.projetos !== true) {
        access.projetos = true
        record.set('menu_access', access)
        app.save(record)
      }
    }
  },
  (app) => {
    var allUsers = app.findRecordsByFilter('users', "id != ''", '-created', 10000, 0)
    for (var i = 0; i < allUsers.length; i++) {
      var record = allUsers[i]
      var existing = record.get('menu_access')
      if (existing && typeof existing === 'object' && existing.projetos === true) {
        delete existing.projetos
        record.set('menu_access', existing)
        app.save(record)
      }
    }
  },
)
