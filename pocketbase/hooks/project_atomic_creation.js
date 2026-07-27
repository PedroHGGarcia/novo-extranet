routerAdd(
  'POST',
  '/backend/v1/projetos/create-with-propostas',
  (e) => {
    var body = e.requestInfo().body || {}
    var nome = (body.nome || '').trim()
    var cliente = body.cliente || ''
    var descricao = body.descricao || ''
    var status = body.status || 'Em Andamento'
    var propostas = Array.isArray(body.propostas) ? body.propostas : []

    if (!nome) {
      return e.badRequestError('Nome do projeto é obrigatório.')
    }
    if (!cliente) {
      return e.badRequestError('Cliente é obrigatório.')
    }

    var userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Usuário não autenticado.')
    }

    var projetosCol = $app.findCollectionByNameOrId('projetos')
    var auditoriaCol = null
    try {
      auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    } catch (_) {}

    var createdProject = null
    var linkedCount = 0

    try {
      $app.runInTransaction((txApp) => {
        var record = new Record(projetosCol)
        record.set('nome', nome)
        record.set('descricao', descricao)
        record.set('cliente', cliente)
        record.set('status', status)
        record.set('user', userId)

        txApp.save(record)
        createdProject = record

        if (auditoriaCol) {
          try {
            var auditRec = new Record(auditoriaCol)
            auditRec.set('user', userId)
            auditRec.set('acao', 'Criação de Projeto')
            auditRec.set('tabela', 'projetos')
            auditRec.set('registro_id', record.id)
            auditRec.set('dados', {
              nome: nome,
              cliente: cliente,
              status: status,
              total_propostas_vinculadas: propostas.length,
            })
            txApp.save(auditRec)
          } catch (_) {}
        }

        for (var i = 0; i < propostas.length; i++) {
          var propId = propostas[i]
          var propRecord = txApp.findRecordById('propostas', propId)

          propRecord.set('projeto', record.id)
          txApp.save(propRecord)
          linkedCount++

          if (auditoriaCol) {
            try {
              var auditProp = new Record(auditoriaCol)
              auditProp.set('user', userId)
              auditProp.set('acao', 'Vínculo de Projeto em Proposta')
              auditProp.set('tabela', 'propostas')
              auditProp.set('registro_id', propId)
              auditProp.set('dados', { projeto_id: record.id, projeto_nome: nome })
              txApp.save(auditProp)
            } catch (_) {}
          }
        }
      })
    } catch (txErr) {
      var msg = txErr.message || 'Falha ao processar a criação do projeto.'
      return e.badRequestError('Erro ao salvar projeto: ' + msg)
    }

    try {
      if (createdProject) {
        $app.expandRecord(createdProject, ['cliente', 'user'])
      }
    } catch (_) {}

    return e.json(200, {
      success: true,
      projeto: createdProject,
      linkedCount: linkedCount,
    })
  },
  $apis.requireAuth(),
)
