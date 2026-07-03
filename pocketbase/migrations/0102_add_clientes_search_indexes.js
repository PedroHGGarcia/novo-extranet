migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.addIndex('idx_clientes_fantasia', false, 'fantasia', '')
    col.addIndex('idx_clientes_razao_social', false, 'razao_social', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.removeIndex('idx_clientes_fantasia')
    col.removeIndex('idx_clientes_razao_social')
    app.save(col)
  },
)
