onRecordUpdate((e) => {
  const oldValor = e.record.original().getFloat('valor')
  const newValor = e.record.getFloat('valor')
  if (oldValor !== newValor) {
    e.record.set('valor_anterior', oldValor)
    e.record.set('data_ultimo_reajuste', new Date().toISOString())
  }
  return e.next()
}, 'versoes')

onRecordUpdate((e) => {
  const oldValor = e.record.original().getFloat('valor')
  const newValor = e.record.getFloat('valor')
  if (oldValor !== newValor) {
    e.record.set('valor_anterior', oldValor)
    e.record.set('data_ultimo_reajuste', new Date().toISOString())
  }
  return e.next()
}, 'acessorios')
