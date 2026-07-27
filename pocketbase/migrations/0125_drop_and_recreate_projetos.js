migrate(
  (app) => {
    try {
      const propostasCol = app.findCollectionByNameOrId('propostas')
      const projetoField = propostasCol.fields.getByName('projeto')
      if (projetoField) {
        propostasCol.fields.remove(projetoField)
        app.save(propostasCol)
      }
    } catch (_) {}

    let projetosCol
    let existed = false
    try {
      projetosCol = app.findCollectionByNameOrId('projetos')
      existed = true
    } catch {
      projetosCol = new Collection({
          name: 'projetos',
          type: 'base',
          listRule: "@request.auth.id != ''",
          viewRule: "@request.auth.id != ''",
          createRule: "@request.auth.id != ''",
          updateRule: "@request.auth.id != ''",
          deleteRule: "@request.auth.role = 'admin' || user = @request.auth.id",
          fields: [
            { name: 'nome', type: 'text', required: true },
            { name: 'descricao', type: 'text' },
            {
              name: 'cliente',
              type: 'relation',
              required: true,
              collectionId: app.findCollectionByNameOrId('clientes').id,
              maxSelect: 1,
            },
            {
              name: 'status',
              type: 'select',
              values: ['Em Andamento', 'Concluído', 'Cancelado', 'Suspenso'],
              maxSelect: 1,
            },
            {
              name: 'user',
              type: 'relation',
              collectionId: '_pb_users_auth_',
              maxSelect: 1,
            },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
            { name: 'ooo', type: 'text' },
          ],
          indexes: [
            'CREATE INDEX idx_projetos_cliente ON projetos (cliente)',
            'CREATE INDEX idx_projetos_status ON projetos (status)',
            'CREATE INDEX idx_projetos_nome ON projetos (nome)',
            'CREATE INDEX idx_projetos_cliente_status ON projetos (cliente, status)',
          ],
        })
        app.save(projetosCol)
      }
    }

    if (existed) {
      projetosCol.listRule = "@request.auth.id != ''"
      projetosCol.viewRule = "@request.auth.id != ''"
      projetosCol.createRule = "@request.auth.id != ''"
      projetosCol.updateRule = "@request.auth.id != ''"
      projetosCol.deleteRule = "@request.auth.role = 'admin' || user = @request.auth.id"

      if (!projetosCol.fields.getByName('ooo')) {
        projetosCol.fields.add(new TextField({ name: 'ooo' }))
      }
      if (!projetosCol.fields.getByName('descricao')) {
        projetosCol.fields.add(new TextField({ name: 'descricao' }))
      }

      projetosCol.addIndex('idx_projetos_cliente', false, 'cliente', '')
      projetosCol.addIndex('idx_projetos_status', false, 'status', '')
      projetosCol.addIndex('idx_projetos_nome', false, 'nome', '')
      projetosCol.addIndex('idx_projetos_cliente_status', false, 'cliente, status', '')

      app.save(projetosCol)
    }

    try {
      const propostasCol = app.findCollectionByNameOrId('propostas')
      if (!propostasCol.fields.getByName('projeto')) {
        propostasCol.fields.add(
          new RelationField({
            name: 'projeto',
            collectionId: app.findCollectionByNameOrId('projetos').id,
            maxSelect: 1,
          }),
        )
        app.save(propostasCol)
      }
    } catch (_) {}
  },
  (app) => {},
)
