onRecordAfterCreateSuccess((e) => {
  var record = e.record
  if (!record) return e.next()

  var pdfFile = record.getString('pdf_anexo') || ''
  if (!pdfFile) return e.next()

  var numeroProposta = record.getString('numero_proposta') || ''
  var valorFinal = record.get('valor_final') || 0
  var moeda = record.getString('moeda') || 'BRL'

  var valorFormatado =
    'R$ ' +
    Number(valorFinal).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  if (moeda === 'USD')
    valorFormatado =
      'US$ ' +
      Number(valorFinal).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  if (moeda === 'EUR')
    valorFormatado =
      'EUR ' +
      Number(valorFinal).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

  var clienteNome = ''
  try {
    var clienteId = record.get('cliente')
    if (clienteId) {
      var cliente = $app.findRecordById('clientes', clienteId)
      clienteNome = cliente.getString('fantasia') || cliente.getString('razao_social') || ''
    }
  } catch (_) {}

  var baseUrl = ''
  try {
    var sObj = $app.settings()
    if (sObj && sObj.meta && sObj.meta.appUrl) baseUrl = sObj.meta.appUrl
  } catch (_) {}
  if (!baseUrl) baseUrl = $secrets.get('SITE_URL') || ''
  if (!baseUrl) {
    var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
    if (pbUrl) {
      if (pbUrl.endsWith('/')) pbUrl = pbUrl.slice(0, -1)
      baseUrl = pbUrl
    }
  }
  if (!baseUrl && e.request && e.request.host) baseUrl = 'https://' + e.request.host
  if (!baseUrl) baseUrl = 'http://127.0.0.1:8090'
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

  var propostaUrl = baseUrl + '/proposta/publico/' + record.id

  var fromName = 'Extranet Gourmet'
  var fromAddress = 'noreply@mail.goskip.dev'
  try {
    var s = $app.settings()
    if (s && s.meta) {
      if (s.meta.senderName) fromName = s.meta.senderName
      if (s.meta.senderAddress) fromAddress = s.meta.senderAddress
    }
  } catch (_) {}

  var subject = 'Proposta ' + numeroProposta + ' \u2014 ' + (clienteNome || 'Cliente')

  var textContent =
    'Prezado(a),\n\n' +
    'Informamos que a proposta abaixo foi atualizada e o documento em PDF segue em anexo.\n\n' +
    'Numero da Proposta: ' +
    numeroProposta +
    '\n' +
    'Cliente: ' +
    (clienteNome || 'N/A') +
    '\n' +
    'Valor Total: ' +
    valorFormatado +
    '\n\n' +
    'Para visualizar a proposta online, acesse o link abaixo:\n' +
    propostaUrl +
    '\n\n' +
    'Atenciosamente,\nExtranet Gourmet \u2014 Portal de Vendas & Gestao'

  var htmlContent =
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
    '<p style="margin: 0 0 16px 0;">Prezado(a),</p>' +
    '<p style="margin: 0 0 16px 0;">Informamos que a proposta abaixo foi atualizada e o documento em PDF segue em anexo.</p>' +
    '<p style="margin: 0 0 12px 0;"><strong>Numero da Proposta:</strong> ' +
    numeroProposta +
    '<br />' +
    '<strong>Cliente:</strong> ' +
    (clienteNome || 'N/A') +
    '<br />' +
    '<strong>Valor Total:</strong> ' +
    valorFormatado +
    '</p>' +
    '<p style="margin: 0 0 12px 0;">Para visualizar a proposta online, acesse o link abaixo:</p>' +
    '<p style="margin: 0 0 20px 0; word-break: break-all;"><a href="' +
    propostaUrl +
    '" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' +
    propostaUrl +
    '</a></p>' +
    '<p style="margin: 0 0 4px 0;">Atenciosamente,</p>' +
    '<p style="margin: 0 0 24px 0; font-weight: 600; color: #1e293b;">Extranet Gourmet \u2014 Portal de Vendas &amp; Gestao</p>' +
    '</div>'

  var recipientEmails = []

  try {
    var userId = record.get('user')
    if (userId) {
      var userRec = $app.findRecordById('users', userId)
      var userEmail = userRec.getString('email') || ''
      if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) recipientEmails.push(userEmail)
    }
  } catch (_) {}

  try {
    var repId = record.get('representante')
    if (repId) {
      var repRec = $app.findRecordById('representantes', repId)
      var repEmails = repRec.getString('emails') || ''
      if (repEmails) {
        var repList = repEmails
          .split(/[\n,;]+/)
          .map(function (s) {
            return s.trim()
          })
          .filter(function (s) {
            return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
          })
        for (var r = 0; r < repList.length; r++) {
          if (recipientEmails.indexOf(repList[r]) === -1) recipientEmails.push(repList[r])
        }
      }
    }
  } catch (_) {}

  try {
    var gerId = record.get('gerente')
    if (gerId) {
      var gerRec = $app.findRecordById('gerentes', gerId)
      var gerEmail = gerRec.getString('email') || ''
      if (gerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gerEmail)) {
        if (recipientEmails.indexOf(gerEmail) === -1) recipientEmails.push(gerEmail)
      }
    }
  } catch (_) {}

  var rawEmails = record.getString('emails_notificacao') || ''
  if (rawEmails) {
    var notifList = []
    try {
      var parsedEmails = JSON.parse(rawEmails)
      if (Array.isArray(parsedEmails)) {
        notifList = parsedEmails
          .map(function (s) {
            return String(s).trim()
          })
          .filter(function (s) {
            return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
          })
      } else {
        throw new Error('not array')
      }
    } catch (_) {
      notifList = rawEmails
        .split(/[\n,;]+/)
        .map(function (s) {
          return s.trim()
        })
        .filter(function (s) {
          return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
        })
    }
    for (var n = 0; n < notifList.length; n++) {
      if (recipientEmails.indexOf(notifList[n]) === -1) recipientEmails.push(notifList[n])
    }
  }

  if (recipientEmails.length === 0) return e.next()

  var pbUrlDl = $secrets.get('PB_INSTANCE_URL') || ''
  if (pbUrlDl.endsWith('/')) pbUrlDl = pbUrlDl.slice(0, -1)
  var fileUrl = pbUrlDl + '/api/files/propostas/' + record.id + '/' + pdfFile

  var fetchHeaders = {}
  var superuserToken = $secrets.get('PB_SUPERUSER_TOKEN')
  if (superuserToken) fetchHeaders['Authorization'] = superuserToken

  var pdfBytes = null
  try {
    var fileRes = $http.send({ url: fileUrl, method: 'GET', headers: fetchHeaders, timeout: 30 })
    if (fileRes.statusCode === 200) pdfBytes = fileRes.body
  } catch (_) {}

  var auditUserId = ''
  try {
    if (e.auth && e.auth.id) auditUserId = e.auth.id
    else if (record.get('user')) auditUserId = record.get('user')
  } catch (_) {}

  var auditoriaCol = null
  try {
    auditoriaCol = $app.findCollectionByNameOrId('auditoria')
  } catch (_) {}

  if (typeof MailerMessage !== 'undefined') {
    for (var i = 0; i < recipientEmails.length; i++) {
      try {
        var message
        if (pdfBytes) {
          message = new MailerMessage({
            from: { name: fromName, address: fromAddress },
            to: [{ address: recipientEmails[i] }],
            subject: subject,
            text: textContent,
            html: htmlContent,
            attachments: [{ filename: 'proposta-' + numeroProposta + '.pdf', content: pdfBytes }],
          })
        } else {
          message = new MailerMessage({
            from: { name: fromName, address: fromAddress },
            to: [{ address: recipientEmails[i] }],
            subject: subject,
            text: textContent,
            html: htmlContent,
          })
        }
        $app.newMailClient().send(message)

        if (auditoriaCol && auditUserId) {
          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', auditUserId)
          auditRec.set('acao', 'envio_email_pdf')
          auditRec.set('tabela', 'propostas')
          auditRec.set('registro_id', record.id)
          auditRec.set('dados', {
            numero_proposta: numeroProposta,
            email: recipientEmails[i],
            status: 'enviado',
            has_pdf: !!pdfBytes,
          })
          $app.save(auditRec)
        }
      } catch (err) {
        if (auditoriaCol && auditUserId) {
          try {
            var errRec = new Record(auditoriaCol)
            errRec.set('user', auditUserId)
            errRec.set('acao', 'erro_envio_email_pdf')
            errRec.set('tabela', 'propostas')
            errRec.set('registro_id', record.id)
            errRec.set('dados', {
              numero_proposta: numeroProposta,
              email: recipientEmails[i],
              status: 'erro',
              erro: err.message || String(err),
            })
            $app.save(errRec)
          } catch (_) {}
        }
      }
    }
  }

  return e.next()
}, 'propostas')

