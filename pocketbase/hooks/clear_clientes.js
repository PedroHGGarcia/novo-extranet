routerAdd(
  'DELETE',
  '/backend/v1/clientes/clear',
  (e) => {
    const role = e.auth?.getString('role')
    if (role !== 'admin') {
      return e.forbiddenError('Acesso negado. Apenas administradores podem executar esta ação.')
    }

    try {
      $app.db().newQuery('DELETE FROM documentos_clientes').execute()
      $app.db().newQuery('DELETE FROM clientes').execute()

      return e.json(200, { success: true })
    } catch (err) {
      return e.internalServerError('Erro ao limpar dados.')
    }
  },
  $apis.requireAuth(),
)
