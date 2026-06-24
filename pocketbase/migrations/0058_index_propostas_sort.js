migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.addIndex('idx_propostas_dt_cad', false, 'dt_cad', '')
    col.addIndex('idx_propostas_numero', false, 'numero_proposta', '')
    col.addIndex('idx_propostas_valor', false, 'valor_final', '')
    col.addIndex('idx_propostas_created', false, 'created', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.removeIndex('idx_propostas_dt_cad')
    col.removeIndex('idx_propostas_numero')
    col.removeIndex('idx_propostas_valor')
    col.removeIndex('idx_propostas_created')
    app.save(col)
  },
)
