onRecordCreateRequest((e) => {
  if (!e.record.getString('user') && e.auth?.id) {
    e.record.set('user', e.auth.id)
  }
  e.next()
}, 'propostas')
