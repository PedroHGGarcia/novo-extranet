migrate(
  (app) => {
    const collection = new Collection({
      name: 'auditoria',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'acao', type: 'text', required: true },
        { name: 'tabela', type: 'text', required: true },
        { name: 'registro_id', type: 'text', required: true },
        { name: 'dados', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('auditoria')
    app.delete(collection)
  },
)
