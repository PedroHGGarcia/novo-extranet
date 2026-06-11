migrate(
  (app) => {
    const rules = "@request.auth.id != ''"

    const clientes = new Collection({
      name: 'clientes',
      type: 'base',
      listRule: rules,
      viewRule: rules,
      createRule: rules,
      updateRule: rules,
      deleteRule: rules,
      fields: [
        { name: 'fantasia', type: 'text', required: true },
        { name: 'contato', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'celular', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'dt_cad', type: 'text' },
        { name: 'status', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(clientes)

    const representantes = new Collection({
      name: 'representantes',
      type: 'base',
      listRule: rules,
      viewRule: rules,
      createRule: rules,
      updateRule: rules,
      deleteRule: rules,
      fields: [
        { name: 'fantasia', type: 'text', required: true },
        { name: 'sigla', type: 'text' },
        { name: 'telefone', type: 'text' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text' },
        { name: 'dt_cad', type: 'text' },
        { name: 'status', type: 'text', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(representantes)

    const prepostos = new Collection({
      name: 'prepostos',
      type: 'base',
      listRule: rules,
      viewRule: rules,
      createRule: rules,
      updateRule: rules,
      deleteRule: rules,
      fields: [
        { name: 'representante', type: 'text', required: true },
        { name: 'nome', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'telefone', type: 'text' },
        { name: 'dt_cad', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(prepostos)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('clientes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('representantes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('prepostos'))
    } catch (_) {}
  },
)
