migrate(
  (app) => {
    try {
      app.db().newQuery('DELETE FROM documentos_clientes').execute()
      app.db().newQuery('DELETE FROM clientes').execute()
    } catch (_) {}
  },
  (app) => {
    // Downgrade is not possible as data is permanently deleted
  },
)