onRecordAfterUpdateSuccess((e) => {
  var record = e.record
  if (!record) return e.next()

  var pdfFile = record.getString('pdf_anexo') || ''
  if (!pdfFile) return e.next()

  var oldPdf = ''
  try {
    if (record.original()) oldPdf = record.original().getString('pdf_anexo') || ''
  } catch (_) {}

  var isNewPdf = pdfFile !== oldPdf

  var numeroProposta = record.getString('numero_proposta') || ''
  var valorFinal = record.get('valor_final') || 0
  var moeda = record.getString('moeda') || 'BRL'

  var valorFormatado =
    'R$ ' +
    Number(valorFinal).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  if (moeda === 'USD')
    valorFormatado =
      'US$ ' +
      Number(valorFinal).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
  if (moeda === 'EUR')
    valorFormatado =
      'EUR ' +
      Number(valorFinal).toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

  var clienteNome = ''
  try {
    var clienteId = record.get('cliente')
    if (clienteId) {
      var cliente = $app.findRecordById('clientes', clienteId)
      clienteNome = cliente.getString('fantasia') || cliente.getString('razao_social') || ''
    }
  } catch (_) {}

  var baseUrl = ''
  try {
    var sObj = $app.settings()
    if (sObj && sObj.meta && sObj.meta.appUrl) baseUrl = sObj.meta.appUrl
  } catch (_) {}
  if (!baseUrl) baseUrl = $secrets.get('SITE_URL') || ''
  if (!baseUrl) {
    var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
    if (pbUrl) {
      if (pbUrl.endsWith('/')) pbUrl = pbUrl.slice(0, -1)
      baseUrl = pbUrl
    }
  }
  if (!baseUrl && e.request && e.request.host) baseUrl = 'https://' + e.request.host
  if (!baseUrl) baseUrl = 'http://127.0.0.1:8090'
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1)

  var propostaUrl = baseUrl + '/proposta/publico/' + record.id

  var fromName = 'Extranet Gourmet'
  var fromAddress = 'noreply@mail.goskip.dev'
  try {
    var s = $app.settings()
    if (s && s.meta) {
      if (s.meta.senderName) fromName = s.meta.senderName
      if (s.meta.senderAddress) fromAddress = s.meta.senderAddress
    }
  } catch (_) {}

  var subject = 'Proposta ' + numeroProposta + ' \u2014 ' + (clienteNome || 'Cliente')

  var textContent =
    'Prezado(a),\n\n' +
    'Informamos que a proposta abaixo foi atualizada e o documento em PDF segue em anexo.\n\n' +
    'Numero da Proposta: ' +
    numeroProposta +
    '\n' +
    'Cliente: ' +
    (clienteNome || 'N/A') +
    '\n' +
    'Valor Total: ' +
    valorFormatado +
    '\n\n' +
    'Para visualizar a proposta online, acesse o link abaixo:\n' +
    propostaUrl +
    '\n\n' +
    'Atenciosamente,\nExtranet Gourmet \u2014 Portal de Vendas & Gestao'

  var htmlContent =
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
    '<p style="margin: 0 0 16px 0;">Prezado(a),</p>' +
    '<p style="margin: 0 0 16px 0;">Informamos que a proposta abaixo foi atualizada e o documento em PDF segue em anexo.</p>' +
    '<p style="margin: 0 0 12px 0;"><strong>Numero da Proposta:</strong> ' +
    numeroProposta +
    '<br />' +
    '<strong>Cliente:</strong> ' +
    (clienteNome || 'N/A') +
    '<br />' +
    '<strong>Valor Total:</strong> ' +
    valorFormatado +
    '</p>' +
    '<p style="margin: 0 0 12px 0;">Para visualizar a proposta online, acesse o link abaixo:</p>' +
    '<p style="margin: 0 0 20px 0; word-break: break-all;"><a href="' +
    propostaUrl +
    '" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' +
    propostaUrl +
    '</a></p>' +
    '<p style="margin: 0 0 4px 0;">Atenciosamente,</p>' +
    '<p style="margin: 0 0 24px 0; font-weight: 600; color: #1e293b;">Extranet Gourmet \u2014 Portal de Vendas &amp; Gestao</p>' +
    '</div>'

  var recipientEmails = []

  try {
    var userId = record.get('user')
    if (userId) {
      var userRec = $app.findRecordById('users', userId)
      var userEmail = userRec.getString('email') || ''
      if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) recipientEmails.push(userEmail)
    }
  } catch (_) {}

  try {
    var repId = record.get('representante')
    if (repId) {
      var repRec = $app.findRecordById('representantes', repId)
      var repEmails = repRec.getString('emails') || ''
      if (repEmails) {
        var repList = repEmails
          .split(/[\n,;]+/)
          .map(function (s) {
            return s.trim()
          })
          .filter(function (s) {
            return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
          })
        for (var r = 0; r < repList.length; r++) {
          if (recipientEmails.indexOf(repList[r]) === -1) recipientEmails.push(repList[r])
        }
      }
    }
  } catch (_) {}

  try {
    var gerId = record.get('gerente')
    if (gerId) {
      var gerRec = $app.findRecordById('gerentes', gerId)
      var gerEmail = gerRec.getString('email') || ''
      if (gerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gerEmail)) {
        if (recipientEmails.indexOf(gerEmail) === -1) recipientEmails.push(gerEmail)
      }
    }
  } catch (_) {}

  var rawEmails = record.getString('emails_notificacao') || ''
  if (rawEmails) {
    var notifList = []
    try {
      var parsedEmails = JSON.parse(rawEmails)
      if (Array.isArray(parsedEmails)) {
        notifList = parsedEmails
          .map(function (s) {
            return String(s).trim()
          })
          .filter(function (s) {
            return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
          })
      } else {
        throw new Error('not array')
      }
    } catch (_) {
      notifList = rawEmails
        .split(/[\n,;]+/)
        .map(function (s) {
          return s.trim()
        })
        .filter(function (s) {
          return s.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
        })
    }
    for (var n = 0; n < notifList.length; n++) {
      if (recipientEmails.indexOf(notifList[n]) === -1) recipientEmails.push(notifList[n])
    }
  }

  if (recipientEmails.length === 0) return e.next()

  if (!isNewPdf) {
    var sentEmails = {}
    try {
      var auditRecords = $app.findRecordsByFilter(
        'auditoria',
        'acao = "envio_email_pdf" && registro_id = "' + record.id + '"',
        '-created',
        1000,
        0,
      )
      for (var a = 0; a < auditRecords.length; a++) {
        try {
          var dadosRaw = auditRecords[a].get('dados')
          var dados = null
          if (typeof dadosRaw === 'string') {
            try {
              dados = JSON.parse(dadosRaw)
            } catch (_) {}
          } else if (dadosRaw && typeof dadosRaw === 'object') {
            dados = dadosRaw
          }
          if (dados && dados.email) sentEmails[dados.email] = true
        } catch (_) {}
      }
    } catch (_) {}

    var filteredEmails = []
    for (var f = 0; f < recipientEmails.length; f++) {
      if (!sentEmails[recipientEmails[f]]) filteredEmails.push(recipientEmails[f])
    }
    recipientEmails = filteredEmails
    if (recipientEmails.length === 0) return e.next()
  }

  var pbUrlDl = $secrets.get('PB_INSTANCE_URL') || ''
  if (pbUrlDl.endsWith('/')) pbUrlDl = pbUrlDl.slice(0, -1)
  var fileUrl = pbUrlDl + '/api/files/propostas/' + record.id + '/' + pdfFile

  var fetchHeaders = {}
  var superuserToken = $secrets.get('PB_SUPERUSER_TOKEN')
  if (superuserToken) fetchHeaders['Authorization'] = superuserToken

  var pdfBytes = null
  try {
    var fileRes = $http.send({ url: fileUrl, method: 'GET', headers: fetchHeaders, timeout: 30 })
    if (fileRes.statusCode === 200) pdfBytes = fileRes.body
  } catch (_) {}

  var auditUserId = ''
  try {
    if (e.auth && e.auth.id) auditUserId = e.auth.id
    else if (record.get('user')) auditUserId = record.get('user')
  } catch (_) {}

  var auditoriaCol = null
  try {
    auditoriaCol = $app.findCollectionByNameOrId('auditoria')
  } catch (_) {}

  if (typeof MailerMessage !== 'undefined') {
    for (var i = 0; i < recipientEmails.length; i++) {
      try {
        var message
        if (pdfBytes) {
          message = new MailerMessage({
            from: { name: fromName, address: fromAddress },
            to: [{ address: recipientEmails[i] }],
            subject: subject,
            text: textContent,
            html: htmlContent,
            attachments: [{ filename: 'proposta-' + numeroProposta + '.pdf', content: pdfBytes }],
          })
        } else {
          message = new MailerMessage({
            from: { name: fromName, address: fromAddress },
            to: [{ address: recipientEmails[i] }],
            subject: subject,
            text: textContent,
            html: htmlContent,
          })
        }
        $app.newMailClient().send(message)

        if (auditoriaCol && auditUserId) {
          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', auditUserId)
          auditRec.set('acao', 'envio_email_pdf')
          auditRec.set('tabela', 'propostas')
          auditRec.set('registro_id', record.id)
          auditRec.set('dados', {
            numero_proposta: numeroProposta,
            email: recipientEmails[i],
            status: 'enviado',
            has_pdf: !!pdfBytes,
          })
          $app.save(auditRec)
        }
      } catch (err) {
        if (auditoriaCol && auditUserId) {
          try {
            var errRec = new Record(auditoriaCol)
            errRec.set('user', auditUserId)
            errRec.set('acao', 'erro_envio_email_pdf')
            errRec.set('tabela', 'propostas')
            errRec.set('registro_id', record.id)
            errRec.set('dados', {
              numero_proposta: numeroProposta,
              email: recipientEmails[i],
              status: 'erro',
              erro: err.message || String(err),
            })
            $app.save(errRec)
          } catch (_) {}
        }
      }
    }
  }

  return e.next()
}, 'propostas')
