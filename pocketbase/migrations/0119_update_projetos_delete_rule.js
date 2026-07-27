migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('projetos')
    col.deleteRule = "@request.auth.role = 'admin' || user = @request.auth.id"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('projetos')
    col.deleteRule = "@request.auth.role = 'admin'"
    app.save(col)
  },
)
