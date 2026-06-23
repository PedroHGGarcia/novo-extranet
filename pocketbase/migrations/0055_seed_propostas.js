migrate(
  (app) => {
    const propostas = app.findCollectionByNameOrId('propostas')

    const clientes = app.findRecordsByFilter('clientes', '1=1', '-created', 1)
    const versoes = app.findRecordsByFilter('versoes', '1=1', '-created', 1)
    const representantes = app.findRecordsByFilter('representantes', '1=1', '-created', 1)
    const users = app.findRecordsByFilter('users', '1=1', '-created', 1)

    if (clientes.length && versoes.length && representantes.length && users.length) {
      const r1 = new Record(propostas)
      r1.set('numero_proposta', '41157-A')
      r1.set('cliente', clientes[0].id)
      r1.set('contato', 'Sr. Everson')
      r1.set('telefone', '(14) 3302-2222')
      r1.set('versao', versoes[0].id)
      r1.set('representante', representantes[0].id)
      r1.set('nota_rep', 1)
      r1.set('dt_cad', '2026-06-23 10:00:00.000Z')
      r1.set('user', users[0].id)
      app.save(r1)

      const r2 = new Record(propostas)
      r2.set('numero_proposta', '41156-A')
      r2.set('cliente', clientes[0].id)
      r2.set('contato', 'Eduardo Coguetto')
      r2.set('telefone', '(11) 96431-8182')
      r2.set('versao', versoes[0].id)
      r2.set('representante', representantes[0].id)
      r2.set('nota_rep', 4)
      r2.set('dt_cad', '2026-06-23 10:00:00.000Z')
      r2.set('user', users[0].id)
      app.save(r2)
    }
  },
  (app) => {
    app
      .db()
      .newQuery("DELETE FROM propostas WHERE numero_proposta IN ('41157-A', '41156-A')")
      .execute()
  },
)
