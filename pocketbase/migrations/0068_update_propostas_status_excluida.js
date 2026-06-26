migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Em Análise', 'Aprovada', 'Recusada', 'Excluída'],
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.add(
      new SelectField({
        name: 'status',
        values: ['Em Análise', 'Aprovada', 'Recusada'],
      }),
    )
    app.save(col)
  },
)
