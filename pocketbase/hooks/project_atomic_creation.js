routerAdd(
  'POST',
  '/backend/v1/projetos/create-with-propostas',
  (e) => {
    let body = e.requestInfo().body || {}
    let nome = (body.nome || '').trim()
    let cliente = body.cliente || ''
    let descricao = body.descricao || ''
    let status = body.status || 'Em Andamento'
    let propostas = Array.isArray(body.propostas) ? body.propostas : []

    if (!nome) {
      return e.badRequestError('Nome do projeto é obrigatório.')
    }
    if (!cliente) {
      return e.badRequestError('Cliente é obrigatório.')
    }

    let userId = e.auth?.id
    if (!userId) {
      return e.unauthorizedError('Usuário não autenticado.')
    }

    let projetosCol = $app.findCollectionByNameOrId('projetos')
    let propostasCol = $app.findCollectionByNameOrId('propostas')
    let auditoriaCol = $app.findCollectionByNameOrId('auditoria')

    let createdProject = null

    try {
      $app.runInTransaction((txApp) => {
        let record = new Record(projetosCol)
        record.set('nome', nome)
        record.set('descricao', descricao)
        record.set('cliente', cliente)
        record.set('status', status)
        record.set('user', userId)

        txApp.save(record)
        createdProject = record

        try {
          let auditRec = new Record(auditoriaCol)
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
        } catch (auditErr) {
          // Silent catch for optional audit logging
        }

        if (propostas.length > 0) {
          for (let i = 0; i < propostas.length; i++) {
            let propId = propostas[i]
            let propRecord = txApp.findRecordById('propostas', propId)
            propRecord.set('projeto', record.id)
            txApp.save(propRecord)

            try {
              let auditProp = new Record(auditoriaCol)
              auditProp.set('user', userId)
              auditProp.set('acao', 'Vínculo de Projeto em Proposta')
              auditProp.set('tabela', 'propostas')
              auditProp.set('registro_id', propId)
              auditProp.set('dados', { projeto_id: record.id, projeto_nome: nome })
              txApp.save(auditProp)
            } catch (auditPropErr) {
              // Silent catch for optional audit logging
            }
          }
        }
      })
    } catch (txErr) {
      return e.badRequestError(
        'Erro ao salvar projeto: ' + (txErr.message || 'Falha ao processar a criação.'),
      )
    }

    try {
      $app.expandRecord(createdProject, ['cliente', 'user'])
    } catch (expErr) {
      // Ignore expand exception
    }

    return e.json(200, {
      success: true,
      projeto: createdProject,
      linkedCount: propostas.length,
    })
  },
  $apis.requireAuth(),
)
