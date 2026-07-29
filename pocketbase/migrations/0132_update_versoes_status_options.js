migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Ativo', 'Inativo', 'Fora de Linha', 'Em Revisão', 'Aprovado']
      statusField.maxSelect = 1
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')
    const statusField = col.fields.getByName('status')
    if (statusField) {
      statusField.values = ['Ativo', 'Inativo', 'Fora de Linha']
      statusField.maxSelect = 1
      app.save(col)
    }
  },
)
