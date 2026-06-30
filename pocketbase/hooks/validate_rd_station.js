onRecordCreateRequest((e) => {
  const rdStationId = e.record.getString('rd_station_id')

  if (!rdStationId || rdStationId.trim() === '') {
    e.next()
    return
  }

  if (!$secrets.has('RD_STATION_API_TOKEN')) {
    e.next()
    return
  }

  const apiToken = $secrets.get('RD_STATION_API_TOKEN')
  const apiBaseUrl =
    $secrets.get('RD_STATION_API_URL') || 'https://api.rdstation.com.br/platform/contacts/'
  const fullUrl = apiBaseUrl.endsWith('/')
    ? apiBaseUrl + rdStationId
    : apiBaseUrl + '/' + rdStationId

  let isValid = false
  let apiStatus = 0
  let apiErrorMsg = ''

  try {
    const res = $http.send({
      url: fullUrl,
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + apiToken,
        'Content-Type': 'application/json',
      },
      timeout: 10,
    })
    apiStatus = res.statusCode
    isValid = res.statusCode >= 200 && res.statusCode < 300
  } catch (err) {
    apiStatus = 0
    apiErrorMsg = err.message
  }

  try {
    const userId = e.auth ? e.auth.id : ''
    if (userId) {
      const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
      auditoria.set('user', userId)
      auditoria.set('acao', 'rd_station_validation_create')
      auditoria.set('tabela', 'gerentes')
      auditoria.set('registro_id', e.record.id || 'pending')
      auditoria.set('dados', {
        rd_station_id: rdStationId,
        api_status: apiStatus,
        valid: isValid,
        error: apiErrorMsg,
      })
      $app.saveNoValidate(auditoria)
    }
  } catch (err) {
    console.log('Erro ao salvar auditoria RD Station', err.message)
  }

  if (!isValid) {
    e.badRequestError(
      'RD Station ID inválido ou não encontrado. Por favor, verifique o identificador no RD Station.',
    )
    return
  }

  e.next()
}, 'gerentes')

onRecordUpdateRequest((e) => {
  const rdStationId = e.record.getString('rd_station_id')
  const oldRdStationId = e.record.original().getString('rd_station_id')

  if (rdStationId === oldRdStationId) {
    e.next()
    return
  }

  if (!rdStationId || rdStationId.trim() === '') {
    e.next()
    return
  }

  if (!$secrets.has('RD_STATION_API_TOKEN')) {
    e.next()
    return
  }

  const apiToken = $secrets.get('RD_STATION_API_TOKEN')
  const apiBaseUrl =
    $secrets.get('RD_STATION_API_URL') || 'https://api.rdstation.com.br/platform/contacts/'
  const fullUrl = apiBaseUrl.endsWith('/')
    ? apiBaseUrl + rdStationId
    : apiBaseUrl + '/' + rdStationId

  let isValid = false
  let apiStatus = 0
  let apiErrorMsg = ''

  try {
    const res = $http.send({
      url: fullUrl,
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + apiToken,
        'Content-Type': 'application/json',
      },
      timeout: 10,
    })
    apiStatus = res.statusCode
    isValid = res.statusCode >= 200 && res.statusCode < 300
  } catch (err) {
    apiStatus = 0
    apiErrorMsg = err.message
  }

  try {
    const userId = e.auth ? e.auth.id : ''
    if (userId) {
      const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
      auditoria.set('user', userId)
      auditoria.set('acao', 'rd_station_validation_update')
      auditoria.set('tabela', 'gerentes')
      auditoria.set('registro_id', e.record.id || 'pending')
      auditoria.set('dados', {
        rd_station_id: rdStationId,
        old_rd_station_id: oldRdStationId,
        api_status: apiStatus,
        valid: isValid,
        error: apiErrorMsg,
      })
      $app.saveNoValidate(auditoria)
    }
  } catch (err) {
    console.log('Erro ao salvar auditoria RD Station', err.message)
  }

  if (!isValid) {
    e.badRequestError(
      'RD Station ID inválido ou não encontrado. Por favor, verifique o identificador no RD Station.',
    )
    return
  }

  e.next()
}, 'gerentes')
