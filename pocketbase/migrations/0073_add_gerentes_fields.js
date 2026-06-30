migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('gerentes')

    if (!col.fields.getByName('cargo')) {
      col.fields.add(new TextField({ name: 'cargo' }))
    }
    if (!col.fields.getByName('rd_station_id')) {
      col.fields.add(new TextField({ name: 'rd_station_id' }))
    }
    if (!col.fields.getByName('usuario')) {
      col.fields.add(
        new RelationField({ name: 'usuario', collectionId: '_pb_users_auth_', maxSelect: 1 }),
      )
    }

    col.addIndex('idx_gerentes_usuario', false, 'usuario', '')
    col.addIndex('idx_gerentes_rd_station_id', false, 'rd_station_id', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('gerentes')
    col.fields.removeByName('cargo')
    col.fields.removeByName('rd_station_id')
    col.fields.removeByName('usuario')
    col.removeIndex('idx_gerentes_usuario')
    col.removeIndex('idx_gerentes_rd_station_id')
    app.save(col)
  },
)
