migrate(
  (app) => {
    const eventos = app.findCollectionByNameOrId('eventos')

    const data = [
      {
        titulo: 'Reunião de Alinhamento Q3',
        data: '2026-06-20 10:00:00.000Z',
        categoria: 'Reunião',
        descricao: 'Alinhamento das metas para o terceiro trimestre com gerentes regionais.',
        status: 'Agendado',
      },
      {
        titulo: 'Fechamento B2B Tech',
        data: '2026-06-21 14:30:00.000Z',
        categoria: 'Venda',
        descricao: 'Assinatura do contrato anual de representação comercial.',
        status: 'Pendente',
      },
      {
        titulo: 'Visita Técnica Filial Sul',
        data: '2026-06-22 09:00:00.000Z',
        categoria: 'Visita',
        descricao: 'Inspeção técnica e acompanhamento de rotinas.',
        status: 'Concluído',
      },
      {
        titulo: 'Demonstração de Produto',
        data: '2026-06-23 16:00:00.000Z',
        categoria: 'Venda',
        descricao: 'Apresentação para novo cliente potencial do setor industrial.',
        status: 'Agendado',
      },
      {
        titulo: 'Treinamento Interno',
        data: '2026-06-24 11:00:00.000Z',
        categoria: 'Outros',
        descricao: 'Capacitação da equipe de vendas sobre novas normativas.',
        status: 'Agendado',
      },
    ]

    for (const item of data) {
      try {
        app.findFirstRecordByData('eventos', 'titulo', item.titulo)
      } catch (_) {
        const record = new Record(eventos)
        record.set('titulo', item.titulo)
        record.set('data', item.data)
        record.set('categoria', item.categoria)
        record.set('descricao', item.descricao)
        record.set('status', item.status)
        app.save(record)
      }
    }
  },
  (app) => {
    const titulos = [
      'Reunião de Alinhamento Q3',
      'Fechamento B2B Tech',
      'Visita Técnica Filial Sul',
      'Demonstração de Produto',
      'Treinamento Interno',
    ]
    for (const titulo of titulos) {
      try {
        const record = app.findFirstRecordByData('eventos', 'titulo', titulo)
        app.delete(record)
      } catch (_) {}
    }
  },
)
