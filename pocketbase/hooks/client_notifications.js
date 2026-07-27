onRecordAfterUpdateSuccess((e) => {
  const cliente = e.record
  const atualizadoPor = cliente.getString('atualizado_por')
  if (!atualizadoPor) return e.next()

  try {
    const notifCol = $app.findCollectionByNameOrId('notificacoes')
    const notif = new Record(notifCol)
    notif.set('user', atualizadoPor)
    notif.set('titulo', 'Cliente Atualizado')
    notif.set('mensagem', 'O cliente "' + cliente.getString('fantasia') + '" foi atualizado.')
    notif.set('tipo', 'info')
    notif.set('lida', false)
    $app.save(notif)
  } catch (err) {
    $app.logger().error('client_notifications failed', 'error', err.message)
  }

  return e.next()
}, 'clientes')
