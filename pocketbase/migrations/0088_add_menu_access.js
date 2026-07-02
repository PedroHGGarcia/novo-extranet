migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('menu_access')) {
      users.fields.add(new JSONField({ name: 'menu_access', maxSize: 5242880 }))
    }
    app.save(users)

    const allKeys = [
      'clientes',
      'representantes',
      'regioes',
      'gerentes',
      'prepostos',
      'eventos',
      'categorias',
      'marcas',
      'produtos',
      'modelos',
      'versoes',
      'acessorios',
      'alterar_precos',
      'propostas',
      'emitir_proposta',
      'emitir_licitacao',
      'propostas_avancadas',
      'tipos_propostas',
      'area_atuacao',
      'configuracoes',
      'auditoria',
    ]

    const adminAccess = {}
    for (const key of allKeys) {
      adminAccess[key] = true
    }

    const userAccess = {
      clientes: true,
      representantes: true,
      regioes: false,
      gerentes: false,
      prepostos: false,
      eventos: true,
      categorias: false,
      marcas: false,
      produtos: true,
      modelos: false,
      versoes: true,
      acessorios: false,
      alterar_precos: false,
      propostas: true,
      emitir_proposta: true,
      emitir_licitacao: false,
      propostas_avancadas: false,
      tipos_propostas: false,
      area_atuacao: false,
      configuracoes: false,
      auditoria: false,
    }

    const allUsers = app.findRecordsByFilter('users', "id != ''", '-created', 10000, 0)
    for (const record of allUsers) {
      const existing = record.get('menu_access')
      if (existing && typeof existing === 'object') continue

      const role = record.getString('role')
      if (role === 'admin') {
        record.set('menu_access', adminAccess)
      } else {
        record.set('menu_access', userAccess)
      }
      app.save(record)
    }
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('menu_access')
    app.save(users)
  },
)
