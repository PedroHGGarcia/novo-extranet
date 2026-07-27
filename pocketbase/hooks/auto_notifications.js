onRecordAfterCreateSuccess((e) => {
  const proposta = e.record
  const userId = proposta.getString('user')
  if (!userId) return e.next()

  try {
    const users = $app.findRecordsByFilter('users', "role = 'admin' || role = 'user'", '', 100, 0)
    const notifCol = $app.findCollectionByNameOrId('notificacoes')

    for (const u of users) {
      const notif = new Record(notifCol)
      notif.set('user', u.id)
      notif.set('titulo', 'Nova Proposta Criada')
      notif.set('mensagem', 'Proposta ' + proposta.getString('numero_proposta') + ' foi criada.')
      notif.set('tipo', 'info')
      notif.set('lida', false)
      $app.save(notif)
    }
  } catch (err) {
    $app.logger().error('auto_notifications create failed', 'error', err.message)
  }

  return e.next()
}, 'propostas')

onRecordAfterUpdateSuccess((e) => {
  const proposta = e.record
  const statusChanged = proposta.getString('status') !== proposta.original().getString('status')
  if (!statusChanged) return e.next()

  const userId = proposta.getString('user')
  if (!userId) return e.next()

  try {
    const notifCol = $app.findCollectionByNameOrId('notificacoes')
    const status = proposta.getString('status')
    const titulo =
      status === 'Aprovada'
        ? 'Proposta Aprovada'
        : status === 'Recusada'
          ? 'Proposta Recusada'
          : 'Status da Proposta Alterado'
    const mensagem =
      'A proposta ' +
      proposta.getString('numero_proposta') +
      ' teve o status alterado para: ' +
      status +
      '.'

    const notif = new Record(notifCol)
    notif.set('user', userId)
    notif.set('titulo', titulo)
    notif.set('mensagem', mensagem)
    notif.set('tipo', status === 'Aprovada' ? 'sucesso' : 'alerta')
    notif.set('lida', false)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('auto_notifications update failed', 'error', err.message)
  }

  return e.next()
}, 'propostas')
