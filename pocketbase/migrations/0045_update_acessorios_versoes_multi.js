migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    if (col) {
      const field = col.fields.getByName('versoes')
      if (field) {
        field.maxSelect = 1000
        col.fields.add(field)
        app.save(col)
      }
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    if (col) {
      const field = col.fields.getByName('versoes')
      if (field) {
        field.maxSelect = 1
        col.fields.add(field)
        app.save(col)
      }
    }
  },
)
