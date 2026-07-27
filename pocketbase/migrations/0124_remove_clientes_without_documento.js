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
    var totalProjetosUpdated = 0

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

        var projetos = txApp.findRecordsByFilter(
          'projetos',
          "cliente = '" + clienteId + "'",
          '-created',
          10000,
          0,
        )
        for (var pr = 0; pr < projetos.length; pr++) {
          projetos[pr].set('cliente', null)
          txApp.save(projetos[pr])
          totalProjetosUpdated++
        }

        var auditRec = new Record(auditoriaCol)
        if (adminUserId) {
          auditRec.set('user', adminUserId)
        } else {
          continue
        }
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
        totalProjetosUpdated +
        ' projetos atualizados.',
    )
  },
  (app) => {
    // Downgrade not possible — deletions are permanent
  },
)
