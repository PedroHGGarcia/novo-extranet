migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_proposta')
    if (!col.fields.getByName('acessorios_default')) {
      col.fields.add(new JSONField({ name: 'acessorios_default' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_proposta')
    col.fields.removeByName('acessorios_default')
    app.save(col)
  },
)
