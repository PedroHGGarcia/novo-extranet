migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('projeto')) {
      col.fields.add(
        new RelationField({
          name: 'projeto',
          collectionId: app.findCollectionByNameOrId('projetos').id,
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    const field = col.fields.getByName('projeto')
    if (field) {
      col.fields.remove(field)
    }
    app.save(col)
  },
)
