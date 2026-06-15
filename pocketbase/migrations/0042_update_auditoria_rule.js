migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('auditoria')
    col.listRule = "@request.auth.id != ''"
    col.viewRule = "@request.auth.id != ''"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('auditoria')
    col.listRule = "@request.auth.role = 'admin'"
    col.viewRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
