onRecordAfterCreateSuccess((e) => {
  const adminOrUser = e.auth?.id || null
  if (e.collection.name === 'auditoria') return e.next()

  try {
    const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
    if (adminOrUser) {
      auditoria.set('user', adminOrUser)
    }
    auditoria.set('acao', 'create')
    auditoria.set('tabela', e.collection.name)
    auditoria.set('registro_id', e.record.id)
    auditoria.set('dados', e.record.publicExport())
    $app.saveNoValidate(auditoria)
  } catch (err) {
    console.log('Erro ao salvar auditoria', err.message)
  }
  return e.next()
})

onRecordAfterUpdateSuccess((e) => {
  const adminOrUser = e.auth?.id || null
  if (e.collection.name === 'auditoria') return e.next()

  try {
    const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
    if (adminOrUser) {
      auditoria.set('user', adminOrUser)
    }
    auditoria.set('acao', 'update')
    auditoria.set('tabela', e.collection.name)
    auditoria.set('registro_id', e.record.id)
    auditoria.set('dados', {
      old: e.record.original().publicExport(),
      new: e.record.publicExport(),
    })
    $app.saveNoValidate(auditoria)
  } catch (err) {
    console.log('Erro ao salvar auditoria', err.message)
  }
  return e.next()
})

onRecordAfterDeleteSuccess((e) => {
  const adminOrUser = e.auth?.id || null
  if (e.collection.name === 'auditoria') return e.next()

  try {
    const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
    if (adminOrUser) {
      auditoria.set('user', adminOrUser)
    }
    auditoria.set('acao', 'delete')
    auditoria.set('tabela', e.collection.name)
    auditoria.set('registro_id', e.record.id)
    auditoria.set('dados', e.record.publicExport())
    $app.saveNoValidate(auditoria)
  } catch (err) {
    console.log('Erro ao salvar auditoria', err.message)
  }
  return e.next()
})
