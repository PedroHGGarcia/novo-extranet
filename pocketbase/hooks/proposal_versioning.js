onRecordCreateRequest((e) => {
  let maxNum = 39130
  try {
    const records = $app.findRecordsByFilter(
      'propostas',
      "numero_proposta != ''",
      '-created',
      1000,
      0,
    )
    for (const rec of records) {
      const numStr = rec.getString('numero_proposta')
      const parts = numStr.split('-')
      const num = parseInt(parts[0], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  } catch (err) {}

  const nextNum = maxNum + 1
  e.record.set('numero_proposta', nextNum + '-A')
  e.record.set('revisao', 'A')

  e.next()
}, 'propostas')

onRecordUpdateRequest((e) => {
  const oldNumStr = e.record.original().getString('numero_proposta')
  const parts = oldNumStr.split('-')
  let numPart = parts[0]
  let revPart = parts.length > 1 ? parts[1] : 'A'

  let nextRev = String.fromCharCode(revPart.charCodeAt(0) + 1)
  if (revPart === 'Z') nextRev = 'AA'

  e.record.set('numero_proposta', numPart + '-' + nextRev)
  e.record.set('revisao', nextRev)

  try {
    const auditCol = $app.findCollectionByNameOrId('auditoria')
    const auditRecord = new Record(auditCol)

    const userId = e.auth?.id || e.record.original().getString('user') || e.record.getString('user')
    if (userId) {
      auditRecord.set('user', userId)
    }

    auditRecord.set('acao', 'new_version')
    auditRecord.set('tabela', 'propostas')
    auditRecord.set('registro_id', e.record.id)

    const body = e.requestInfo().body || {}
    const changedKeys = Object.keys(body).filter(
      (k) =>
        k !== 'id' &&
        k !== 'created' &&
        k !== 'updated' &&
        k !== 'numero_proposta' &&
        k !== 'revisao' &&
        k !== 'acessorios_proposta',
    )

    if (body.acessorios_proposta) {
      changedKeys.push('acessorios')
    }

    auditRecord.set('dados', {
      version_saved: oldNumStr,
      version_new: numPart + '-' + nextRev,
      changes: changedKeys,
    })

    $app.saveNoValidate(auditRecord)
  } catch (err) {
    console.log('Erro ao salvar histórico de versão: ', err)
  }

  e.next()
}, 'propostas')
