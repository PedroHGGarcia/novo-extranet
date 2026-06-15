migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    const statusField = col.fields.getByName('status')
    statusField.values = ['Ativo', 'Inativo', 'Em Revisão', 'Aprovado']
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    const statusField = col.fields.getByName('status')
    statusField.values = ['Ativo', 'Inativo']
    app.save(col)
  },
)
