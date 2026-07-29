onRecordUpdate((e) => {
  try {
    const orig = e.record.original()
    if (orig) {
      const oldValor = orig.getFloat ? orig.getFloat('valor') : Number(orig.get('valor') || 0)
      const newValor = e.record.getFloat
        ? e.record.getFloat('valor')
        : Number(e.record.get('valor') || 0)
      if (oldValor !== newValor && !isNaN(oldValor) && !isNaN(newValor)) {
        e.record.set('valor_anterior', oldValor)
        e.record.set('data_ultimo_reajuste', new Date().toISOString().split('T')[0])
      }
    }
  } catch (err) {
    console.log('price_change_tracker versoes error:', err)
  }
  return e.next()
}, 'versoes')

onRecordUpdate((e) => {
  try {
    const orig = e.record.original()
    if (orig) {
      const oldValor = orig.getFloat ? orig.getFloat('valor') : Number(orig.get('valor') || 0)
      const newValor = e.record.getFloat
        ? e.record.getFloat('valor')
        : Number(e.record.get('valor') || 0)
      if (oldValor !== newValor && !isNaN(oldValor) && !isNaN(newValor)) {
        e.record.set('valor_anterior', oldValor)
        e.record.set('data_ultimo_reajuste', new Date().toISOString().split('T')[0])
      }
    }
  } catch (err) {
    console.log('price_change_tracker acessorios error:', err)
  }
  return e.next()
}, 'acessorios')
