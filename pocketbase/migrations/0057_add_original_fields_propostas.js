migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')

    if (!col.fields.getByName('cliente_original')) {
      col.fields.add(new TextField({ name: 'cliente_original' }))
    }
    if (!col.fields.getByName('versao_original')) {
      col.fields.add(new TextField({ name: 'versao_original' }))
    }
    if (!col.fields.getByName('representante_original')) {
      col.fields.add(new TextField({ name: 'representante_original' }))
    }
    if (!col.fields.getByName('gerente_original')) {
      col.fields.add(new TextField({ name: 'gerente_original' }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('cliente_original')
    col.fields.removeByName('versao_original')
    col.fields.removeByName('representante_original')
    col.fields.removeByName('gerente_original')
    app.save(col)
  },
)
