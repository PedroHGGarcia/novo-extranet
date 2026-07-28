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

    // Send invite email with password reset link
    try {
      var resetToken = user.newPasswordResetToken()
      $app.save(user)

      var baseUrl = ''
      try {
        var sObj = $app.settings()
        if (sObj && sObj.meta && sObj.meta.appUrl) {
          baseUrl = sObj.meta.appUrl
        }
      } catch (_) {}

      if (!baseUrl) {
        baseUrl = $secrets.get('SITE_URL') || ''
      }
      if (!baseUrl) {
        var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
        if (pbUrl) {
          if (pbUrl.endsWith('/')) pbUrl = pbUrl.slice(0, -1)
          baseUrl = pbUrl
        }
      }
      if (!baseUrl && e.request && e.request.host) {
        baseUrl = 'https://' + e.request.host
      }
      if (!baseUrl) {
        baseUrl = 'http://127.0.0.1:8090'
      }
      if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

      var resetUrl = baseUrl + '/_/collections/users/confirm-password-reset/' + resetToken

      var fromName = 'Extranet Gourmet'
      var fromAddress = 'noreply@mail.goskip.dev'
      try {
        var s = $app.settings()
        if (s && s.meta) {
          if (s.meta.senderName) fromName = s.meta.senderName
          if (s.meta.senderAddress) fromAddress = s.meta.senderAddress
        }
      } catch (_) {}

      var siteUrl = $secrets.get('SITE_URL') || 'https://extranetgourmet.goskip.app'
      var bannerImgUrl = (baseUrl || siteUrl) + '/src/assets/editedimage1784831163387-1-0c382.png'

      var subject = 'Convite para acessar a Extranet Gourmet'

      var textContent =
        'Prezado(a),\n\n' +
        'Você foi convidado(a) para acessar a Extranet Gourmet — Portal de Vendas & Gestão.\n\n' +
        'Utilize o link abaixo para criar sua senha e acessar o sistema:\n' +
        resetUrl +
        '\n\n' +
        'Caso não tenha solicitado este convite, desconsidere este e-mail.\n\n' +
        'Atenciosamente,\n' +
        'Extranet Gourmet — Portal de Vendas & Gestão'

      var htmlContent =
        '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
        '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Prezado(a),</p>' +
        '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Você foi convidado(a) para acessar a Extranet Gourmet — Portal de Vendas &amp; Gestão.</p>' +
        '<p style="margin: 0 0 12px 0; font-size: 15px; letter-spacing: normal;">Utilize o link abaixo para criar sua senha e acessar o sistema:</p>' +
        '<p style="margin: 0 0 20px 0; word-break: break-all; font-size: 15px; letter-spacing: normal;">' +
        '<a href="' +
        resetUrl +
        '" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' +
        resetUrl +
        '</a>' +
        '</p>' +
        '<p style="margin: 0 0 20px 0; font-size: 15px; letter-spacing: normal;">Caso não tenha solicitado este convite, desconsidere este e-mail.</p>' +
        '<p style="margin: 0 0 4px 0; font-size: 15px; letter-spacing: normal;">Atenciosamente,</p>' +
        '<p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: #1e293b; letter-spacing: normal;">Extranet Gourmet — Portal de Vendas &amp; Gestão</p>' +
        '<div style="margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">' +
        '<img src="' +
        bannerImgUrl +
        '" alt="Bener Máquinas Banner" style="max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 0 auto;" />' +
        '</div>' +
        '</div>'

      if (typeof MailerMessage !== 'undefined') {
        var message = new MailerMessage({
          from: { name: fromName, address: fromAddress },
          to: [{ address: body.email }],
          subject: subject,
          text: textContent,
          html: htmlContent,
        })
        $app.newMailClient().send(message)
      }
    } catch (emailErr) {
      $app
        .logger()
        .error(
          'invite: failed to send invite email',
          'email',
          body.email,
          'error',
          emailErr.message || String(emailErr),
        )

      // Log to auditoria so admins are aware
      try {
        var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
        var auditRec = new Record(auditoriaCol)
        auditRec.set('user', e.auth.id)
        auditRec.set('acao', 'Erro ao enviar email de convite para: ' + body.email)
        auditRec.set('tabela', 'users')
        auditRec.set('registro_id', user.id)
        auditRec.set('dados', {
          email: body.email,
          error: emailErr.message || String(emailErr),
          created_at: new Date().toISOString(),
        })
        $app.save(auditRec)
      } catch (_) {}
    }

    return e.json(200, { message: 'Convite enviado com sucesso para o email informado.' })
  },
  $apis.requireAuth(),
)
