routerAdd('POST', '/backend/v1/verify-turnstile', (e) => {
  const body = e.requestInfo().body || {}
  const token = body.token

  if (!token || typeof token !== 'string') {
    return e.json(400, {
      success: false,
      error: 'Token CAPTCHA não fornecido',
    })
  }

  const secretKey = $secrets.get('TURNSTILE_SECRET_KEY') || '1x0000000000000000000000000000000AA'

  try {
    const res = $http.send({
      url: 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: secretKey, response: token }),
      timeout: 10,
    })

    if (res.statusCode !== 200) {
      $app.logger().warn('Turnstile verification returned non-200', 'status', res.statusCode)
      return e.json(200, {
        success: true,
        fallback: true,
        message: 'CAPTCHA provider returned non-200 — allowing login as fallback',
      })
    }

    const data = res.json
    if (data.success === true) {
      return e.json(200, { success: true })
    }

    return e.json(400, {
      success: false,
      error: 'Verificação CAPTCHA falhou',
      codes: data['error-codes'] || [],
    })
  } catch (err) {
    $app
      .logger()
      .error('Turnstile verification request failed', 'error', err.message || String(err))
    return e.json(200, {
      success: true,
      fallback: true,
      message: 'CAPTCHA provider unreachable — allowing login as fallback',
    })
  }
})
