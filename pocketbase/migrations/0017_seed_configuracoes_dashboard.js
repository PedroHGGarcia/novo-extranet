migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configuracoes_dashboard')
    const componentes = [
      'Gerentes Ativos',
      'Representantes Ativos',
      'Clientes Ativos',
      'Propostas Emitidas',
      'Feedback',
    ]
    const perfis = ['admin', 'user']

    for (const perfil of perfis) {
      for (const comp of componentes) {
        try {
          app.findFirstRecordByFilter(
            'configuracoes_dashboard',
            `perfil = '${perfil}' && componente = '${comp}'`,
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
  (app) => {
    // Can be left empty for down migration since we might not want to remove seeded data blindly
  },
)
