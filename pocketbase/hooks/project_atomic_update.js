onRecordUpdate((e) => {
  if (!e.record) return e.next()

  var oldStatus = ''
  var newStatus = e.record.getString('status') || ''

  try {
    if (e.record.original()) {
      oldStatus = e.record.original().getString('status') || ''
    }
  } catch (_) {}

  if (oldStatus && newStatus && oldStatus !== newStatus) {
    if (oldStatus === 'Concluído' && newStatus === 'Em Andamento') {
      throw new BadRequestError(
        'Transição de status inválida: não é possível voltar de "Concluído" para "Em Andamento"',
      )
    }
    if (oldStatus === 'Cancelado' && newStatus === 'Em Andamento') {
      throw new BadRequestError(
        'Transição de status inválida: não é possível voltar de "Cancelado" para "Em Andamento"',
      )
    }
  }

  var userId = ''
  if (e.auth && e.auth.id) {
    userId = e.auth.id
  } else if (e.record.get('user')) {
    userId = e.record.get('user')
  }

  if (userId) {
    try {
      var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
      var auditRec = new Record(auditoriaCol)
      auditRec.set('user', userId)
      auditRec.set('acao', 'Atualização de Projeto')
      auditRec.set('tabela', 'projetos')
      auditRec.set('registro_id', e.record.id)

      var changes = {}
      var fields = ['nome', 'descricao', 'cliente', 'status', 'ooo']
      for (var i = 0; i < fields.length; i++) {
        var field = fields[i]
        var oldVal = ''
        var newVal = e.record.get(field) || ''
        try {
          if (e.record.original()) {
            oldVal = e.record.original().get(field) || ''
          }
        } catch (_) {}
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[field] = { old: oldVal, new: newVal }
        }
      }
      auditRec.set('dados', changes)
      $app.save(auditRec)
    } catch (_) {}
  }

  e.next()
}, 'projetos')
