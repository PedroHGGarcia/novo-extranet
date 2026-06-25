migrate(
  (app) => {
    const rules = "@request.auth.id != ''"

    const collection = new Collection({
      name: 'tipos_proposta',
      type: 'base',
      listRule: rules,
      viewRule: rules,
      createRule: rules,
      updateRule: rules,
      deleteRule: rules,
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'tem_fator', type: 'bool' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_tipos_proposta_nome ON tipos_proposta (nome)'],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('tipos_proposta')
      app.delete(collection)
    } catch (_) {}
  },
)
