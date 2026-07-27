onRecordCreateRequest((e) => {
  if (!e.auth || !e.auth.id) {
    return e.unauthorizedError('Usuário não autenticado')
  }
  e.record.set('user', e.auth.id)
  e.next()
}, 'projetos')
