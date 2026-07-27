onRecordUpdate((e) => {
  const originalUser = e.record.original().getString('user')
  if (originalUser) {
    e.record.set('user', originalUser)
  }
  e.next()
}, 'projetos')
