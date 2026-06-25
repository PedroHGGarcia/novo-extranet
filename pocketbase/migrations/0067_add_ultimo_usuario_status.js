/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('ultimo_usuario_status')) {
      col.fields.add(
        new RelationField({
          name: 'ultimo_usuario_status',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('ultimo_usuario_status')
    app.save(col)
  },
)
