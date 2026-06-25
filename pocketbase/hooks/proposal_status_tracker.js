onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().getString('status')
  const newStatus = e.record.getString('status')

  if (newStatus && oldStatus !== newStatus) {
    e.record.set('data_alteracao_status', new Date().toISOString())
  }

  e.next()
}, 'propostas')

onRecordCreateRequest((e) => {
  if (e.record.getString('status')) {
    e.record.set('data_alteracao_status', new Date().toISOString())
  }
  e.next()
}, 'propostas')
