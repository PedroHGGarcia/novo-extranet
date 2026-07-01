migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    if (!col.fields.getByName('modelo')) {
      const modelos = app.findCollectionByNameOrId('modelos')
      col.fields.add(
        new RelationField({
          name: 'modelo',
          collectionId: modelos.id,
          maxSelect: 1,
          required: false,
        }),
      )
      app.save(col)

      try {
        // Restore missing references by mapping back from modelo_txt string exact matches if they exist
        app
          .db()
          .newQuery(
            'UPDATE versoes SET modelo = modelo_txt WHERE modelo_txt IN (SELECT id FROM modelos)',
          )
          .execute()

        app
          .db()
          .newQuery(`
        UPDATE versoes 
        SET modelo = (SELECT id FROM modelos WHERE modelos.nome = versoes.modelo_txt LIMIT 1)
        WHERE modelo_txt IS NOT NULL AND modelo_txt != '' AND (modelo IS NULL OR modelo = '')
      `)
          .execute()
      } catch (_) {}
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    if (col.fields.getByName('modelo')) {
      col.fields.removeByName('modelo')
      app.save(col)
    }
  },
)
