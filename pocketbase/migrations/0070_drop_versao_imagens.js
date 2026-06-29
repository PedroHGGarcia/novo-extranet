migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('versao_imagens')
      app.delete(col)
    } catch (_) {}
  },
  (app) => {},
)
