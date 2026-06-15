migrate(
  (app) => {
    let user
    try {
      user = app.findAuthRecordByEmail('_pb_users_auth_', 'bianca@bener.com.br')
    } catch (_) {
      return // Usuário não existe, pula o seed
    }

    const notificacoes = app.findCollectionByNameOrId('notificacoes')

    const data = [
      {
        titulo: 'Bem-vindo ao sistema',
        mensagem: 'Sua conta foi criada com sucesso. Bem-vindo!',
        tipo: 'sucesso',
      },
      {
        titulo: 'Novo cliente cadastrado',
        mensagem: "O cliente 'Tech Solutions' foi adicionado à base de clientes.",
        tipo: 'info',
      },
      {
        titulo: 'Atualização de sistema concluída',
        mensagem:
          'O sistema foi atualizado para a versão mais recente. Novas funcionalidades estão disponíveis.',
        tipo: 'info',
      },
    ]

    for (const item of data) {
      try {
        app.findFirstRecordByData('notificacoes', 'titulo', item.titulo)
        // Já existe
      } catch (_) {
        const record = new Record(notificacoes)
        record.set('user', user.id)
        record.set('titulo', item.titulo)
        record.set('mensagem', item.mensagem)
        record.set('lida', false)
        record.set('tipo', item.tipo)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter(
        'notificacoes',
        "titulo = 'Bem-vindo ao sistema' || titulo = 'Novo cliente cadastrado' || titulo = 'Atualização de sistema concluída'",
        '',
        10,
        0,
      )
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
)
