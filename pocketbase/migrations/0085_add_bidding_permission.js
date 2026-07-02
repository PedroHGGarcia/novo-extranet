migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('can_issue_bidding_proposals')) {
      users.fields.add(new BoolField({ name: 'can_issue_bidding_proposals' }))
    }
    app.save(users)

    try {
      app
        .db()
        .newQuery(
          'UPDATE users SET can_issue_bidding_proposals = 0 WHERE can_issue_bidding_proposals IS NULL',
        )
        .execute()
    } catch (e) {
      console.log('Failed to set default values for can_issue_bidding_proposals', e)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('can_issue_bidding_proposals')
    app.save(users)
  },
)
