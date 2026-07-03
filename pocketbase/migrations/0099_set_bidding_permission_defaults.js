migrate(
  (app) => {
    try {
      var admins = app.findRecordsByFilter('users', "role = 'admin'", '-created', 10000, 0)
      for (var i = 0; i < admins.length; i++) {
        admins[i].set('can_issue_bidding_proposals', true)
        app.save(admins[i])
      }
    } catch (e) {
      console.log('Failed to update admin bidding permissions', e)
    }

    try {
      var gerentes = app.findRecordsByFilter('gerentes', "usuario != ''", '-created', 10000, 0)
      for (var j = 0; j < gerentes.length; j++) {
        var userId = gerentes[j].getString('usuario')
        if (!userId) continue
        try {
          var userRecord = app.findRecordById('users', userId)
          userRecord.set('can_issue_bidding_proposals', true)
          app.save(userRecord)
        } catch (e2) {
          console.log('Failed to update gerente user bidding permission', e2)
        }
      }
    } catch (e) {
      console.log('Failed to update gerente bidding permissions', e)
    }
  },
  (app) => {
    try {
      var users = app.findRecordsByFilter('users', "role != 'admin'", '-created', 10000, 0)
      for (var i = 0; i < users.length; i++) {
        users[i].set('can_issue_bidding_proposals', false)
        app.save(users[i])
      }
    } catch (e) {
      console.log('Failed to revert bidding permissions', e)
    }
  },
)
