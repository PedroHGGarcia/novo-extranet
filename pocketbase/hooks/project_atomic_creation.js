onRecordCreate((e) => {
  if (!e.record) return e.next()

  if (!e.record.get('user')) {
    if (e.auth && e.auth.id) {
      e.record.set('user', e.auth.id)
    }
  }

  if (!e.record.get('status')) {
    e.record.set('status', 'Em Andamento')
  }

  var nome = e.record.getString('nome') || ''
  if (!nome.trim()) {
    throw new BadRequestError('Dados inválidos', {
      nome: new ValidationError('validation_required', 'Nome é obrigatório'),
    })
  }

  if (!e.record.get('cliente')) {
    throw new BadRequestError('Dados inválidos', {
      cliente: new ValidationError('validation_required', 'Cliente é obrigatório'),
    })
  }

  e.next()
}, 'projetos')
