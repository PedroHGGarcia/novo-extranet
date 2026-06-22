migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    if (!col.fields.getByName('razao_social'))
      col.fields.add(new TextField({ name: 'razao_social' }))
    if (!col.fields.getByName('telefone_2')) col.fields.add(new TextField({ name: 'telefone_2' }))
    if (!col.fields.getByName('telefone_3')) col.fields.add(new TextField({ name: 'telefone_3' }))
    if (!col.fields.getByName('email_fiscal'))
      col.fields.add(new EmailField({ name: 'email_fiscal' }))
    if (!col.fields.getByName('cep')) col.fields.add(new TextField({ name: 'cep' }))
    if (!col.fields.getByName('estado')) col.fields.add(new TextField({ name: 'estado' }))
    if (!col.fields.getByName('cidade')) col.fields.add(new TextField({ name: 'cidade' }))
    if (!col.fields.getByName('bairro')) col.fields.add(new TextField({ name: 'bairro' }))
    if (!col.fields.getByName('logradouro')) col.fields.add(new TextField({ name: 'logradouro' }))
    if (!col.fields.getByName('numero')) col.fields.add(new TextField({ name: 'numero' }))
    if (!col.fields.getByName('complementos'))
      col.fields.add(new TextField({ name: 'complementos' }))

    app.save(col)

    const docs = new Collection({
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
          collectionId: col.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'tipo', type: 'text' },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(docs)
  },
  (app) => {
    try {
      const docs = app.findCollectionByNameOrId('documentos_clientes')
      app.delete(docs)
    } catch (e) {}

    const col = app.findCollectionByNameOrId('clientes')
    col.fields.removeByName('razao_social')
    col.fields.removeByName('telefone_2')
    col.fields.removeByName('telefone_3')
    col.fields.removeByName('email_fiscal')
    col.fields.removeByName('cep')
    col.fields.removeByName('estado')
    col.fields.removeByName('cidade')
    col.fields.removeByName('bairro')
    col.fields.removeByName('logradouro')
    col.fields.removeByName('numero')
    col.fields.removeByName('complementos')
    app.save(col)
  },
)
