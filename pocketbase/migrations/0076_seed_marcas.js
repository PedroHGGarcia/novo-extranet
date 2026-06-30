migrate(
  (app) => {
    const marcas = app.findCollectionByNameOrId('marcas')
    const brands = [
      'AKIRA SEIKI',
      'BENER',
      'E-PLUS-3D',
      'EARTH CHAIN',
      'EMCO',
      'FCS',
      'FOUR STAR',
      'HYUNDAI',
      'LITZ',
      'MAKERBOT',
      'MAKINO',
      'MITSUBISHI',
      'NAKAMURA TOME',
      'NEXTURN',
      'OKAMOTO',
      'PONC',
      'PRIMINER',
      'RONG FU',
      'SEYI',
      'SISMA',
      'STRATASYS',
      'TORNOS',
      'VEKER',
      'VISION WIDE',
      'YU-SHINE',
    ]

    for (const name of brands) {
      try {
        app.findFirstRecordByData('marcas', 'nome', name)
      } catch (_) {
        const record = new Record(marcas)
        record.set('nome', name)
        record.set('status', 'Ativo')
        app.save(record)
      }
    }
  },
  (app) => {},
)
