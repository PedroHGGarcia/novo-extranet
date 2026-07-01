migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('assinatura_representante')) {
      col.fields.add(
        new FileField({
          name: 'assinatura_representante',
          maxSelect: 1,
          maxSize: 1048576,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('propostas')
      col.fields.removeByName('assinatura_representante')
      app.save(col)
    } catch (e) {}
  },
)
