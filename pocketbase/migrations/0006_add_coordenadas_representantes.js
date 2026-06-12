migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('representantes')
    if (!col.fields.getByName('coordenadas')) {
      col.fields.add(new JSONField({ name: 'coordenadas', maxSize: 2000000 }))
      app.save(col)
    }

    const seedData = [
      {
        nome: 'Ramon Nicolas',
        coord: [
          [-23.67, -46.46],
          [-23.54, -46.31],
          [-23.7, -46.4],
          [-23.52, -46.19],
        ],
      },
      {
        nome: 'Julio César',
        coord: [
          [-23.76, -53.37],
          [-23.3, -51.16],
          [-25.55, -54.59],
          [-24.96, -53.46],
        ],
      },
      {
        nome: 'Inove Comercio',
        coord: [
          [-26.3, -48.85],
          [-27.6, -48.55],
          [-28.67, -49.37],
          [-27.1, -52.62],
        ],
      },
      {
        nome: 'Aurelio de Oliveira',
        coord: [
          [-23.31, -46.49],
          [-23.38, -46.31],
          [-23.47, -46.53],
          [-23.5, -46.88],
        ],
      },
      {
        nome: 'EBMAQ',
        coord: [
          [-23.49, -46.37],
          [-23.55, -46.45],
          [-23.55, -46.37],
          [-23.57, -46.6],
        ],
      },
      {
        nome: 'Interior Oeste',
        coord: [
          [-23.5, -47.46],
          [-22.9, -47.06],
          [-24.1, -48.87],
          [-23.78, -47.38],
        ],
      },
      {
        nome: 'Interior Diverso',
        coord: [
          [-21.18, -47.81],
          [-21.2, -50.43],
          [-21.78, -46.57],
          [-23.18, -46.88],
        ],
      },
      {
        nome: 'ABC Paulista',
        coord: [
          [-23.66, -46.54],
          [-23.68, -46.62],
          [-23.78, -46.41],
          [-23.62, -46.56],
        ],
      },
      {
        nome: 'Interior Sudoeste',
        coord: [
          [-22.21, -49.95],
          [-21.2, -50.43],
          [-22.12, -51.39],
          [-22.88, -48.48],
        ],
      },
    ]

    for (const item of seedData) {
      let record
      try {
        record = app.findFirstRecordByData('representantes', 'fantasia', item.nome)
      } catch (_) {
        record = new Record(col)
        record.set('fantasia', item.nome)
        record.set('status', 'Ativo')
      }
      record.set('coordenadas', item.coord)
      app.save(record)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('representantes')
    if (col.fields.getByName('coordenadas')) {
      col.fields.removeByName('coordenadas')
      app.save(col)
    }
  },
)
