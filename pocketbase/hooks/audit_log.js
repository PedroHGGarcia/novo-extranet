const collectionsToAudit = [
  'users',
  'clientes',
  'representantes',
  'prepostos',
  'regioes',
  'gerentes',
]

onRecordAfterCreateSuccess((e) => {
  if (!collectionsToAudit.includes(e.collection.name)) return e.next()
  if (!e.auth) return e.next()

  try {
    const audit = new Record($app.findCollectionByNameOrId('auditoria'))
    audit.set('user', e.auth.id)
    audit.set('acao', 'Create')
    audit.set('tabela', e.collection.name)
    audit.set('registro_id', e.record.id)
    audit.set('dados', JSON.parse(JSON.stringify(e.record)))
    $app.saveNoValidate(audit)
  } catch (err) {
    $app.logger().error('Audit Log Create Failed', 'error', err.message)
  }

  return e.next()
})

onRecordAfterUpdateSuccess((e) => {
  if (!collectionsToAudit.includes(e.collection.name)) return e.next()
  if (!e.auth) return e.next()

  try {
    const audit = new Record($app.findCollectionByNameOrId('auditoria'))
    audit.set('user', e.auth.id)
    audit.set('acao', 'Update')
    audit.set('tabela', e.collection.name)
    audit.set('registro_id', e.record.id)
    audit.set('dados', JSON.parse(JSON.stringify(e.record)))
    $app.saveNoValidate(audit)
  } catch (err) {
    $app.logger().error('Audit Log Update Failed', 'error', err.message)
  }

  return e.next()
})

onRecordAfterDeleteSuccess((e) => {
  if (!collectionsToAudit.includes(e.collection.name)) return e.next()
  if (!e.auth) return e.next()

  try {
    const audit = new Record($app.findCollectionByNameOrId('auditoria'))
    audit.set('user', e.auth.id)
    audit.set('acao', 'Delete')
    audit.set('tabela', e.collection.name)
    audit.set('registro_id', e.record.id)
    audit.set('dados', { deleted: true })
    $app.saveNoValidate(audit)
  } catch (err) {
    $app.logger().error('Audit Log Delete Failed', 'error', err.message)
  }

  return e.next()
})
