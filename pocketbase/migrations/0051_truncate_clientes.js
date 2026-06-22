migrate(
  (app) => {
    // Clear related documents first to maintain referential integrity
    try {
      app.db().newQuery('DELETE FROM documentos_clientes').execute()
    } catch (_) {
      // Ignored if table doesn't exist yet
    }

    // Clear all clients
    try {
      app.db().newQuery('DELETE FROM clientes').execute()
    } catch (_) {
      // Ignored if table doesn't exist yet
    }
  },
  (app) => {
    // Downgrade is not possible as data is permanently deleted
  },
)
