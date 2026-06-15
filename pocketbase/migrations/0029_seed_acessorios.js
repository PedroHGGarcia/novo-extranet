migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('acessorios')
    const data = [
      {
        nome: 'Jogo de Pinças ER40 DIN 6499 23PC + Mand.',
        tipo: 'Opcional',
        moeda: 'BRL',
        valor: 1100,
        fator_nac: 1,
        status: 'Ativo',
      },
      {
        nome: 'Jogo ou Kit de Grampos de Fixação M14 c/ 52 pç',
        tipo: 'Opcional',
        moeda: 'BRL',
        valor: 195,
        fator_nac: 1,
        status: 'Ativo',
      },
      {
        nome: 'Leitura de Grampos 52 peças',
        tipo: 'Opcional',
        moeda: 'BRL',
        valor: 2300,
        fator_nac: 1,
        status: 'Ativo',
      },
      {
        nome: 'Morsa Hidráulica MHA-1 C/Base Abertura 200',
        tipo: 'Opcional',
        moeda: 'BRL',
        valor: 1815,
        fator_nac: 1,
        status: 'Ativo',
      },
      {
        nome: 'Morsa Mecânica MB-20 C/Base Abertura 200',
        tipo: 'Opcional',
        moeda: 'BRL',
        valor: 1375,
        fator_nac: 1,
        status: 'Ativo',
      },
    ]
    for (const d of data) {
      try {
        app.findFirstRecordByData('acessorios', 'nome', d.nome)
      } catch (_) {
        const record = new Record(col)
        record.set('nome', d.nome)
        record.set('tipo', d.tipo)
        record.set('moeda', d.moeda)
        record.set('valor', d.valor)
        record.set('fator_nac', d.fator_nac)
        record.set('status', d.status)
        app.save(record)
      }
    }
  },
  (app) => {
    const records = app.findRecordsByFilter(
      'acessorios',
      "nome ~ 'Morsa' || nome ~ 'Jogo' || nome ~ 'Leitura'",
      '-created',
      10,
      0,
    )
    for (const r of records) app.delete(r)
  },
)
