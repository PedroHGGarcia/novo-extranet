onRecordAfterUpdateSuccess((e) => {
  var record = e.record

  var oldStatus = ''
  var newStatus = record.getString('status') || ''
  try {
    if (record.original()) {
      oldStatus = record.original().getString('status') || ''
    }
  } catch (_) {}

  if (oldStatus === newStatus) {
    return e.next()
  }
  if (newStatus !== 'Aprovada' && newStatus !== 'Recusada') {
    return e.next()
  }

  var numeroProposta = record.getString('numero_proposta') || ''
  var motivoPerda = record.getString('motivo_perda') || ''
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
    if (sObj && sObj.meta && sObj.meta.appUrl) {
      baseUrl = sObj.meta.appUrl
    }
  } catch (_) {}
  if (!baseUrl) {
    baseUrl = $secrets.get('SITE_URL') || ''
  }
  if (!baseUrl) {
    var pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
    if (pbUrl) {
      if (pbUrl.endsWith('/')) pbUrl = pbUrl.slice(0, -1)
      baseUrl = pbUrl
    }
  }
  if (!baseUrl && e.request && e.request.host) {
    baseUrl = 'https://' + e.request.host
  }
  if (!baseUrl) {
    baseUrl = 'http://127.0.0.1:8090'
  }
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

  var siteUrl = $secrets.get('SITE_URL') || 'https://extranetgourmet.goskip.app'
  var bannerImgUrl = (baseUrl || siteUrl) + '/src/assets/editedimage1784831163387-1-0c382.png'

  var statusUpper = newStatus === 'Aprovada' ? 'Aprovada' : 'Recusada'
  var subject = 'Proposta ' + numeroProposta + ' – ' + statusUpper

  var motivoText = ''
  if (newStatus === 'Recusada' && motivoPerda) {
    motivoText = '\nMotivo: ' + motivoPerda
  }
  var motivoHtml = ''
  if (newStatus === 'Recusada' && motivoPerda) {
    motivoHtml =
      '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;"><strong>Motivo:</strong> ' +
      motivoPerda +
      '</p>'
  }

  var textContent =
    'Prezado(a),\n\n' +
    'Informamos que a proposta abaixo teve seu status atualizado para "' +
    statusUpper +
    '".\n\n' +
    'Número da Proposta: ' +
    numeroProposta +
    '\n' +
    'Cliente: ' +
    (clienteNome || 'N/A') +
    '\n' +
    'Valor Total: ' +
    valorFormatado +
    '\n' +
    'Novo Status: ' +
    statusUpper +
    motivoText +
    '\n\n' +
    'Para visualizar a proposta, acesse o link abaixo:\n' +
    propostaUrl +
    '\n\n' +
    'Atenciosamente,\n' +
    'Extranet Gourmet — Portal de Vendas & Gestão'

  var htmlContent =
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
    '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Prezado(a),</p>' +
    '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Informamos que a proposta abaixo teve seu status atualizado para <strong>' +
    statusUpper +
    '</strong>.</p>' +
    '<p style="margin: 0 0 12px 0; font-size: 15px; letter-spacing: normal;"><strong>Número da Proposta:</strong> ' +
    numeroProposta +
    '<br />' +
    '<strong>Cliente:</strong> ' +
    (clienteNome || 'N/A') +
    '<br />' +
    '<strong>Valor Total:</strong> ' +
    valorFormatado +
    '<br />' +
    '<strong>Novo Status:</strong> ' +
    statusUpper +
    '</p>' +
    motivoHtml +
    '<p style="margin: 0 0 12px 0; font-size: 15px; letter-spacing: normal;">Para visualizar a proposta, acesse o link abaixo:</p>' +
    '<p style="margin: 0 0 20px 0; word-break: break-all; font-size: 15px; letter-spacing: normal;">' +
    '<a href="' +
    propostaUrl +
    '" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' +
    propostaUrl +
    '</a>' +
    '</p>' +
    '<p style="margin: 0 0 4px 0; font-size: 15px; letter-spacing: normal;">Atenciosamente,</p>' +
    '<p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: #1e293b; letter-spacing: normal;">Extranet Gourmet — Portal de Vendas &amp; Gestão</p>' +
    '<div style="margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">' +
    '<img src="' +
    bannerImgUrl +
    '" alt="Bener Máquinas Banner" style="max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 0 auto;" />' +
    '</div>' +
    '</div>'

  var recipientEmails = []

  // Creator (user)
  try {
    var userId = record.get('user')
    if (userId) {
      var userRec = $app.findRecordById('users', userId)
      var userEmail = userRec.getString('email') || ''
      if (userEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
        recipientEmails.push(userEmail)
      }
    }
  } catch (_) {}

  // Representative
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

  // Manager
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

  // Notification emails field
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

  if (recipientEmails.length === 0) {
    return e.next()
  }

  if (typeof MailerMessage !== 'undefined') {
    for (var i = 0; i < recipientEmails.length; i++) {
      try {
        var message = new MailerMessage({
          from: { name: fromName, address: fromAddress },
          to: [{ address: recipientEmails[i] }],
          subject: subject,
          text: textContent,
          html: htmlContent,
        })
        $app.newMailClient().send(message)
      } catch (err) {
        $app
          .logger()
          .error(
            'email_notify_proposal_status_change: failed to send email',
            'email',
            recipientEmails[i],
            'error',
            err.message || String(err),
          )
      }
    }
  }

  return e.next()
}, 'propostas')
