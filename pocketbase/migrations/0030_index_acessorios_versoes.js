migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    col.addIndex('idx_acessorios_versoes', false, 'versoes', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    col.removeIndex('idx_acessorios_versoes')
    app.save(col)
  },
)
