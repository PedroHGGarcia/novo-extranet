migrate(
  (app) => {
    try {
      var propCol = app.findCollectionByNameOrId('propostas')
      if (!propCol.fields.getByName('assinatura_hash')) {
        propCol.fields.add(new TextField({ name: 'assinatura_hash' }))
        app.save(propCol)
      }
    } catch (e) {
      console.log('Failed to add assinatura_hash to propostas:', String(e))
    }

    try {
      var userCol = app.findCollectionByNameOrId('users')
      if (!userCol.fields.getByName('assinatura_hash')) {
        userCol.fields.add(new TextField({ name: 'assinatura_hash' }))
        app.save(userCol)
      }
    } catch (e) {
      console.log('Failed to add assinatura_hash to users:', String(e))
    }
  },
  (app) => {
    try {
      var propCol = app.findCollectionByNameOrId('propostas')
      var f = propCol.fields.getByName('assinatura_hash')
      if (f) {
        propCol.fields.remove(f)
        app.save(propCol)
      }
    } catch (e) {}

    try {
      var userCol = app.findCollectionByNameOrId('users')
      var f = userCol.fields.getByName('assinatura_hash')
      if (f) {
        userCol.fields.remove(f)
        app.save(userCol)
      }
    } catch (e) {}
  },
)
