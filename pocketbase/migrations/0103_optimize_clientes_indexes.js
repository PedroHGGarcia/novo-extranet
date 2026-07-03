migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.addIndex('idx_clientes_doc_opt', false, 'documento', '')
    col.addIndex('idx_clientes_fan_opt', false, 'fantasia', '')
    col.addIndex('idx_clientes_raz_opt', false, 'razao_social', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.removeIndex('idx_clientes_doc_opt')
    col.removeIndex('idx_clientes_fan_opt')
    col.removeIndex('idx_clientes_raz_opt')
    app.save(col)
  },
)
