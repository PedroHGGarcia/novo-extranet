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

  let pbUrl = $secrets.get('PB_INSTANCE_URL') || ''
  if (!pbUrl) {
    pbUrl = 'https://' + e.request.host
  }
  if (pbUrl.endsWith('/')) pbUrl = pbUrl.slice(0, -1)

  try {
    $http.send({
      url: pbUrl + '/api/collections/users/request-password-reset',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
      timeout: 15,
    })
  } catch (err) {
    $app
      .logger()
      .error('password_reset: failed to send reset email', 'error', err.message || String(err))
  }

  return e.json(200, {
    success: true,
    send_count: currentSendCount,
    max_sends: MAX_SENDS,
  })
})
