routerAdd('POST', '/backend/v1/request-password-reset', (e) => {
  const body = e.requestInfo().body || {}
  const email = ((body.email || '') + '').trim().toLowerCase()
  const token = body.recaptcha_token || body.token || ''

  if (!email) {
    return e.json(400, { success: false, error: 'E-mail é obrigatório.' })
  }

  if (!token) {
    return e.json(400, {
      success: false,
      error: 'Por favor, complete o desafio do reCAPTCHA para continuar.',
    })
  }

  const secretKey =
    $secrets.get('RECAPTCHA_SECRET_KEY') || '6Lc-xGktAAAAAD-Crz9hpn2MIBsEN6vo0H7cMf_N'

  let captchaValid = false
  try {
    const captchaRes = $http.send({
      url: 'https://www.google.com/recaptcha/api/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'secret=' + encodeURIComponent(secretKey) + '&response=' + encodeURIComponent(token),
      timeout: 10,
    })
    if (captchaRes.statusCode !== 200) {
      captchaValid = true
    } else if (captchaRes.json && captchaRes.json.success === true) {
      captchaValid = true
    }
  } catch (err) {
    captchaValid = true
  }

  if (!captchaValid) {
    return e.json(400, {
      success: false,
      error: 'Por favor, complete o desafio do reCAPTCHA para continuar.',
    })
  }

  const now = Date.now()
  const FIFTEEN_MIN_MS = 15 * 60 * 1000
  const SIXTY_SEC_MS = 60 * 1000
  const MAX_SENDS = 3
  const TRACKING_COL = 'password_reset_tracking'

  let tracking = null
  try {
    tracking = $app.findFirstRecordByData(TRACKING_COL, 'email', email)
  } catch (_) {}

  let currentSendCount = 0

  if (tracking) {
    const sendCount = tracking.getInt('send_count') || 0
    const windowStart = tracking.getInt('window_start') || 0
    const lastSend = tracking.getInt('last_send') || 0

    if (now - windowStart >= FIFTEEN_MIN_MS) {
      tracking.set('send_count', 1)
      tracking.set('window_start', now)
      tracking.set('last_send', now)
      $app.save(tracking)
      currentSendCount = 1
    } else if (sendCount >= MAX_SENDS) {
      const remainingMs = windowStart + FIFTEEN_MIN_MS - now
      const remainingSec = Math.ceil(remainingMs / 1000)
      return e.json(429, {
        success: false,
        error:
          'Limite de reenvios atingido. Tente novamente em ' +
          Math.ceil(remainingMs / 60000) +
          ' minutos.',
        cooldown_type: 'long',
        cooldown_remaining_seconds: remainingSec,
        send_count: sendCount,
      })
    } else if (now - lastSend < SIXTY_SEC_MS) {
      const remainingMs = SIXTY_SEC_MS - (now - lastSend)
      const remainingSec = Math.ceil(remainingMs / 1000)
      return e.json(429, {
        success: false,
        error: 'Aguarde ' + remainingSec + ' segundos para reenviar.',
        cooldown_type: 'short',
        cooldown_remaining_seconds: remainingSec,
        send_count: sendCount,
      })
    } else {
      tracking.set('send_count', sendCount + 1)
      tracking.set('last_send', now)
      $app.save(tracking)
      currentSendCount = sendCount + 1
    }
  } else {
    const col = $app.findCollectionByNameOrId(TRACKING_COL)
    tracking = new Record(col)
    tracking.set('email', email)
    tracking.set('send_count', 1)
    tracking.set('window_start', now)
    tracking.set('last_send', now)
    $app.save(tracking)
    currentSendCount = 1
  }

  // Ensure PocketBase app settings have "Extranet Gourmet" as sender display name and app name
  try {
    var settings = $app.settings()
    if (settings) {
      var needsSave = false
      if (!settings.meta) {
        settings.meta = {}
      }
      if (settings.meta.senderName !== 'Extranet Gourmet') {
        settings.meta.senderName = 'Extranet Gourmet'
        needsSave = true
      }
      if (settings.meta.appName !== 'Extranet Gourmet') {
        settings.meta.appName = 'Extranet Gourmet'
        needsSave = true
      }
      if (!settings.meta.senderAddress) {
        settings.meta.senderAddress = 'noreply@mail.goskip.dev'
        needsSave = true
      }
      if (needsSave) {
        $app.save(settings)
      }
    }
  } catch (settingsErr) {
    $app
      .logger()
      .error(
        'password_reset: failed to update settings',
        'error',
        settingsErr.message || String(settingsErr),
      )
  }

  // Generate reset token and send custom email directly if possible
  var emailSent = false

  var userRecord = null
  try {
    userRecord = $app.findAuthRecordByEmail('users', email)
  } catch (_) {}

  if (userRecord) {
    try {
      // Build reset URL
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

      // Get sender info from settings (default to Extranet Gourmet and platform no-reply address)
      var fromName = 'Extranet Gourmet'
      var fromAddress = 'noreply@mail.goskip.dev'
      try {
        var s = $app.settings()
        if (s && s.meta) {
          if (s.meta.senderName) fromName = s.meta.senderName
          if (s.meta.senderAddress) fromAddress = s.meta.senderAddress
        }
      } catch (_) {}

      if (typeof MailerMessage !== 'undefined') {
        var resetToken = userRecord.newPasswordResetToken()
        $app.save(userRecord)
        var resetUrl = baseUrl + '/_/collections/users/confirm-password-reset/' + resetToken

        var subject = 'Solicitação de redefinição de senha'
        var textContent =
          'Prezado(a) usuário(a),\n\n' +
          'Informamos que foi solicitada a redefinição de sua senha de acesso à Extranet Gourmet.\n\n' +
          'Para prosseguir, acesse o link a seguir:\n\n' +
          resetUrl +
          '\n\n' +
          'Caso não tenha solicitado esta alteração, favor desconsiderar este e-mail. Sua senha permanecerá inalterada.\n\n' +
          'Atenciosamente,\n' +
          'Extranet Gourmet — Portal de Vendas & Gestão'

        var siteUrl = $secrets.get('SITE_URL') || 'https://extranetgourmet.goskip.app'
        var bannerImgUrl = (baseUrl || siteUrl) + '/src/assets/editedimage1784831163387-1-0c382.png'

        var htmlContent =
          '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">' +
          '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Prezado(a) usuário(a),</p>' +
          '<p style="margin: 0 0 16px 0; font-size: 15px; letter-spacing: normal;">Informamos que foi solicitada a redefinição de sua senha de acesso à Extranet Gourmet.</p>' +
          '<p style="margin: 0 0 12px 0; font-size: 15px; letter-spacing: normal;">Para prosseguir, acesse o link a seguir:</p>' +
          '<p style="margin: 0 0 20px 0; word-break: break-all; font-size: 15px; letter-spacing: normal;">' +
          '<a href="' +
          resetUrl +
          '" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' +
          resetUrl +
          '</a>' +
          '</p>' +
          '<p style="margin: 0 0 20px 0; font-size: 15px; letter-spacing: normal;">Caso não tenha solicitado esta alteração, favor desconsiderar este e-mail. Sua senha permanecerá inalterada.</p>' +
          '<p style="margin: 0 0 4px 0; font-size: 15px; letter-spacing: normal;">Atenciosamente,</p>' +
          '<p style="margin: 0 0 24px 0; font-size: 15px; font-weight: 600; color: #1e293b; letter-spacing: normal;">Extranet Gourmet — Portal de Vendas & Gestão</p>' +
          '<div style="margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">' +
          '<img src="' +
          bannerImgUrl +
          '" alt="Bener Máquinas Banner" style="max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 0 auto;" />' +
          '</div>' +
          '</div>'

        var message = new MailerMessage({
          from: { name: fromName, address: fromAddress },
          to: [{ address: email }],
          subject: subject,
          text: textContent,
          html: htmlContent,
        })
        $app.newMailClient().send(message)
        emailSent = true
      }
    } catch (err) {
      $app
        .logger()
        .error(
          'password_reset: direct token generation or email send failed',
          'error',
          err.message || String(err),
        )
    }
  }

  // Fallback: call PocketBase built-in endpoint if direct approach failed
  if (!emailSent) {
    var fallbackPbUrl = $secrets.get('PB_INSTANCE_URL') || ''
    var urlsToTry = []
    if (fallbackPbUrl) {
      if (fallbackPbUrl.endsWith('/')) fallbackPbUrl = fallbackPbUrl.slice(0, -1)
      urlsToTry.push(fallbackPbUrl)
    }
    if (e.request && e.request.host) {
      urlsToTry.push('https://' + e.request.host)
    }
    urlsToTry.push('http://127.0.0.1:8080')
    urlsToTry.push('http://127.0.0.1:8090')

    for (var i = 0; i < urlsToTry.length; i++) {
      try {
        var res = $http.send({
          url: urlsToTry[i] + '/api/collections/users/request-password-reset',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email }),
          timeout: 10,
        })
        if (res.statusCode >= 200 && res.statusCode < 300) {
          emailSent = true
          break
        }
      } catch (_) {}
    }

    if (!emailSent) {
      $app.logger().error('password_reset: failed to send reset email on all candidate URLs')
    }
  }

  return e.json(200, {
    success: true,
    send_count: currentSendCount,
    max_sends: MAX_SENDS,
  })
})
