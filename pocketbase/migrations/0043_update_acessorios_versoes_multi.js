migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    const field = col.fields.getByName('versoes')
    if (field) {
      field.maxSelect = 2147483647
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    const field = col.fields.getByName('versoes')
    if (field) {
      field.maxSelect = 1
      app.save(col)
    }
  },
)
