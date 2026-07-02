migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('menu_access')) {
      users.fields.add(new JSONField({ name: 'menu_access' }))
    }
    app.save(users)

    var fullAccess = {
      dashboard: true,
      'cadastros.gerentes': true,
      'cadastros.clientes': true,
      'cadastros.regioes': true,
      'cadastros.representantes': true,
      eventos: true,
      'propostas.dashboard': true,
      'propostas.emitir': true,
      'propostas.licitacao': true,
      'propostas.avancadas': true,
      'propostas.tipos': true,
      'produtos.categorias': true,
      'produtos.produtos': true,
      'produtos.marcas': true,
      'produtos.modelos': true,
      'produtos.versoes': true,
      'produtos.acessorios': true,
      'produtos.alterar_precos': true,
      perfil: true,
      area_atuacao: true,
      usuarios: true,
      auditoria: true,
      configuracoes: true,
    }

    var restrictedAccess = {
      dashboard: true,
      'cadastros.gerentes': false,
      'cadastros.clientes': true,
      'cadastros.regioes': false,
      'cadastros.representantes': true,
      eventos: true,
      'propostas.dashboard': true,
      'propostas.emitir': true,
      'propostas.licitacao': false,
      'propostas.avancadas': false,
      'propostas.tipos': false,
      'produtos.categorias': false,
      'produtos.produtos': true,
      'produtos.marcas': false,
      'produtos.modelos': false,
      'produtos.versoes': true,
      'produtos.acessorios': false,
      'produtos.alterar_precos': false,
      perfil: true,
      area_atuacao: false,
      usuarios: false,
      auditoria: false,
      configuracoes: false,
    }

    try {
      var records = app.findRecordsByFilter('users', "id != ''", '-created', 10000, 0)
      for (var i = 0; i < records.length; i++) {
        var record = records[i]
        var existing = record.get('menu_access')
        if (existing && typeof existing === 'object') continue
        var role = record.getString('role')
        record.set('menu_access', role === 'admin' ? fullAccess : restrictedAccess)
        app.save(record)
      }
    } catch (e) {
      console.log('Failed to seed menu_access', e)
    }
  },
  (app) => {
    var users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('menu_access')
    app.save(users)
  },
)
