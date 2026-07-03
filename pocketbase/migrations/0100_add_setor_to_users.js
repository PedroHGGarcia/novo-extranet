migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    if (!users.fields.getByName('setor')) {
      users.fields.add(
        new TextField({
          name: 'setor',
        }),
      )
    }

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('setor')
    app.save(users)
  },
)
