migrate(
  (app) => {
    const col = new Collection({
      name: 'propostas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'numero_proposta', type: 'text', required: true },
        {
          name: 'cliente',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        },
        { name: 'contato', type: 'text' },
        { name: 'telefone', type: 'text' },
        {
          name: 'versao',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('versoes').id,
          maxSelect: 1,
        },
        {
          name: 'representante',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('representantes').id,
          maxSelect: 1,
        },
        { name: 'nota_rep', type: 'number' },
        { name: 'dt_cad', type: 'date' },
        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(col)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('propostas'))
  },
)
