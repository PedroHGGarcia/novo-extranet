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

    // Step 1: Save the project record directly — not inside a transaction.
    try {
      if (nome) projetoRecord.set('nome', nome)
      projetoRecord.set('descricao', descricao)
      if (cliente) projetoRecord.set('cliente', cliente)
      projetoRecord.set('status', status)
      $app.save(projetoRecord)
    } catch (saveErr) {
      var saveMsg = saveErr.message || 'Falha ao atualizar o projeto.'
      return e.badRequestError('Erro ao salvar projeto: ' + saveMsg)
    }

    // Step 2: Write audit log for the project update (best-effort).
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
        $app.save(auditRec)
      } catch (_) {}
    }

    // Step 3: Link proposals — try transaction first, fallback to individual saves.
    if (toLink.length > 0) {
      var txFailed = false
      try {
        $app.runInTransaction((txApp) => {
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
        })
      } catch (txErr) {
        txFailed = true
      }

      if (txFailed || linkedCount < toLink.length) {
        linkedCount = 0
        for (var j = 0; j < toLink.length; j++) {
          var fallbackPropId = toLink[j]
          try {
            var fallbackPropRecord = $app.findRecordById('propostas', fallbackPropId)
            fallbackPropRecord.set('projeto', projetoId)
            $app.save(fallbackPropRecord)
            linkedCount++

            if (auditoriaCol) {
              try {
                var auditFallback = new Record(auditoriaCol)
                auditFallback.set('user', userId)
                auditFallback.set('acao', 'Vínculo de Projeto em Proposta')
                auditFallback.set('tabela', 'propostas')
                auditFallback.set('registro_id', fallbackPropId)
                auditFallback.set('dados', { projeto_id: projetoId })
                $app.save(auditFallback)
              } catch (_) {}
            }
          } catch (individualErr) {
            // Skip this proposal but continue with the rest
          }
        }
      }
    }

    // Step 4: Unlink proposals — try transaction first, fallback to individual saves.
    if (toUnlink.length > 0) {
      var txFailedUnlink = false
      try {
        $app.runInTransaction((txApp) => {
          for (var k = 0; k < toUnlink.length; k++) {
            var unpropId = toUnlink[k]
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
      } catch (txErr2) {
        txFailedUnlink = true
      }

      if (txFailedUnlink || unlinkedCount < toUnlink.length) {
        unlinkedCount = 0
        for (var m = 0; m < toUnlink.length; m++) {
          var fallbackUnpropId = toUnlink[m]
          try {
            var fallbackUnpropRecord = $app.findRecordById('propostas', fallbackUnpropId)
            fallbackUnpropRecord.set('projeto', null)
            $app.save(fallbackUnpropRecord)
            unlinkedCount++

            if (auditoriaCol) {
              try {
                var auditUnlinkFallback = new Record(auditoriaCol)
                auditUnlinkFallback.set('user', userId)
                auditUnlinkFallback.set('acao', 'Desvínculo de Projeto em Proposta')
                auditUnlinkFallback.set('tabela', 'propostas')
                auditUnlinkFallback.set('registro_id', fallbackUnpropId)
                auditUnlinkFallback.set('dados', { projeto_id: projetoId })
                $app.save(auditUnlinkFallback)
              } catch (_) {}
            }
          } catch (individualErr2) {
            // Skip but continue
          }
        }
      }
    }

    return e.json(200, {
      success: true,
      linkedCount: linkedCount,
      unlinkedCount: unlinkedCount,
    })
  },
  $apis.requireAuth(),
)
