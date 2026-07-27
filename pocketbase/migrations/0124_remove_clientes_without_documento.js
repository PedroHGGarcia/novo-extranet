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

    var totalDeleted = 0

    for (var i = 0; i < clientesSemDocumento.length; i++) {
      var clienteId = clientesSemDocumento[i].id

      app
        .db()
        .newQuery('DELETE FROM documentos_clientes WHERE cliente = {:id}')
        .bind({ id: clienteId })
        .execute()

      app
        .db()
        .newQuery(
          'UPDATE propostas SET projeto = NULL WHERE projeto IN (SELECT id FROM projetos WHERE cliente = {:id})',
        )
        .bind({ id: clienteId })
        .execute()

      app
        .db()
        .newQuery('UPDATE propostas SET cliente = NULL WHERE cliente = {:id}')
        .bind({ id: clienteId })
        .execute()

      app
        .db()
        .newQuery('DELETE FROM projetos WHERE cliente = {:id}')
        .bind({ id: clienteId })
        .execute()

      app.db().newQuery('DELETE FROM clientes WHERE id = {:id}').bind({ id: clienteId }).execute()

      totalDeleted++
    }

    console.log('0124: Concluído — ' + totalDeleted + ' clientes sem documento removidos.')
  },
  (app) => {
    // Downgrade not possible — deletions are permanent
  },
)
