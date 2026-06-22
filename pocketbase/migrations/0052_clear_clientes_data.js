migrate(
  (app) => {
    try {
      app.db().newQuery('DELETE FROM clientes').execute()
    } catch (_) {
      // Ignored if table doesn't exist yet or is already empty
    }
  },
  (app) => {
    // Downgrade is not possible as data is permanently deleted
  },
)
