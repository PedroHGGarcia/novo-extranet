migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_dashboard')
    const newComponents = [
      'grafico_vendas_mensal',
      'analise_margem',
      'notificacoes_recentes',
      'proximos_eventos',
    ]
    const perfis = ['admin', 'user']

    for (const perfil of perfis) {
      for (const comp of newComponents) {
        try {
          app.findFirstRecordByFilter(
            'configuracoes_dashboard',
            "perfil = '" + perfil + "' && componente = '" + comp + "'",
          )
        } catch (_) {
          const record = new Record(col)
          record.set('perfil', perfil)
          record.set('componente', comp)
          record.set('visivel', true)
          app.save(record)
        }
      }
    }
  },
  (app) => {},
)
