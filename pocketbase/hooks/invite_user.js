routerAdd(
  'POST',
  '/backend/v1/invite',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError('Apenas admins podem convidar usuários')
    }

    const body = e.requestInfo().body
    if (!body.email || !body.role) {
      return e.badRequestError('Email e role são obrigatórios')
    }

    var defaultUserAccess = {
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
      dashboard_licitacoes: false,
      area_atuacao: false,
      configuracoes: false,
      auditoria: false,
      projetos: true,
    }

    var allKeys = [
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
      'dashboard_licitacoes',
      'area_atuacao',
      'configuracoes',
      'auditoria',
      'projetos',
    ]

    var adminAccess = {}
    for (var i = 0; i < allKeys.length; i++) {
      adminAccess[allKeys[i]] = true
    }

    const usersCol = $app.findCollectionByNameOrId('users')
    const user = new Record(usersCol)
    user.setEmail(body.email)
    user.setPassword($security.randomString(12))
    user.set('role', body.role)
    user.setVerified(false)
    user.set('menu_access', body.role === 'admin' ? adminAccess : defaultUserAccess)

    try {
      $app.save(user)
    } catch (err) {
      return e.badRequestError('Erro ao convidar usuário. O email já está em uso ou é inválido.')
    }

    $app.logger().info('User invited', 'email', body.email, 'role', body.role)

    return e.json(200, { message: 'Convite enviado com sucesso para o email informado.' })
  },
  $apis.requireAuth(),
)
