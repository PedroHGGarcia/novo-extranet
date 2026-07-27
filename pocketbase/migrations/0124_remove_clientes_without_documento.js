migrate(
  (app) => {
    var clientesSemDocumento = app.findRecordsByFilter(
      'clientes',
      'documento = "" || documento = null',
      '-created',
      10000,
      0,
    )

    if (clientesSemDocumento.length === 0) {
      console.log('0124: Nenhum cliente sem documento encontrado. Pulando execução.')
      return
    }

    var adminUserId = ''
    try {
      var admins = app.findRecordsByFilter('users', "role = 'admin'", '-created', 1, 0)
      if (admins.length > 0) adminUserId = admins[0].id
    } catch (_) {}

    var auditoriaCol = app.findCollectionByNameOrId('auditoria')

    var totalDeleted = 0
    var totalDocsDeleted = 0
    var totalPropostasUpdated = 0
    var totalProjetosDeleted = 0

    app.runInTransaction(function (txApp) {
      for (var i = 0; i < clientesSemDocumento.length; i++) {
        var cliente = clientesSemDocumento[i]
        var clienteId = cliente.id

        var docs = txApp.findRecordsByFilter(
          'documentos_clientes',
          "cliente = '" + clienteId + "'",
          '-created',
          10000,
          0,
        )
        for (var d = 0; d < docs.length; d++) {
          txApp.delete(docs[d])
          totalDocsDeleted++
        }

        var projetos = txApp.findRecordsByFilter(
          'projetos',
          "cliente = '" + clienteId + "'",
          '-created',
          10000,
          0,
        )

        var projetoIds = []
        for (var pr = 0; pr < projetos.length; pr++) {
          projetoIds.push(projetos[pr].id)
        }

        for (var pi = 0; pi < projetoIds.length; pi++) {
          var propostasDoProjeto = txApp.findRecordsByFilter(
            'propostas',
            "projeto = '" + projetoIds[pi] + "'",
            '-created',
            10000,
            0,
          )
          for (var pp = 0; pp < propostasDoProjeto.length; pp++) {
            propostasDoProjeto[pp].set('projeto', null)
            txApp.save(propostasDoProjeto[pp])
            totalPropostasUpdated++
          }
        }

        var propostas = txApp.findRecordsByFilter(
          'propostas',
          "cliente = '" + clienteId + "'",
          '-created',
          10000,
          0,
        )
        for (var p = 0; p < propostas.length; p++) {
          propostas[p].set('cliente', null)
          txApp.save(propostas[p])
          totalPropostasUpdated++
        }

        for (var pd = 0; pd < projetos.length; pd++) {
          if (adminUserId) {
            var projAuditRec = new Record(auditoriaCol)
            projAuditRec.set('user', adminUserId)
            projAuditRec.set('acao', 'delete')
            projAuditRec.set('tabela', 'projetos')
            projAuditRec.set('registro_id', projetos[pd].id)
            projAuditRec.set('dados', {
              nome: projetos[pd].getString('nome') || '',
              cliente_id: clienteId,
              id: projetos[pd].id,
            })
            txApp.save(projAuditRec)
          }
          txApp.delete(projetos[pd])
          totalProjetosDeleted++
        }

        if (adminUserId) {
          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', adminUserId)
          auditRec.set('acao', 'delete')
          auditRec.set('tabela', 'clientes')
          auditRec.set('registro_id', clienteId)
          auditRec.set('dados', {
            fantasia: cliente.getString('fantasia') || '',
            documento: cliente.getString('documento') || '',
            razao_social: cliente.getString('razao_social') || '',
            id: clienteId,
          })
          txApp.save(auditRec)
        }

        txApp.delete(cliente)
        totalDeleted++
      }
    })

    console.log(
      '0124: Concluído — ' +
        totalDeleted +
        ' clientes removidos, ' +
        totalDocsDeleted +
        ' documentos_clientes excluídos, ' +
        totalPropostasUpdated +
        ' propostas atualizadas, ' +
        totalProjetosDeleted +
        ' projetos excluídos.',
    )
  },
  (app) => {
    // Downgrade not possible — deletions are permanent
  },
)
