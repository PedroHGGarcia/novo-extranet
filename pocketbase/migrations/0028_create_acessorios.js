migrate(
  (app) => {
    const collection = new Collection({
      name: 'acessorios',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Opcional', 'Standard', 'Opcional Standard'],
          maxSelect: 1,
        },
        { name: 'moeda', type: 'select', values: ['BRL', 'USD', 'EUR'], maxSelect: 1 },
        { name: 'valor', type: 'number' },
        { name: 'fator_nac', type: 'number' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        },
        {
          name: 'versoes',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('versoes').id,
          maxSelect: 999,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('acessorios')
    app.delete(collection)
  },
)
