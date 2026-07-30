migrate(
  (app) => {
    try {
      var row = app.db().newQuery("SELECT value FROM _params WHERE id = '_settings'").one()
      if (!row || !row.value) {
        console.log('Settings row not found, skipping CORS/rate limit config')
        return
      }
      var settings = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      if (!settings) settings = {}

      if (!settings.cors) settings.cors = {}
      settings.cors.allowedOrigins = ['https://extranetgourmet.goskip.app']
      settings.cors.allowAllOrigins = false
      settings.cors.allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE']
      settings.cors.allowedHeaders = ['Content-Type', 'Authorization']

      if (!settings.rateLimits) settings.rateLimits = {}
      settings.rateLimits.enabled = true
      settings.rateLimits.rules = [
        { label: '', method: '', rate: 300, duration: 60, enabled: true },
        {
          label: '/api/collections/users/auth-with-password',
          method: 'POST',
          rate: 20,
          duration: 60,
          enabled: true,
        },
      ]

      app
        .db()
        .newQuery("UPDATE _params SET value = {:val} WHERE id = '_settings'")
        .bind({ val: JSON.stringify(settings) })
        .execute()

      console.log('CORS and rate limiting settings updated successfully')
    } catch (e) {
      console.log('Failed to update CORS/rate limit settings:', String(e))
    }

    try {
      var auditCol = app.findCollectionByNameOrId('auditoria')
      auditCol.createRule = "@request.auth.id != ''"
      app.save(auditCol)
      console.log('Auditoria create rule updated')
    } catch (e) {
      console.log('Failed to update auditoria create rule:', String(e))
    }
  },
  (app) => {
    try {
      var auditCol = app.findCollectionByNameOrId('auditoria')
      auditCol.createRule = null
      app.save(auditCol)
    } catch (e) {}
  },
)
