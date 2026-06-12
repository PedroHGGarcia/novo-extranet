migrate(
  (app) => {
    const reps = [
      {
        name: 'Ramon Nicolas (SP)',
        coords: [
          [-23.67, -46.46],
          [-23.54, -46.31],
          [-23.7, -46.4],
          [-23.52, -46.19],
        ],
      },
      {
        name: 'Julio César (PR)',
        coords: [
          [-23.76, -53.37],
          [-23.3, -51.16],
          [-25.55, -54.59],
          [-24.96, -53.46],
        ],
      },
      {
        name: 'Inove Comercio (SC)',
        coords: [
          [-26.3, -48.85],
          [-27.6, -48.55],
          [-28.67, -49.37],
          [-27.1, -52.62],
        ],
      },
      {
        name: 'Aurelio de Oliveira (SP)',
        coords: [
          [-23.31, -46.49],
          [-23.38, -46.31],
          [-23.47, -46.53],
          [-23.5, -46.88],
        ],
      },
      {
        name: 'EBMAQ (SP)',
        coords: [
          [-23.49, -46.37],
          [-23.55, -46.45],
          [-23.55, -46.37],
          [-23.57, -46.6],
        ],
      },
      {
        name: 'Interior Oeste (SP)',
        coords: [
          [-23.5, -47.46],
          [-22.9, -47.06],
          [-24.1, -48.87],
          [-23.78, -47.38],
        ],
      },
      {
        name: 'Interior Diverso (SP)',
        coords: [
          [-21.18, -47.81],
          [-21.2, -50.43],
          [-21.78, -46.57],
          [-23.18, -46.88],
        ],
      },
      {
        name: 'ABC Paulista (SP)',
        coords: [
          [-23.66, -46.54],
          [-23.68, -46.62],
          [-23.78, -46.41],
          [-23.62, -46.56],
        ],
      },
      {
        name: 'Interior Sudoeste (SP)',
        coords: [
          [-22.21, -49.95],
          [-21.2, -50.43],
          [-22.12, -51.39],
          [-22.88, -48.48],
        ],
      },
    ]

    const col = app.findCollectionByNameOrId('representantes')

    for (const rep of reps) {
      try {
        const record = app.findFirstRecordByData('representantes', 'fantasia', rep.name)
        record.set('coordenadas', rep.coords)
        app.save(record)
      } catch (_) {
        const record = new Record(col)
        record.set('fantasia', rep.name)
        record.set('status', 'Ativo')
        record.set('coordenadas', rep.coords)
        app.save(record)
      }
    }
  },
  (app) => {
    // Empty down migration
  },
)
