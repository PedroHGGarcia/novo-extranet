migrate(
  (app) => {
    const collections = ['clientes', 'representantes', 'prepostos', 'gerentes']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)

      if (!col.fields.getByName('documento')) {
        col.fields.add(new TextField({ name: 'documento' }))
        col.addIndex(`idx_${name}_documento`, true, 'documento', "documento != ''")
        app.save(col)
      }
    }
  },
  (app) => {
    const collections = ['clientes', 'representantes', 'prepostos', 'gerentes']

    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name)
      if (col.fields.getByName('documento')) {
        col.removeIndex(`idx_${name}_documento`)
        col.fields.removeByName('documento')
        app.save(col)
      }
    }
  },
)
