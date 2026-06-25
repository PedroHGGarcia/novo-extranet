/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('tipos_proposta')

    const items = [
      { nome: 'Nacionalizada', tem_fator: true, status: 'Ativo' },
      { nome: 'Capas (Apenas efeito sequencial)', tem_fator: false, status: 'Ativo' },
      { nome: 'SISMA - Nacionalizada - Solda a laser - 2024', tem_fator: true, status: 'Ativo' },
      { nome: 'CNC - Nacionalizada - 2022', tem_fator: true, status: 'Ativo' },
      { nome: 'SISMA - Nacionalizada - Gravação a laser - 2022', tem_fator: true, status: 'Ativo' },
      {
        nome: 'Convencional - Nacionalizada - Em trânsito - 2022',
        tem_fator: true,
        status: 'Ativo',
      },
      { nome: 'SISMA - Nacionalizada - Solda a laser - 2022', tem_fator: true, status: 'Ativo' },
      { nome: 'Reformada - Nacionalizada - 2022', tem_fator: true, status: 'Ativo' },
      { nome: 'Convencional - Nacionalizada - 2022', tem_fator: true, status: 'Ativo' },
      { nome: 'CNC - Nacionalizada - Em trânsito - 2022', tem_fator: true, status: 'Ativo' },
      { nome: 'Reformada - Nacionalizada - 2022*', tem_fator: true, status: 'Ativo' },
      {
        nome: 'NAKAMURA TOME - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SISMA - Solda a laser - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SISMA - Gravação a laser - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SISMA - AT - Gravação a laser - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SISMA - AT - Solda a laser - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'KBN - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'PRIMINER - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'AT - Importação Direta: Incluso 12% + Impostos - 2024',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SEYI - Imp. Direta: Incluso 12% + Imp - 80 dias - 3dias/1tecn - SN1/SN51/SN2',
        tem_fator: false,
        status: 'Ativo',
      },
      { nome: 'PRIMINER - Nacionalizada - MaaS 2025 36x', tem_fator: true, status: 'Ativo' },
      { nome: 'PRIMINER - Nacionalizada - MaaS 2025 48x', tem_fator: true, status: 'Ativo' },
      { nome: 'PRIMINER - Nacionalizada - MaaS 2025 48x + 12x', tem_fator: true, status: 'Ativo' },
      { nome: 'AT - Importação Direta: Incluso 13% - 2024', tem_fator: false, status: 'Ativo' },
      {
        nome: 'Importação Direta: Incluso 12% + Impostos - MVK 2616 Pro2024',
        tem_fator: false,
        status: 'Ativo',
      },
      { nome: 'AT - Importação Direta: Incluso 18% - 2024', tem_fator: false, status: 'Ativo' },
      { nome: 'AT - Importação Direta: Incluso 15% - 2024', tem_fator: false, status: 'Ativo' },
      {
        nome: 'CNC - Nacionalizada - Em trânsito - MVK 2616 Pro2024',
        tem_fator: true,
        status: 'Ativo',
      },
      { nome: 'AT - Importação Direta: SEM 13% - 2025', tem_fator: false, status: 'Ativo' },
      {
        nome: 'SEYI - Importação Direta: Incluso 12% + Impostos - 2024 - 150 DIAS',
        tem_fator: false,
        status: 'Ativo',
      },
      { nome: 'MAKINO - Aluguel - 2025 48x', tem_fator: true, status: 'Ativo' },
      {
        nome: 'MAKINO - Importação Direta: Incluso 12% + Impostos - 2025',
        tem_fator: false,
        status: 'Ativo',
      },
      { nome: 'MAKINO - Faturamento BENER - 2025', tem_fator: true, status: 'Ativo' },
      { nome: 'FCS Importação Direta (FOB): SEM % - 2026', tem_fator: false, status: 'Ativo' },
      {
        nome: 'SEYI - Imp. Direta: Incluso 12% + Imp - 120 dias - 10dias/2tecn - SNS2',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'SEYI - Imp. Direta: Incluso 12% + Imp - 200 dias - 30dias/4tecn - SAG',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'MITSUBISHI - Importação Direta: Incluso 12% + Impostos - 2026',
        tem_fator: false,
        status: 'Ativo',
      },
      {
        nome: 'MITSUBISHI - AT - Importação Direta: Incluso 12% + Impostos - 2026',
        tem_fator: false,
        status: 'Ativo',
      },
      { nome: 'FCS Nacionalizada: SEM % - 2026', tem_fator: false, status: 'Ativo' },
    ]

    for (const item of items) {
      try {
        app.findFirstRecordByData('tipos_proposta', 'nome', item.nome)
      } catch (_) {
        const record = new Record(collection)
        record.set('nome', item.nome)
        record.set('tem_fator', item.tem_fator)
        record.set('status', item.status)
        app.save(record)
      }
    }
  },
  (app) => {
    // Can't reliably remove just these seeds if users edit them
  },
)
