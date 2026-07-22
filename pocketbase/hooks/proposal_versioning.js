onRecordCreateRequest((e) => {
  const revisao = e.record.getString('revisao')
  if (revisao && revisao !== 'A') {
    e.next()
    return
  }

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

  e.next()
}, 'propostas')
