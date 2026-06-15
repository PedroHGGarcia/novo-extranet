migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    if (!col.fields.getByName('especificacoes_tecnicas')) {
      col.fields.add(new TextField({ name: 'especificacoes_tecnicas' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    col.fields.removeByName('especificacoes_tecnicas')
    app.save(col)
  },
)
