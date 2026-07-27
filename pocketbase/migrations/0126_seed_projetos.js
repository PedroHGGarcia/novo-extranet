migrate(
  (app) => {
    const projetosCol = app.findCollectionByNameOrId('projetos')

    var userId = ''
    try {
      const user = app.findAuthRecordByEmail('users', 'bianca@bener.com.br')
      userId = user.id
    } catch (_) {}

    if (!userId) return

    var clientes = []
    try {
      clientes = app.findRecordsByFilter('clientes', "id != ''", 'fantasia', 5, 0)
    } catch (_) {}

    if (clientes.length === 0) return

    var samples = [
      {
        nome: 'Projeto Exemplo Alpha',
        descricao: 'Instalação de equipamentos industriais',
        status: 'Em Andamento',
        ooo: 'Aguardando confirmação do cliente',
      },
      {
        nome: 'Projeto Exemplo Beta',
        descricao: 'Fornecimento de maquinário completo',
        status: 'Em Andamento',
        ooo: '',
      },
      {
        nome: 'Projeto Exemplo Gamma',
        descricao: 'Manutenção preventiva trimestral',
        status: 'Concluído',
        ooo: 'Projeto finalizado com sucesso',
      },
    ]

    for (var i = 0; i < samples.length && i < clientes.length; i++) {
      try {
        app.findFirstRecordByData('projetos', 'nome', samples[i].nome)
        continue
      } catch (_) {}

      var record = new Record(projetosCol)
      record.set('nome', samples[i].nome)
      record.set('descricao', samples[i].descricao)
      record.set('cliente', clientes[i].id)
      record.set('status', samples[i].status)
      record.set('user', userId)
      if (samples[i].ooo) record.set('ooo', samples[i].ooo)
      app.save(record)
    }
  },
  (app) => {
    var names = ['Projeto Exemplo Alpha', 'Projeto Exemplo Beta', 'Projeto Exemplo Gamma']
    for (var i = 0; i < names.length; i++) {
      try {
        var rec = app.findFirstRecordByData('projetos', 'nome', names[i])
        app.delete(rec)
      } catch (_) {}
    }
  },
)
