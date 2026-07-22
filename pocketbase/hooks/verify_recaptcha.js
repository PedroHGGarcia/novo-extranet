routerAdd('POST', '/backend/v1/verify-recaptcha', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token

  if (!token || typeof token !== 'string') {
    return e.json(400, {
      success: false,
      error: 'Token reCAPTCHA não fornecido',
    })
  }

  const secretKey =
    $secrets.get('RECAPTCHA_SECRET_KEY') || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'

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
    if (data.success === true) {
      return e.json(200, { success: true })
    }

    return e.json(400, {
      success: false,
      error: 'Falha na verificação do reCAPTCHA. Por favor, tente novamente.',
      codes: data['error-codes'] || [],
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
