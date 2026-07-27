onRecordCreate((e) => {
  try {
    if (e && e.record) {
      if (!e.record.get('user')) {
        if (e.auth && e.auth.id) {
          e.record.set('user', e.auth.id)
        }
      }
    }
  } catch (_) {}
}, 'projetos')

onRecordUpdate((e) => {
  try {
    if (e && e.record) {
      var originalUser = ''
      try {
        if (e.record.original()) {
          originalUser =
            e.record.original().getString('user') || e.record.original().get('user') || ''
        }
      } catch (_) {}

      if (originalUser) {
        e.record.set('user', originalUser)
      } else if (e.auth && e.auth.id) {
        e.record.set('user', e.auth.id)
      }
    }
  } catch (_) {}
}, 'projetos')
