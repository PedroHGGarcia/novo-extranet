routerAdd(
  'PUT',
  '/backend/v1/projetos/update-with-propostas',
  (e) => {
    var body = e.requestInfo().body || {}
    var projetoId = body.projetoId || ''
    var nome = (body.nome || '').trim()
    var cliente = body.cliente || ''
    var descricao = body.descricao || ''
    var status = body.status || 'Em Andamento'
    var toLink = Array.isArray(body.toLink) ? body.toLink : []
    var toUnlink = Array.isArray(body.toUnlink) ? body.toUnlink : []

    if (!projetoId) {
      return e.badRequestError('ID do projeto é obrigatório.')
    }

    var userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Usuário não autenticado.')
    }

    var projetoRecord = null
    try {
      projetoRecord = $app.findRecordById('projetos', projetoId)
    } catch (_) {
      return e.notFoundError('Projeto não encontrado.')
    }

    var auditoriaCol = null
    try {
      auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    } catch (_) {}

    var linkedCount = 0
    var unlinkedCount = 0

    try {
      $app.runInTransaction((txApp) => {
        if (nome) projetoRecord.set('nome', nome)
        projetoRecord.set('descricao', descricao)
        if (cliente) projetoRecord.set('cliente', cliente)
        projetoRecord.set('status', status)
        txApp.save(projetoRecord)

        if (auditoriaCol) {
          try {
            var auditRec = new Record(auditoriaCol)
            auditRec.set('user', userId)
            auditRec.set('acao', 'Atualização de Projeto')
            auditRec.set('tabela', 'projetos')
            auditRec.set('registro_id', projetoId)
            auditRec.set('dados', {
              nome: nome,
              cliente: cliente,
              status: status,
              linked: toLink.length,
              unlinked: toUnlink.length,
            })
            txApp.save(auditRec)
          } catch (_) {}
        }

        for (var i = 0; i < toLink.length; i++) {
          var propId = toLink[i]
          var propRecord = txApp.findRecordById('propostas', propId)

          propRecord.set('projeto', projetoId)
          txApp.save(propRecord)
          linkedCount++

          if (auditoriaCol) {
            try {
              var auditProp = new Record(auditoriaCol)
              auditProp.set('user', userId)
              auditProp.set('acao', 'Vínculo de Projeto em Proposta')
              auditProp.set('tabela', 'propostas')
              auditProp.set('registro_id', propId)
              auditProp.set('dados', { projeto_id: projetoId })
              txApp.save(auditProp)
            } catch (_) {}
          }
        }

        for (var j = 0; j < toUnlink.length; j++) {
          var unpropId = toUnlink[j]
          var unpropRecord = txApp.findRecordById('propostas', unpropId)

          unpropRecord.set('projeto', null)
          txApp.save(unpropRecord)
          unlinkedCount++

          if (auditoriaCol) {
            try {
              var auditUnprop = new Record(auditoriaCol)
              auditUnprop.set('user', userId)
              auditUnprop.set('acao', 'Desvínculo de Projeto em Proposta')
              auditUnprop.set('tabela', 'propostas')
              auditUnprop.set('registro_id', unpropId)
              auditUnprop.set('dados', { projeto_id: projetoId })
              txApp.save(auditUnprop)
            } catch (_) {}
          }
        }
      })
    } catch (txErr) {
      var msg = txErr.message || 'Falha ao processar a atualização do projeto.'
      return e.badRequestError('Erro ao salvar projeto: ' + msg)
    }

    return e.json(200, {
      success: true,
      linkedCount: linkedCount,
      unlinkedCount: unlinkedCount,
    })
  },
  $apis.requireAuth(),
)
