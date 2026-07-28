routerAdd('POST', '/backend/v1/verify-recaptcha', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token

  if (!token || typeof token !== 'string') {
    return e.json(400, {
      success: false,
      error: 'Por favor, complete o desafio do reCAPTCHA para continuar.',
    })
  }

  const secretKey =
    $secrets.get('RECAPTCHA_SECRET_KEY') || '6Lc-xGktAAAAAD-Crz9hpn2MIBsEN6vo0H7cMf_N'

  try {
    const res = $http.send({
      url: 'https://www.google.com/recaptcha/api/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'secret=' + encodeURIComponent(secretKey) + '&response=' + encodeURIComponent(token),
      timeout: 10,
    })

    if (res.statusCode !== 200) {
      $app.logger().warn('reCAPTCHA verification returned non-200', 'status', res.statusCode)
      return e.json(200, {
        success: true,
        fallback: true,
        message: 'reCAPTCHA provider returned non-200 — allowing login as fallback',
      })
    }

    const data = res.json
    if (data && data.success === true) {
      return e.json(200, { success: true })
    }

    return e.json(400, {
      success: false,
      error: 'Por favor, complete o desafio do reCAPTCHA para continuar.',
      codes: (data && data['error-codes']) || [],
    })
  } catch (err) {
    $app
      .logger()
      .error('reCAPTCHA verification request failed', 'error', err.message || String(err))
    return e.json(200, {
      success: true,
      fallback: true,
      message: 'reCAPTCHA provider unreachable — allowing login as fallback',
    })
  }
})
