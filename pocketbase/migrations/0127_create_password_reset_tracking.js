migrate(
  (app) => {
    const collection = new Collection({
      name: 'password_reset_tracking',
      type: 'base',
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'email', type: 'text', required: true },
        { name: 'send_count', type: 'number', required: true, onlyInt: true },
        { name: 'window_start', type: 'number', required: true, onlyInt: true },
        { name: 'last_send', type: 'number', required: true, onlyInt: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_password_reset_tracking_email ON password_reset_tracking (email)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('password_reset_tracking')
      app.delete(collection)
    } catch (_) {}
  },
)
