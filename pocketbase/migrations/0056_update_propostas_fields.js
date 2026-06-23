migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('revisao')) col.fields.add(new TextField({ name: 'revisao' }))
    if (!col.fields.getByName('gerente'))
      col.fields.add(
        new RelationField({
          name: 'gerente',
          collectionId: app.findCollectionByNameOrId('gerentes').id,
          maxSelect: 1,
        }),
      )
    if (!col.fields.getByName('moeda')) col.fields.add(new TextField({ name: 'moeda' }))
    if (!col.fields.getByName('valor_sem_desconto'))
      col.fields.add(new NumberField({ name: 'valor_sem_desconto' }))
    if (!col.fields.getByName('valor_atual'))
      col.fields.add(new NumberField({ name: 'valor_atual' }))
    if (!col.fields.getByName('valor_final'))
      col.fields.add(new NumberField({ name: 'valor_final' }))
    if (!col.fields.getByName('prazo_entrega'))
      col.fields.add(new TextField({ name: 'prazo_entrega' }))
    if (!col.fields.getByName('condicoes_pagamento'))
      col.fields.add(new TextField({ name: 'condicoes_pagamento' }))
    if (!col.fields.getByName('acessorios_proposta'))
      col.fields.add(new JSONField({ name: 'acessorios_proposta' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('revisao')
    col.fields.removeByName('gerente')
    col.fields.removeByName('moeda')
    col.fields.removeByName('valor_sem_desconto')
    col.fields.removeByName('valor_atual')
    col.fields.removeByName('valor_final')
    col.fields.removeByName('prazo_entrega')
    col.fields.removeByName('condicoes_pagamento')
    col.fields.removeByName('acessorios_proposta')
    app.save(col)
  },
)
