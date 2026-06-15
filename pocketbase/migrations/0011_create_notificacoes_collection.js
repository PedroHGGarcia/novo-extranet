migrate(
  (app) => {
    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && user = @request.auth.id",
      viewRule: "@request.auth.id != '' && user = @request.auth.id",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && user = @request.auth.id",
      deleteRule: "@request.auth.id != '' && user = @request.auth.id",
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true },
        { name: 'mensagem', type: 'text', required: true },
        { name: 'lida', type: 'bool' },
        {
          name: 'tipo',
          type: 'select',
          values: ['info', 'alerta', 'sucesso'],
          required: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('notificacoes')
      app.delete(collection)
    } catch (_) {}
  },
)
