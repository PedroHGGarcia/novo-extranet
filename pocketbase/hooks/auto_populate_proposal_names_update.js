onRecordUpdate((e) => {
  const gerenteId = e.record.get('gerente')
  const representanteId = e.record.get('representante')

  if (gerenteId) {
    try {
      const gerente = $app.findRecordById('gerentes', gerenteId)
      e.record.set('nome_gerente_produto', gerente.getString('nome'))
    } catch (_) {}
  }

  if (representanteId) {
    try {
      const rep = $app.findRecordById('representantes', representanteId)
      const nome = rep.getString('fantasia') || rep.getString('razao_social')
      if (nome) e.record.set('nome_representante_comercial', nome)
    } catch (_) {}
  }

  e.next()
}, 'propostas')
