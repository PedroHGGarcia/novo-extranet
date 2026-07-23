routerAdd(
  'DELETE',
  '/backend/v1/clientes/clear',
  (e) => {
    const role = e.auth?.getString('role')
    if (role !== 'admin') {
      return e.forbiddenError('Acesso negado. Apenas administradores podem executar esta ação.')
    }

    try {
      let hasRelated = false

      try {
        const propostasRecords = $app.findRecordsByFilter('propostas', "cliente != ''", '', 1, 0)
        if (propostasRecords.length > 0) hasRelated = true
      } catch (_) {}

      try {
        const docsRecords = $app.findRecordsByFilter(
          'documentos_clientes',
          "cliente != ''",
          '',
          1,
          0,
        )
        if (docsRecords.length > 0) hasRelated = true
      } catch (_) {}

      try {
        const projetosRecords = $app.findRecordsByFilter('projetos', "cliente != ''", '', 1, 0)
        if (projetosRecords.length > 0) hasRelated = true
      } catch (_) {}

      if (hasRelated) {
        return e.json(400, {
          error:
            'Não é possível apagar todos os clientes pois existem registros vinculados (propostas, documentos ou projetos). Exclua primeiro os registros dependentes.',
        })
      }

      const quantidadeDeletada = $app.countRecords('clientes')

      $app.db().newQuery('DELETE FROM clientes').execute()

      const auditoria = new Record($app.findCollectionByNameOrId('auditoria'))
      auditoria.set('user', e.auth.id)
      auditoria.set('acao', 'Exclusão em massa de clientes')
      auditoria.set('tabela', 'clientes')
      auditoria.set('registro_id', 'all')
      auditoria.set('dados', { quantidade_deletada: quantidadeDeletada })
      $app.saveNoValidate(auditoria)

      return e.json(200, { success: true, quantidade_deletada: quantidadeDeletada })
    } catch (err) {
      return e.internalServerError('Erro ao limpar dados.')
    }
  },
  $apis.requireAuth(),
)
