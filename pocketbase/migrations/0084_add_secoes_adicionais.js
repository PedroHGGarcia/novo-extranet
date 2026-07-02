migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('secoes_adicionais'))
      col.fields.add(new JSONField({ name: 'secoes_adicionais' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('secoes_adicionais')
    app.save(col)
  },
)
