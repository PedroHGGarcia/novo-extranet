migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('produtos')

    if (!col.fields.getByName('descricao')) {
      col.fields.add(new TextField({ name: 'descricao' }))
    }
    if (!col.fields.getByName('especificacoes')) {
      col.fields.add(new JSONField({ name: 'especificacoes' }))
    }
    if (!col.fields.getByName('fotos')) {
      col.fields.add(
        new FileField({
          name: 'fotos',
          maxSelect: 10,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('produtos')

    col.fields.removeByName('descricao')
    col.fields.removeByName('especificacoes')
    col.fields.removeByName('fotos')

    app.save(col)
  },
)
