onMailerBeforeSend((e) => {
  try {
    var message = e.message
    var html = message.html || ''
    var subject = message.subject || ''

    var subjectLower = subject.toLowerCase()
    var isPasswordReset =
      subjectLower.indexOf('reset') !== -1 ||
      subjectLower.indexOf('password') !== -1 ||
      subjectLower.indexOf('redefinição') !== -1 ||
      subjectLower.indexOf('redefinicao') !== -1 ||
      subjectLower.indexOf('senha') !== -1

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
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">'

    customHtml += '<tr>'
    customHtml += '<td align="center" style="background-color:#0f3d29;padding:36px 32px;">'
    customHtml +=
      '<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:1px;font-family:Arial,Helvetica,sans-serif;">Extranet Gourmet</h1>'
    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml += '<tr>'
    customHtml += '<td style="padding:40px 32px;">'
    customHtml +=
      '<p style="margin:0 0 16px;color:#1a1a2e;font-size:16px;font-weight:600;">Olá,</p>'
    customHtml +=
      '<p style="margin:0 0 24px;color:#4a4a68;font-size:15px;line-height:1.6;">Clique no botão abaixo para redefinir sua senha.</p>'

    customHtml += '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    customHtml += '<tr><td align="center" style="padding:12px 0 28px 0;">'
    customHtml +=
      '<a href="' +
      resetUrl +
      '" style="display:inline-block;background-color:#0f3d29;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 40px;border-radius:50px;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">Redefinir senha</a>'
    customHtml += '</td></tr>'
    customHtml += '</table>'

    customHtml +=
      '<p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">Se você não solicitou a redefinição de sua senha, ignore este e-mail.</p>'

    customHtml +=
      '<p style="margin:0;color:#1a1a2e;font-size:15px;line-height:1.6;">Obrigado,<br>Equipe Extranet Gourmet.</p>'

    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml +=
      '<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0;"></td></tr>'
    customHtml += '<tr>'
    customHtml += '<td style="padding:24px 32px;background-color:#fafbfc;">'
    customHtml +=
      '<p style="margin:0 0 8px;color:#9ca3af;font-size:12px;line-height:1.5;">Se o botão acima não funcionar, copie e cole o seguinte link no seu navegador:</p>'
    customHtml +=
      '<p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;word-break:break-all;">' +
      resetUrl +
      '</p>'
    customHtml += '</td>'
    customHtml += '</tr>'

    customHtml += '</table>'
    customHtml += '</td></tr>'
    customHtml += '</table>'
    customHtml += '</body>'
    customHtml += '</html>'

    message.html = customHtml
    message.subject = 'Redefinição de senha - Extranet Gourmet'

    message.text =
      'Olá,\n\n' +
      'Clique no botão abaixo para redefinir sua senha:\n' +
      resetUrl +
      '\n\n' +
      'Se você não solicitou a redefinição de sua senha, ignore este e-mail.\n\n' +
      'Obrigado,\nEquipe Extranet Gourmet.'

    return e.next()
  } catch (err) {
    $app
      .logger()
      .error(
        'custom_password_reset_email: failed to customize password reset email',
        'error',
        err.message || String(err),
      )
    return e.next()
  }
})
