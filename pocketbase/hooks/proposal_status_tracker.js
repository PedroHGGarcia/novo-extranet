onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (newStatus && oldStatus !== newStatus) {
    let isClientSignature = false
    try {
      isClientSignature = e.findUploadedFiles('assinatura_cliente').length > 0
    } catch (_) {}

    if (!isClientSignature && !e.hasSuperuserAuth()) {
      const proposalOwner = e.record.getString('user')
      if (e.auth && e.auth.id !== proposalOwner) {
        e.badRequestError('Apenas o criador da proposta pode alterar seu status')
        return
      }
    }

    e.record.set('data_alteracao_status', new Date().toISOString())
    if (e.auth?.id) {
      e.record.set('ultimo_usuario_status', e.auth.id)
    }
  }

  e.next()
}, 'propostas')

onRecordCreateRequest((e) => {
  if (e.record.getString('status')) {
    e.record.set('data_alteracao_status', new Date().toISOString())
    if (e.auth?.id) {
      e.record.set('ultimo_usuario_status', e.auth.id)
    }
  }
  e.next()
}, 'propostas')

onRecordAfterUpdateSuccess((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')
  const adminOrUser = e.auth?.id || null

  if (newStatus && oldStatus !== newStatus && adminOrUser) {
    try {
      const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
      auditoria.set('user', adminOrUser)
      auditoria.set('acao', `Status updated to ${newStatus}`)
      auditoria.set('tabela', 'propostas')
      auditoria.set('registro_id', e.record.id)
      auditoria.set('dados', { old_status: oldStatus, new_status: newStatus })
      $app.saveNoValidate(auditoria)
    } catch (err) {
      console.log('Erro ao salvar auditoria de status', err.message)
    }

    try {
      const proposalOwner = e.record.getString('user')
      if (proposalOwner) {
        var notifCol = $app.findCollectionByNameOrId('notificacoes')
        var notif = new Record(notifCol)
        notif.set('user', proposalOwner)
        notif.set('titulo', 'Status da Proposta Atualizado')
        notif.set(
          'mensagem',
          'A proposta ' +
            e.record.getString('numero_proposta') +
            ' teve seu status alterado de "' +
            oldStatus +
            '" para "' +
            newStatus +
            '".',
        )
        notif.set('lida', false)
        var notifTipo = 'info'
        if (newStatus === 'Aprovada') notifTipo = 'sucesso'
        else if (newStatus === 'Recusada' || newStatus === 'Exclu\u00edda') notifTipo = 'alerta'
        notif.set('tipo', notifTipo)
        $app.saveNoValidate(notif)
      }
    } catch (notifErr) {
      console.log('Erro ao salvar notificacao de status', notifErr.message)
    }
  }
  return e.next()
}, 'propostas')

onRecordAfterCreateSuccess((e) => {
  const newStatus = e.record.getString('status')
  const adminOrUser = e.auth?.id || null

  if (newStatus && adminOrUser) {
    try {
      const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
      auditoria.set('user', adminOrUser)
      auditoria.set('acao', `Status updated to ${newStatus}`)
      auditoria.set('tabela', 'propostas')
      auditoria.set('registro_id', e.record.id)
      auditoria.set('dados', { old_status: '', new_status: newStatus })
      $app.saveNoValidate(auditoria)
    } catch (err) {
      console.log('Erro ao salvar auditoria de status', err.message)
    }
  }
  return e.next()
}, 'propostas')
