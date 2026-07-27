migrate(
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    clientesCol.addIndex('idx_clientes_status_created', false, 'status, created DESC', '')
    app.save(clientesCol)

    const propostasCol = app.findCollectionByNameOrId('propostas')
    propostasCol.addIndex('idx_propostas_cliente_status', false, 'cliente, status', '')
    propostasCol.addIndex('idx_propostas_rep_status', false, 'representante, status', '')
    propostasCol.addIndex('idx_propostas_dt_cad_status', false, 'dt_cad, status', '')
    app.save(propostasCol)

    const projetosCol = app.findCollectionByNameOrId('projetos')
    projetosCol.addIndex('idx_projetos_cliente_status', false, 'cliente, status', '')
    app.save(projetosCol)

    const versoesCol = app.findCollectionByNameOrId('versoes')
    versoesCol.addIndex('idx_versoes_modelo_status', false, 'modelo, status', '')
    app.save(versoesCol)
  },
  (app) => {
    const clientesCol = app.findCollectionByNameOrId('clientes')
    clientesCol.removeIndex('idx_clientes_status_created')
    app.save(clientesCol)

    const propostasCol = app.findCollectionByNameOrId('propostas')
    propostasCol.removeIndex('idx_propostas_cliente_status')
    propostasCol.removeIndex('idx_propostas_rep_status')
    propostasCol.removeIndex('idx_propostas_dt_cad_status')
    app.save(propostasCol)

    const projetosCol = app.findCollectionByNameOrId('projetos')
    projetosCol.removeIndex('idx_projetos_cliente_status')
    app.save(projetosCol)

    const versoesCol = app.findCollectionByNameOrId('versoes')
    versoesCol.removeIndex('idx_versoes_modelo_status')
    app.save(versoesCol)
  },
)
