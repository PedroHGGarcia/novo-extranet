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

    // Step 1: Save the project record directly — not inside a transaction.
    // In the current JSVM environment, $app.runInTransaction does not
    // reliably commit to disk, so we persist the project first.
    try {
      var record = new Record(projetosCol)
      record.set('nome', nome)
      record.set('descricao', descricao)
      record.set('cliente', cliente)
      record.set('status', status)
      record.set('user', userId)
      $app.save(record)
      createdProject = record
    } catch (saveErr) {
      var saveMsg = saveErr.message || 'Falha ao salvar o projeto.'
      return e.badRequestError('Erro ao salvar projeto: ' + saveMsg)
    }

    // Step 2: Write audit log for the project creation (best-effort).
    if (auditoriaCol) {
      try {
        var auditRec = new Record(auditoriaCol)
        auditRec.set('user', userId)
        auditRec.set('acao', 'Criação de Projeto')
        auditRec.set('tabela', 'projetos')
        auditRec.set('registro_id', createdProject.id)
        auditRec.set('dados', {
          nome: nome,
          cliente: cliente,
          status: status,
          total_propostas_vinculadas: propostas.length,
        })
        $app.save(auditRec)
      } catch (_) {}
    }

    // Step 3: Link proposals to the project.
    // Try transaction first; if it fails, fall back to individual saves.
    if (propostas.length > 0) {
      var txFailed = false
      try {
        $app.runInTransaction((txApp) => {
          for (var i = 0; i < propostas.length; i++) {
            var propId = propostas[i]
            var propRecord = txApp.findRecordById('propostas', propId)
            propRecord.set('projeto', createdProject.id)
            txApp.save(propRecord)
            linkedCount++

            if (auditoriaCol) {
              try {
                var auditProp = new Record(auditoriaCol)
                auditProp.set('user', userId)
                auditProp.set('acao', 'Vínculo de Projeto em Proposta')
                auditProp.set('tabela', 'propostas')
                auditProp.set('registro_id', propId)
                auditProp.set('dados', { projeto_id: createdProject.id, projeto_nome: nome })
                txApp.save(auditProp)
              } catch (_) {}
            }
          }
        })
      } catch (txErr) {
        txFailed = true
      }

      // Fallback: link proposals individually if the transaction failed.
      if (txFailed || linkedCount < propostas.length) {
        linkedCount = 0
        for (var j = 0; j < propostas.length; j++) {
          var fallbackPropId = propostas[j]
          try {
            var fallbackPropRecord = $app.findRecordById('propostas', fallbackPropId)
            fallbackPropRecord.set('projeto', createdProject.id)
            $app.save(fallbackPropRecord)
            linkedCount++

            if (auditoriaCol) {
              try {
                var auditFallback = new Record(auditoriaCol)
                auditFallback.set('user', userId)
                auditFallback.set('acao', 'Vínculo de Projeto em Proposta')
                auditFallback.set('tabela', 'propostas')
                auditFallback.set('registro_id', fallbackPropId)
                auditFallback.set('dados', { projeto_id: createdProject.id, projeto_nome: nome })
                $app.save(auditFallback)
              } catch (_) {}
            }
          } catch (individualErr) {
            // Skip this proposal but continue with the rest
          }
        }
      }
    }

    // Step 4: Expand relations for the response.
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
