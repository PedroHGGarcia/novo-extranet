migrate(
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    if (!clientesCol.fields.getByName('limite_credito')) {
      clientesCol.fields.add(new NumberField({ name: 'limite_credito' }))
    }
    app.save(clientesCol)

    const notifCol = app.findCollectionByNameOrId('notificacoes')
    notifCol.listRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    notifCol.viewRule =
      "@request.auth.id != '' && (user = @request.auth.id || @request.auth.role = 'admin')"
    app.save(notifCol)
  },
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    const field = clientesCol.fields.getByName('limite_credito')
    if (field) {
      clientesCol.fields.remove(field)
    }
    app.save(clientesCol)

    const notifCol = app.findCollectionByNameOrId('notificacoes')
    notifCol.listRule = "@request.auth.id != '' && user = @request.auth.id"
    notifCol.viewRule = "@request.auth.id != '' && user = @request.auth.id"
    app.save(notifCol)
  },
)
