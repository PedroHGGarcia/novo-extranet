migrate(
  (app) => {
    const versoes = app.findCollectionByNameOrId('versoes')
    if (!versoes.fields.getByName('valor_anterior'))
      versoes.fields.add(new NumberField({ name: 'valor_anterior' }))
    if (!versoes.fields.getByName('data_ultimo_reajuste'))
      versoes.fields.add(new DateField({ name: 'data_ultimo_reajuste' }))
    app.save(versoes)

    const acessorios = app.findCollectionByNameOrId('acessorios')
    if (!acessorios.fields.getByName('valor_anterior'))
      acessorios.fields.add(new NumberField({ name: 'valor_anterior' }))
    if (!acessorios.fields.getByName('data_ultimo_reajuste'))
      acessorios.fields.add(new DateField({ name: 'data_ultimo_reajuste' }))
    if (!acessorios.fields.getByName('atualizado_por'))
      acessorios.fields.add(
        new RelationField({
          name: 'atualizado_por',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    app.save(acessorios)
  },
  (app) => {
    const versoes = app.findCollectionByNameOrId('versoes')
    versoes.fields.removeByName('valor_anterior')
    versoes.fields.removeByName('data_ultimo_reajuste')
    app.save(versoes)

    const acessorios = app.findCollectionByNameOrId('acessorios')
    acessorios.fields.removeByName('valor_anterior')
    acessorios.fields.removeByName('data_ultimo_reajuste')
    acessorios.fields.removeByName('atualizado_por')
    app.save(acessorios)
  },
)
