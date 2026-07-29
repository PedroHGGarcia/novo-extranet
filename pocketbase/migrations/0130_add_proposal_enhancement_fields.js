migrate(
  (app) => {
    const tiposCol = app.findCollectionByNameOrId('tipos_proposta')
    if (!tiposCol.fields.getByName('mostrar_pagamento_brasil')) {
      tiposCol.fields.add(new BoolField({ name: 'mostrar_pagamento_brasil' }))
    }
    app.save(tiposCol)

    const propostasCol = app.findCollectionByNameOrId('propostas')

    if (!propostasCol.fields.getByName('assinatura_gerente_produto')) {
      propostasCol.fields.add(
        new FileField({
          name: 'assinatura_gerente_produto',
          maxSelect: 1,
          maxSize: 1048576,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }

    if (!propostasCol.fields.getByName('assinatura_assessor_tecnico')) {
      propostasCol.fields.add(
        new FileField({
          name: 'assinatura_assessor_tecnico',
          maxSelect: 1,
          maxSize: 1048576,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }

    if (!propostasCol.fields.getByName('nome_gerente_produto')) {
      propostasCol.fields.add(new TextField({ name: 'nome_gerente_produto' }))
    }

    if (!propostasCol.fields.getByName('nome_assessor_tecnico')) {
      propostasCol.fields.add(new TextField({ name: 'nome_assessor_tecnico' }))
    }

    if (!propostasCol.fields.getByName('nome_representante_comercial')) {
      propostasCol.fields.add(new TextField({ name: 'nome_representante_comercial' }))
    }

    if (!propostasCol.fields.getByName('versoes_comparacao')) {
      propostasCol.fields.add(new JSONField({ name: 'versoes_comparacao' }))
    }

    app.save(propostasCol)
  },
  (app) => {
    try {
      const tiposCol = app.findCollectionByNameOrId('tipos_proposta')
      tiposCol.fields.removeByName('mostrar_pagamento_brasil')
      app.save(tiposCol)
    } catch (e) {}

    try {
      const propostasCol = app.findCollectionByNameOrId('propostas')
      propostasCol.fields.removeByName('assinatura_gerente_produto')
      propostasCol.fields.removeByName('assinatura_assessor_tecnico')
      propostasCol.fields.removeByName('nome_gerente_produto')
      propostasCol.fields.removeByName('nome_assessor_tecnico')
      propostasCol.fields.removeByName('nome_representante_comercial')
      propostasCol.fields.removeByName('versoes_comparacao')
      app.save(propostasCol)
    } catch (e) {}
  },
)
