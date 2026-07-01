migrate(
  (app) => {
    const filter = "moeda = 'Dolar' || moeda = 'Real' || moeda = 'Euro' || moeda = 'US$'"
    const versoes = app.findRecordsByFilter('versoes', filter, '', 10000, 0)
    for (const v of versoes) {
      const m = v.getString('moeda')
      if (m === 'Dolar' || m === 'US$') v.set('moeda', 'USD')
      else if (m === 'Real') v.set('moeda', 'BRL')
      else if (m === 'Euro') v.set('moeda', 'EUR')
      app.saveNoValidate(v)
    }

    const acessorios = app.findRecordsByFilter('acessorios', filter, '', 10000, 0)
    for (const a of acessorios) {
      const m = a.getString('moeda')
      if (m === 'Dolar' || m === 'US$') a.set('moeda', 'USD')
      else if (m === 'Real') a.set('moeda', 'BRL')
      else if (m === 'Euro') a.set('moeda', 'EUR')
      app.saveNoValidate(a)
    }
  },
  (app) => {
    // Revert not required for data normalization
  },
)
