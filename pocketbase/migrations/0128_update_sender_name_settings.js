migrate(
  (app) => {
    try {
      const settings = app.settings()
      if (settings) {
        if (!settings.meta) {
          settings.meta = {}
        }
        settings.meta.appName = 'Extranet Gourmet'
        settings.meta.senderName = 'Extranet Gourmet'
        if (!settings.meta.senderAddress) {
          settings.meta.senderAddress = 'noreply@mail.goskip.dev'
        }
        app.save(settings)
      }
    } catch (err) {
      console.log('Migration 0128 error updating settings: ' + err)
    }
  },
  (app) => {},
)
