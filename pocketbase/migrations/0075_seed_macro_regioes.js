migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('regioes')

    const macroRegioes = [
      { nome: 'Norte', estados: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'] },
      { nome: 'Nordeste', estados: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
      { nome: 'Centro-Oeste', estados: ['DF', 'GO', 'MT', 'MS'] },
      { nome: 'Sudeste', estados: ['ES', 'MG', 'RJ', 'SP'] },
      { nome: 'Sul', estados: ['PR', 'RS', 'SC'] },
    ]

    for (const regiao of macroRegioes) {
      try {
        app.findFirstRecordByData('regioes', 'nome', regiao.nome)
      } catch (_) {
        const record = new Record(col)
        record.set('nome', regiao.nome)
        record.set('status', 'Ativo')
        record.set('estados_selecionados', regiao.estados)
        record.set('cidades_selecionadas', [])
        app.save(record)
      }
    }
  },
  (app) => {
    const nomes = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
    for (const nome of nomes) {
      try {
        const record = app.findFirstRecordByData('regioes', 'nome', nome)
        app.delete(record)
      } catch (_) {}
    }
  },
)
