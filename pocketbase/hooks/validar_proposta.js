routerAdd('GET', '/backend/v1/validar-proposta/{id}', (e) => {
  const id = e.request.pathValue('id')
  try {
    const record = $app.findRecordById('propostas', id)
    $app.expandRecord(record, ['cliente'])

    let clienteName = record.getString('cliente_original')
    const cliente = record.expandedOne('cliente')
    if (cliente) {
      clienteName =
        cliente.getString('razao_social') || cliente.getString('fantasia') || clienteName
    }

    return e.json(200, {
      id: record.id,
      numero_proposta: record.getString('numero_proposta'),
      cliente_nome: clienteName,
      status: record.getString('status') || 'Em Análise',
      dt_cad: record.getString('dt_cad'),
      data_alteracao_status: record.getString('data_alteracao_status'),
    })
  } catch (err) {
    return e.notFoundError('Proposta não encontrada')
  }
})
