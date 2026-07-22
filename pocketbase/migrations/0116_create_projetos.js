migrate(
  (app) => {
    const collection = new Collection({
      name: 'projetos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('clientes').id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['Em Andamento', 'Concluído', 'Cancelado', 'Suspenso'],
          maxSelect: 1,
        },
        {
          name: 'user',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_projetos_cliente ON projetos (cliente)',
        'CREATE INDEX idx_projetos_status ON projetos (status)',
        'CREATE INDEX idx_projetos_nome ON projetos (nome)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    app.delete(app.findCollectionByNameOrId('projetos'))
  },
)
