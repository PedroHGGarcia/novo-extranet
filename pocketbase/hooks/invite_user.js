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

    const usersCol = $app.findCollectionByNameOrId('users')
    const user = new Record(usersCol)
    user.setEmail(body.email)
    user.setPassword($security.randomString(12))
    user.set('role', body.role)
    user.setVerified(false)

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
