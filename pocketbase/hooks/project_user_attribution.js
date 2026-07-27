onRecordCreateRequest((e) => {
  if (!e.record.get('user') && e.auth?.id) {
    e.record.set('user', e.auth.id)
  }
  e.next()
}, 'projetos')

onRecordUpdateRequest((e) => {
  var originalUser = e.record.original().getString('user')
  if (originalUser) {
    e.record.set('user', originalUser)
  } else if (e.auth?.id) {
    e.record.set('user', e.auth.id)
  }
  e.next()
}, 'projetos')
