onRecordAfterCreateSuccess((e) => {
  try {
    if (!e || !e.record) return
    var rec = e.record
    var colName = rec.collectionName || ''
    if (colName === 'auditoria') return

    var userId = ''
    try {
      if (e.auth && e.auth.id) {
        userId = e.auth.id
      } else if (rec.get && rec.get('user')) {
        userId = rec.get('user')
      } else if (rec.get && rec.get('atualizado_por')) {
        userId = rec.get('atualizado_por')
      }
    } catch (_) {}

    if (!userId) return

    var userName = ''
    try {
      var uRec = $app.findRecordById('users', userId)
      if (uRec) {
        userName = uRec.getString('name') || uRec.get('name') || uRec.getString('email') || ''
      }
    } catch (_) {}

    var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    if (auditoriaCol) {
      var auditRec = new Record(auditoriaCol)
      auditRec.set('user', userId)
      auditRec.set('acao', 'Criação: ' + colName)
      auditRec.set('tabela', colName)
      auditRec.set('registro_id', rec.id)
      auditRec.set('dados', {
        id: rec.id,
        user_name: userName,
        created_at: new Date().toISOString(),
      })
      $app.save(auditRec)
    }
  } catch (err) {
    // Prevent audit failures from breaking record creation
  }
})

onRecordAfterUpdateSuccess((e) => {
  try {
    if (!e || !e.record) return
    var rec = e.record
    var colName = rec.collectionName || ''
    if (colName === 'auditoria') return

    var userId = ''
    try {
      if (e.auth && e.auth.id) {
        userId = e.auth.id
      } else if (rec.get && rec.get('user')) {
        userId = rec.get('user')
      } else if (rec.get && rec.get('atualizado_por')) {
        userId = rec.get('atualizado_por')
      }
    } catch (_) {}

    if (!userId) return

    var userName = ''
    try {
      var uRec = $app.findRecordById('users', userId)
      if (uRec) {
        userName = uRec.getString('name') || uRec.get('name') || uRec.getString('email') || ''
      }
    } catch (_) {}

    var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    if (auditoriaCol) {
      var auditRec = new Record(auditoriaCol)
      auditRec.set('user', userId)
      auditRec.set('acao', 'Atualização: ' + colName)
      auditRec.set('tabela', colName)
      auditRec.set('registro_id', rec.id)
      auditRec.set('dados', {
        id: rec.id,
        user_name: userName,
        updated_at: new Date().toISOString(),
      })
      $app.save(auditRec)
    }
  } catch (err) {
    // Prevent audit failures from breaking record updates
  }
})

onRecordAfterDeleteSuccess((e) => {
  try {
    if (!e || !e.record) return
    var rec = e.record
    var colName = rec.collectionName || ''
    if (colName === 'auditoria') return

    var userId = ''
    try {
      if (e.auth && e.auth.id) {
        userId = e.auth.id
      } else if (rec.get && rec.get('user')) {
        userId = rec.get('user')
      } else if (rec.get && rec.get('atualizado_por')) {
        userId = rec.get('atualizado_por')
      }
    } catch (_) {}

    if (!userId) return

    var userName = ''
    try {
      var uRec = $app.findRecordById('users', userId)
      if (uRec) {
        userName = uRec.getString('name') || uRec.get('name') || uRec.getString('email') || ''
      }
    } catch (_) {}

    var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
    if (auditoriaCol) {
      var auditRec = new Record(auditoriaCol)
      auditRec.set('user', userId)
      auditRec.set('acao', 'Exclusão: ' + colName)
      auditRec.set('tabela', colName)
      auditRec.set('registro_id', rec.id)
      auditRec.set('dados', {
        id: rec.id,
        user_name: userName,
        deleted_at: new Date().toISOString(),
      })
      $app.save(auditRec)
    }
  } catch (err) {
    // Prevent audit failures from breaking record deletion
  }
})
