/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const modelos = new Collection({
      name: 'modelos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'produto',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('produtos').id,
          maxSelect: 1,
        },
        {
          name: 'marca',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('marcas').id,
          maxSelect: 1,
        },
        { name: 'status', type: 'select', required: true, values: ['Ativo', 'Inativo'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(modelos)

    const versoes = new Collection({
      name: 'versoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'modelo',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('modelos').id,
          maxSelect: 1,
        },
        { name: 'nome', type: 'text', required: true },
        { name: 'cod_erp', type: 'text' },
        {
          name: 'imagem_preview',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
        { name: 'moeda', type: 'select', values: ['BRL', 'USD', 'EUR'] },
        { name: 'valor', type: 'number' },
        { name: 'tem_fator', type: 'bool' },
        { name: 'fator_nac', type: 'number' },
        { name: 'atualizado_por', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'status', type: 'select', required: true, values: ['Ativo', 'Inativo'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_versoes_coderp ON versoes (cod_erp) WHERE cod_erp != ''"],
    })
    app.save(versoes)

    const versaoImagens = new Collection({
      name: 'versao_imagens',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'versao',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('versoes').id,
          maxSelect: 1,
        },
        { name: 'ordem', type: 'number' },
        {
          name: 'arquivo',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
        { name: 'status', type: 'select', required: true, values: ['Ativo', 'Inativo'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(versaoImagens)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('versao_imagens'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('versoes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('modelos'))
    } catch (_) {}
  },
)
