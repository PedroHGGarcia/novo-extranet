migrate(
  (app) => {
    const collection = new Collection({
      name: 'configuracoes_dashboard',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'perfil', type: 'select', required: true, values: ['admin', 'user'], maxSelect: 1 },
        { name: 'componente', type: 'text', required: true },
        { name: 'visivel', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('configuracoes_dashboard')
    app.delete(collection)
  },
)
