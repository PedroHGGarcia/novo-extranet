migrate(
  (app) => {
    const clientes = app.findCollectionByNameOrId('clientes')

    const newFields = [
      new TextField({ name: 'razao_social' }),
      new TextField({ name: 'telefone_2' }),
      new TextField({ name: 'telefone_3' }),
      new EmailField({ name: 'email_fiscal' }),
      new TextField({ name: 'cep' }),
      new TextField({ name: 'estado' }),
      new TextField({ name: 'cidade' }),
      new TextField({ name: 'bairro' }),
      new TextField({ name: 'logradouro' }),
      new TextField({ name: 'numero' }),
      new TextField({ name: 'complementos' }),
    ]

    for (const field of newFields) {
      if (!clientes.fields.getByName(field.name)) {
        clientes.fields.add(field)
      }
    }
    app.save(clientes)

    const documentos = new Collection({
      name: 'documentos_clientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          required: true,
          collectionId: clientes.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'tipo', type: 'text', required: true },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documentos)
  },
  (app) => {
    try {
      const documentos = app.findCollectionByNameOrId('documentos_clientes')
      app.delete(documentos)
    } catch (_) {}

    const clientes = app.findCollectionByNameOrId('clientes')
    const fieldsToRemove = [
      'razao_social',
      'telefone_2',
      'telefone_3',
      'email_fiscal',
      'cep',
      'estado',
      'cidade',
      'bairro',
      'logradouro',
      'numero',
      'complementos',
    ]
    for (const f of fieldsToRemove) {
      try {
        clientes.fields.removeByName(f)
      } catch (_) {}
    }
    app.save(clientes)
  },
)
