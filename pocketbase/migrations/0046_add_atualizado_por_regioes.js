migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('regioes')
    col.fields.add(
      new RelationField({
        name: 'atualizado_por',
        collectionId: '_pb_users_auth_',
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('regioes')
    col.fields.removeByName('atualizado_por')
    app.save(col)
  },
)
