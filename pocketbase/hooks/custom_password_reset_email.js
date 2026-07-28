onMailerBeforeSend((e) => {
  try {
    var message = e.message
    var html = message.html || ''
    var subject = message.subject || ''

    var subjectLower = subject.toLowerCase()
    var isPasswordReset =
      subjectLower.indexOf('reset') !== -1 && subjectLower.indexOf('password') !== -1

    if (!isPasswordReset) {
      return e.next()
    }

    var resetUrl = ''
    var hrefMatch = html.match(/href=["']([^"'<>]*(?:password|reset)[^"'<>]*)["']/i)
    if (hrefMatch) {
      resetUrl = hrefMatch[1]
    } else {
      var anyHref = html.match(/href=["']([^"'<>]+)["']/i)
      if (anyHref) {
        resetUrl = anyHref[1]
      } else {
        var urlMatch = html.match(/https?:\/\/[^\s"'<>]+/)
        if (urlMatch) {
          resetUrl = urlMatch[0]
        }
      }
    }

    if (!resetUrl) {
      $app
        .logger()
        .error('custom_password_reset_email: could not extract reset URL from original email')
      return e.next()
    }

    var customHtml = ''
    customHtml += '<!DOCTYPE html>'
    customHtml += '<html lang="pt-BR">'
    customHtml +=
      '<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head>'
    customHtml +=
      '<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f5f7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">'
    customHtml +=
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;">'
    customHtml += '<tr><td align="center" style="padding:40px 16px;">'
    customHtml +=
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">'

    customHtml += '<tr>'
    customHtml += '<td align="center" style="background-color:#0f3d29;padding:40px 32px;">'
    customHtml +=
      '<h1 style="margin:0;color:#ffffff;font-size:36px;font-weight:900;letter-spacing:8px;font-family:Arial,Helvetica,sans-serif;">BENER</h1>'
    customHtml +=
      '<p style="margin:8px 0 0;color:#a8d5c2;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">M&aacute;quinas que transformam</p>'
    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml += '<tr>'
    customHtml += '<td style="padding:40px 32px;">'
    customHtml +=
      '<h2 style="margin:0 0 16px;color:#1a1a2e;font-size:22px;font-weight:700;">Redefini&ccedil;&atilde;o de Senha</h2>'
    customHtml +=
      '<p style="margin:0 0 16px;color:#4a4a68;font-size:15px;line-height:1.6;">Ol&aacute;! Recebemos uma solicita&ccedil;&atilde;o para redefinir a senha da sua conta no Extranet BENER. Para criar uma nova senha, clique no bot&atilde;o abaixo:</p>'

    customHtml += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    customHtml += '<tr><td align="center" style="padding:24px 0;">'
    customHtml +=
      '<a href="' +
      resetUrl +
      '" style="display:inline-block;background-color:#0f3d29;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 40px;border-radius:50px;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Redefinir Senha</a>'
    customHtml += '</td></tr>'
    customHtml += '</table>'

    customHtml +=
      '<p style="margin:16px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">Este link expira em 2 horas por motivos de seguran&ccedil;a. Se o bot&atilde;o acima n&atilde;o funcionar, copie e cole o seguinte link no seu navegador:</p>'
    customHtml +=
      '<p style="margin:8px 0 0;color:#6b7280;font-size:12px;line-height:1.5;word-break:break-all;">' +
      resetUrl +
      '</p>'
    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml +=
      '<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>'

    customHtml += '<tr>'
    customHtml += '<td style="padding:32px;background-color:#fafbfc;">'
    customHtml +=
      '<p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.6;">Se voc&ecirc; n&atilde;o solicitou esta altera&ccedil;&atilde;o, ignore este e-mail. Sua senha permanecer&aacute; inalterada.</p>'
    customHtml +=
      '<p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">&copy; BENER M&aacute;quinas &mdash; Extranet BENER<br>Este &eacute; um e-mail autom&aacute;tico. Por favor, n&atilde;o responda.</p>'
    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml += '</table>'
    customHtml += '</td></tr>'
    customHtml += '</table>'
    customHtml += '</body>'
    customHtml += '</html>'

    message.html = customHtml
    message.subject = 'Redefini\u00e7\u00e3o de Senha \u2014 BENER'

    if (message.text) {
      message.text =
        'Ol\u00e1! Voc\u00ea solicitou a redefini\u00e7\u00e3o de sua senha no Extranet BENER.\n\nAcesse o link abaixo para redefinir sua senha:\n' +
        resetUrl +
        '\n\nEste link expira em 2 horas.\n\nSe voc\u00ea n\u00e3o solicitou esta altera\u00e7\u00e3o, ignore este e-mail. Sua senha permanecer\u00e1 inalterada.\n\nBENER M\u00e1quinas - Extranet BENER\nEste \u00e9 um e-mail autom\u00e1tico. Por favor, n\u00e3o responda.'
    }

    return e.next()
  } catch (err) {
    try {
      $app
        .logger()
        .error(
          'custom_password_reset_email: failed to customize password reset email',
          'error',
          err.message || String(err),
        )

      var toEmail = ''
      try {
        if (typeof e.message.to === 'string') {
          toEmail = e.message.to.split(',')[0].trim()
        } else if (e.message.to && e.message.to.length > 0) {
          toEmail = e.message.to[0]
        }
      } catch (_) {}

      if (toEmail) {
        try {
          var userRec = $app.findAuthRecordByEmail('users', toEmail)
          if (userRec) {
            var auditoriaCol = $app.findCollectionByNameOrId('auditoria')
            var auditRec = new Record(auditoriaCol)
            auditRec.set('user', userRec.id)
            auditRec.set(
              'acao',
              'Falha: personaliza\u00e7\u00e3o do email de redefini\u00e7\u00e3o de senha',
            )
            auditRec.set('tabela', 'users')
            auditRec.set('registro_id', userRec.id)
            auditRec.set('dados', {
              error: err.message || String(err),
              timestamp: new Date().toISOString(),
            })
            $app.saveNoValidate(auditRec)
          }
        } catch (_) {}
      }
    } catch (_) {}

    return e.next()
  }
})
