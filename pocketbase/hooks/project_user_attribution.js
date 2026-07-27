onRecordCreateRequest((e) => {
  if (e.auth?.id) {
    e.record.set('user', e.auth.id)
  }
  e.next()
}, 'projetos')

onRecordUpdateRequest((e) => {
  const originalUser = e.record.original().getString('user')
  if (originalUser) {
    e.record.set('user', originalUser)
  } else if (e.auth?.id) {
    e.record.set('user', e.auth.id)
  }
  e.next()
}, 'projetos')
