migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('percentual_desconto')) {
      col.fields.add(new NumberField({ name: 'percentual_desconto' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (col.fields.getByName('percentual_desconto')) {
      col.fields.removeByName('percentual_desconto')
    }
    app.save(col)
  },
)
