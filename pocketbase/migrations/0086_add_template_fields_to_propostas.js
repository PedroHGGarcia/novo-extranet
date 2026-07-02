migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')

    if (!col.fields.getByName('treinamento_tecnico'))
      col.fields.add(new TextField({ name: 'treinamento_tecnico' }))
    if (!col.fields.getByName('transporte_seguro'))
      col.fields.add(new TextField({ name: 'transporte_seguro' }))
    if (!col.fields.getByName('imposto_ipi')) col.fields.add(new TextField({ name: 'imposto_ipi' }))
    if (!col.fields.getByName('imposto_icms'))
      col.fields.add(new TextField({ name: 'imposto_icms' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')

    col.fields.removeByName('treinamento_tecnico')
    col.fields.removeByName('transporte_seguro')
    col.fields.removeByName('imposto_ipi')
    col.fields.removeByName('imposto_icms')

    app.save(col)
  },
)
