onRecordAfterUpdateSuccess((e) => {
  function normalize(v) {
    if (v === null || v === undefined || v === '') return ''
    return String(v)
  }

  var SENSITIVE_FIELDS = {
    documento: 'CNPJ/CPF',
    razao_social: 'Razão Social',
    email_fiscal: 'E-mail Fiscal',
    limite_credito: 'Limite de Crédito',
  }

  var changes = []
  for (var field in SENSITIVE_FIELDS) {
    var oldVal = normalize(e.record.original().get(field))
    var newVal = normalize(e.record.get(field))
    if (oldVal !== newVal) {
      changes.push(SENSITIVE_FIELDS[field])
    }
  }

  if (changes.length === 0) return e.next()

  var userName =
    (e.auth && e.auth.getString('name')) || (e.auth && e.auth.getString('email')) || 'Sistema'
  var fantasia = e.record.getString('fantasia')
  var fieldNames = changes.join(', ')
  var message =
    'O campo ' + fieldNames + ' do cliente "' + fantasia + '" foi alterado por ' + userName + '.'

  var admins = $app.findRecordsByFilter('users', "role = 'admin'", '', 0, 0)
  var notifCol = $app.findCollectionByNameOrId('notificacoes')

  for (var i = 0; i < admins.length; i++) {
    var notif = new Record(notifCol)
    notif.set('user', admins[i].id)
    notif.set('titulo', 'Alteração Crítica Detectada')
    notif.set('mensagem', message)
    notif.set('lida', false)
    notif.set('tipo', 'alerta')
    $app.saveNoValidate(notif)
  }

  return e.next()
}, 'clientes')
