migrate(
  (app) => {
    const collection = new Collection({
      name: 'historico_importacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['clientes', 'produtos', 'propostas', 'representantes'],
          maxSelect: 1,
        },
        { name: 'arquivo_original', type: 'text', required: true },
        { name: 'quantidade_registros', type: 'number', required: true },
        { name: 'quantidade_sucesso', type: 'number', required: true },
        { name: 'quantidade_erro', type: 'number', required: true },
        { name: 'erros', type: 'json', required: false },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['concluido', 'parcial', 'cancelado'],
          maxSelect: 1,
        },
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'created_ids', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_historico_importacoes_usuario ON historico_importacoes (usuario)',
        'CREATE INDEX idx_historico_importacoes_tipo_status ON historico_importacoes (tipo, status)',
        'CREATE INDEX idx_historico_importacoes_created ON historico_importacoes (created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('historico_importacoes')
    app.delete(collection)
  },
)
