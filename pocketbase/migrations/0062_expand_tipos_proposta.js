migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_proposta')

    col.fields.add(new NumberField({ name: 'comissao' }))
    col.fields.add(new TextField({ name: 'frase_preco' }))
    col.fields.add(new TextField({ name: 'frase_comissao' }))
    col.fields.add(new TextField({ name: 'prazo_entrega' }))
    col.fields.add(new TextField({ name: 'condicoes_pagamento' }))
    col.fields.add(new TextField({ name: 'garantia' }))
    col.fields.add(new TextField({ name: 'assistencia_tecnica' }))
    col.fields.add(new TextField({ name: 'treinamento_tecnico' }))
    col.fields.add(new TextField({ name: 'transporte_seguro' }))
    col.fields.add(new TextField({ name: 'validade_oferta' }))
    col.fields.add(new TextField({ name: 'imposto_ipi' }))
    col.fields.add(new TextField({ name: 'imposto_icms' }))
    col.fields.add(new JSONField({ name: 'formas_pagamento_selecionadas' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('tipos_proposta')

    col.fields.removeByName('comissao')
    col.fields.removeByName('frase_preco')
    col.fields.removeByName('frase_comissao')
    col.fields.removeByName('prazo_entrega')
    col.fields.removeByName('condicoes_pagamento')
    col.fields.removeByName('garantia')
    col.fields.removeByName('assistencia_tecnica')
    col.fields.removeByName('treinamento_tecnico')
    col.fields.removeByName('transporte_seguro')
    col.fields.removeByName('validade_oferta')
    col.fields.removeByName('imposto_ipi')
    col.fields.removeByName('imposto_icms')
    col.fields.removeByName('formas_pagamento_selecionadas')

    app.save(col)
  },
)
