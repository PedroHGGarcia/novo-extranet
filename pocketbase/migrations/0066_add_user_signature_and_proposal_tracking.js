/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('assinatura')) {
      users.fields.add(
        new FileField({
          name: 'assinatura',
          maxSelect: 1,
          maxSize: 1048576,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }
    app.save(users)

    const propostas = app.findCollectionByNameOrId('propostas')
    if (!propostas.fields.getByName('status')) {
      propostas.fields.add(
        new SelectField({
          name: 'status',
          values: ['Em Análise', 'Aprovada', 'Recusada'],
          maxSelect: 1,
        }),
      )
    }

    if (!propostas.fields.getByName('data_alteracao_status')) {
      propostas.fields.add(new DateField({ name: 'data_alteracao_status' }))
    }
    app.save(propostas)
  },
  (app) => {
    try {
      const users = app.findCollectionByNameOrId('users')
      users.fields.removeByName('assinatura')
      app.save(users)
    } catch (e) {}

    try {
      const propostas = app.findCollectionByNameOrId('propostas')
      propostas.fields.removeByName('status')
      propostas.fields.removeByName('data_alteracao_status')
      app.save(propostas)
    } catch (e) {}
  },
)
