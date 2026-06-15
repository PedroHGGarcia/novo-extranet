migrate(
  (app) => {
    const collection = new Collection({
      name: 'eventos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        { name: 'data', type: 'date', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: ['Reunião', 'Venda', 'Visita', 'Outros'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'status', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('eventos')
    app.delete(collection)
  },
)
