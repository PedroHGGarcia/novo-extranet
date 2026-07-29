migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')

    if (!col.fields.getByName('pdf_anexo')) {
      col.fields.add(
        new FileField({
          name: 'pdf_anexo',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('propostas')
      col.fields.removeByName('pdf_anexo')
      app.save(col)
    } catch (e) {}
  },
)
