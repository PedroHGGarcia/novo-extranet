migrate(
  (app) => {
    let affectedCount = 0

    const acessorios = app.findRecordsByFilter(
      'acessorios',
      "moeda != 'BRL' && moeda != 'USD' && moeda != 'EUR' && moeda != ''",
      '',
      10000,
      0,
    )
    for (const a of acessorios) {
      let m = a.getString('moeda')
      if (m === 'Dolar' || m === 'US$' || m === 'Dólar' || m === 'dolar' || m === 'dólar') {
        a.set('moeda', 'USD')
      } else if (m === 'Real' || m === 'real') {
        a.set('moeda', 'BRL')
      } else if (m === 'Euro' || m === 'euro') {
        a.set('moeda', 'EUR')
      } else {
        a.set('moeda', 'BRL')
      }
      app.saveNoValidate(a)
      affectedCount++
    }

    const versoes = app.findRecordsByFilter(
      'versoes',
      "moeda != 'BRL' && moeda != 'USD' && moeda != 'EUR' && moeda != ''",
      '',
      10000,
      0,
    )
    for (const v of versoes) {
      let m = v.getString('moeda')
      if (m === 'Dolar' || m === 'US$' || m === 'Dólar' || m === 'dolar' || m === 'dólar') {
        v.set('moeda', 'USD')
      } else if (m === 'Real' || m === 'real') {
        v.set('moeda', 'BRL')
      } else if (m === 'Euro' || m === 'euro') {
        v.set('moeda', 'EUR')
      } else {
        v.set('moeda', 'BRL')
      }
      app.saveNoValidate(v)
      affectedCount++
    }

    if (affectedCount > 0) {
      try {
        const firstAdmin = app.findFirstRecordByFilter('_pb_users_auth_', "role = 'admin'")
        const auditoriaCol = app.findCollectionByNameOrId('auditoria')
        const log = new Record(auditoriaCol)
        log.set('user', firstAdmin.id)
        log.set('acao', 'migration')
        log.set('tabela', 'system')
        log.set('registro_id', '0080_normalize_currencies_again')
        log.set('dados', { description: `Normalized currencies for ${affectedCount} records` })
        app.saveNoValidate(log)
      } catch (e) {
        // Just in case no admin exists or auditoria is missing
      }
    }
  },
  (app) => {
    // Revert not required
  },
)
