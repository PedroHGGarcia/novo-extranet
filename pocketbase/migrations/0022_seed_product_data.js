migrate(
  (app) => {
    const marcas = app.findCollectionByNameOrId('marcas')
    const marcaNames = ['AKIRA SEIKI', 'BENER', 'E-PLUS-3D', 'EARTH CHAIN', 'EMCO']
    for (const name of marcaNames) {
      try {
        app.findFirstRecordByData('marcas', 'nome', name)
      } catch (_) {
        const record = new Record(marcas)
        record.set('nome', name)
        record.set('status', 'Ativo')
        app.save(record)
      }
    }

    const categorias = app.findCollectionByNameOrId('categorias_produtos')
    const catNames = ['Aberta', 'Geral', 'High Tech', 'Injetoras', 'Prensas']
    const catIds = {}
    for (const name of catNames) {
      try {
        const record = app.findFirstRecordByData('categorias_produtos', 'nome', name)
        catIds[name] = record.id
      } catch (_) {
        const record = new Record(categorias)
        record.set('nome', name)
        record.set('status', 'Ativo')
        app.save(record)
        catIds[name] = record.id
      }
    }

    const produtos = app.findCollectionByNameOrId('produtos')
    const prodData = [
      { nome: 'Centro de Usinagem Portal, Coluna Fixa - Four Star', cat: 'Aberta' },
      { nome: 'Centro de Usinagem Portal, Coluna Fixa - Ponc', cat: 'Aberta' },
      { nome: 'Centro de Usinagem Portal, Coluna Fixa - Priminer', cat: 'Aberta' },
      { nome: 'Centro de Usinagem Portal, Coluna Fixa - Vision Wide', cat: 'Aberta' },
      { nome: 'Centro de Usinagem Portal, Coluna Móvel - Four Star', cat: 'Aberta' },
      { nome: 'Torno Mecânico CNC', cat: 'Geral' },
      { nome: 'Fresadora Universal', cat: 'Geral' },
      { nome: 'Injetora 100T', cat: 'Injetoras' },
      { nome: 'Injetora 200T', cat: 'Injetoras' },
      { nome: 'Prensa Hidráulica', cat: 'Prensas' },
    ]

    for (const p of prodData) {
      try {
        app.findFirstRecordByData('produtos', 'nome', p.nome)
      } catch (_) {
        const record = new Record(produtos)
        record.set('nome', p.nome)
        record.set('categoria', catIds[p.cat])
        record.set('status', 'Ativo')
        app.save(record)
      }
    }
  },
  (app) => {},
)
