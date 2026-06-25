migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    const tiposPropostaCol = app.findCollectionByNameOrId('tipos_proposta')

    col.fields.add(
      new RelationField({
        name: 'tipo_proposta',
        collectionId: tiposPropostaCol.id,
        maxSelect: 1,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('tipo_proposta')
    app.save(col)
  },
)
