migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')

    if (!col.fields.getByName('nome_abreviado'))
      col.fields.add(new TextField({ name: 'nome_abreviado' }))
    if (!col.fields.getByName('tem_estoque')) col.fields.add(new BoolField({ name: 'tem_estoque' }))
    if (!col.fields.getByName('desconto_max_representante'))
      col.fields.add(new NumberField({ name: 'desconto_max_representante' }))
    if (!col.fields.getByName('desconto_max_bener'))
      col.fields.add(new NumberField({ name: 'desconto_max_bener' }))
    if (!col.fields.getByName('estoque_total'))
      col.fields.add(new NumberField({ name: 'estoque_total' }))
    if (!col.fields.getByName('estoque_bloqueado'))
      col.fields.add(new NumberField({ name: 'estoque_bloqueado' }))
    if (!col.fields.getByName('estoque_reservado'))
      col.fields.add(new NumberField({ name: 'estoque_reservado' }))
    if (!col.fields.getByName('estoque_disponivel'))
      col.fields.add(new NumberField({ name: 'estoque_disponivel' }))
    if (!col.fields.getByName('acessorios_standards'))
      col.fields.add(new TextField({ name: 'acessorios_standards' }))
    if (!col.fields.getByName('caracteristicas_construtivas'))
      col.fields.add(new TextField({ name: 'caracteristicas_construtivas' }))
    if (!col.fields.getByName('especificacoes_tecnicas'))
      col.fields.add(new TextField({ name: 'especificacoes_tecnicas' }))
    if (!col.fields.getByName('tipos_proposta'))
      col.fields.add(new JSONField({ name: 'tipos_proposta' }))

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('versoes')

    col.fields.removeByName('nome_abreviado')
    col.fields.removeByName('tem_estoque')
    col.fields.removeByName('desconto_max_representante')
    col.fields.removeByName('desconto_max_bener')
    col.fields.removeByName('estoque_total')
    col.fields.removeByName('estoque_bloqueado')
    col.fields.removeByName('estoque_reservado')
    col.fields.removeByName('estoque_disponivel')
    col.fields.removeByName('acessorios_standards')
    col.fields.removeByName('caracteristicas_construtivas')
    col.fields.removeByName('especificacoes_tecnicas')
    col.fields.removeByName('tipos_proposta')

    app.save(col)
  },
)
