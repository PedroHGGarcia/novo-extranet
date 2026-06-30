migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('regioes')

    if (!col.fields.getByName('estados_selecionados')) {
      col.fields.add(new JSONField({ name: 'estados_selecionados' }))
    }
    if (!col.fields.getByName('cidades_selecionadas')) {
      col.fields.add(new JSONField({ name: 'cidades_selecionadas' }))
    }

    const statusField = col.fields.getByName('status')
    if (statusField && statusField.type !== 'select') {
      try {
        app.db().newQuery('ALTER TABLE regioes ADD COLUMN temp_status TEXT').execute()
        app.db().newQuery('UPDATE regioes SET temp_status = status').execute()

        col.fields.removeByName('status')
        col.fields.add(
          new SelectField({ name: 'status', values: ['Ativo', 'Inativo'], required: true }),
        )
        app.save(col)

        app.db().newQuery('UPDATE regioes SET status = temp_status').execute()
        app.db().newQuery('ALTER TABLE regioes DROP COLUMN temp_status').execute()
      } catch (e) {
        console.log('Error updating status field type:', e)
        app.save(col)
      }
    } else {
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('regioes')
    if (col.fields.getByName('estados_selecionados')) {
      col.fields.removeByName('estados_selecionados')
    }
    if (col.fields.getByName('cidades_selecionadas')) {
      col.fields.removeByName('cidades_selecionadas')
    }
    app.save(col)
  },
)
