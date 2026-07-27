onRecordAfterUpdateSuccess((e) => {
  const projeto = e.record
  const userId = projeto.getString('user')
  if (!userId) return e.next()

  try {
    const notifCol = $app.findCollectionByNameOrId('notificacoes')
    const notif = new Record(notifCol)
    notif.set('user', userId)
    notif.set('titulo', 'Projeto Atualizado')
    notif.set('mensagem', 'O projeto "' + projeto.getString('nome') + '" foi atualizado.')
    notif.set('tipo', 'info')
    notif.set('lida', false)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('project_notifications failed', 'error', err.message)
  }

  return e.next()
}, 'projetos')
