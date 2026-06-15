migrate(
  (app) => {
    const regioesCol = app.findCollectionByNameOrId('regioes')
    const gerentesCol = app.findCollectionByNameOrId('gerentes')

    try {
      app.findFirstRecordByData('regioes', 'nome', 'SUL')
    } catch (_) {
      const r1 = new Record(regioesCol)
      r1.set('nome', 'SUL')
      r1.set('uf', 'PR,SC,RS')
      r1.set('status', 'Ativo')
      app.save(r1)

      const r2 = new Record(regioesCol)
      r2.set('nome', 'SUDESTE')
      r2.set('uf', 'SP,RJ,MG,ES')
      r2.set('status', 'Ativo')
      app.save(r2)
    }

    try {
      app.findFirstRecordByData('gerentes', 'nome', 'Ricardo Silva')
    } catch (_) {
      const g1 = new Record(gerentesCol)
      g1.set('nome', 'Ricardo Silva')
      g1.set('email', 'ricardo@example.com')
      g1.set('telefone', '(11) 99999-9999')
      g1.set('status', 'Ativo')
      app.save(g1)

      const g2 = new Record(gerentesCol)
      g2.set('nome', 'Ana Souza')
      g2.set('email', 'ana@example.com')
      g2.set('telefone', '(11) 88888-8888')
      g2.set('status', 'Ativo')
      app.save(g2)
    }
  },
  (app) => {
    try {
      const r1 = app.findFirstRecordByData('regioes', 'nome', 'SUL')
      app.delete(r1)
    } catch (_) {}
    try {
      const r2 = app.findFirstRecordByData('regioes', 'nome', 'SUDESTE')
      app.delete(r2)
    } catch (_) {}
    try {
      const g1 = app.findFirstRecordByData('gerentes', 'nome', 'Ricardo Silva')
      app.delete(g1)
    } catch (_) {}
    try {
      const g2 = app.findFirstRecordByData('gerentes', 'nome', 'Ana Souza')
      app.delete(g2)
    } catch (_) {}
  },
)
