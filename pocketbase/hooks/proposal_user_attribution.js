onRecordCreate((e) => {
  try {
    if (e && e.record && !e.record.get('user') && e.auth && e.auth.id) {
      e.record.set('user', e.auth.id)
    }
  } catch (_) {}
}, 'propostas')
