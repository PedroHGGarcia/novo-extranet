migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    if (!col.fields.getByName('emails_notificacao')) {
      col.fields.add(new TextField({ name: 'emails_notificacao' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('propostas')
    col.fields.removeByName('emails_notificacao')
    app.save(col)
  },
)
