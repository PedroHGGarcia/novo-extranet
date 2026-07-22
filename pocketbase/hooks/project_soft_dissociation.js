onRecordAfterDeleteSuccess((e) => {
  try {
    var proposals = $app.findRecordsByFilter(
      'propostas',
      'projeto = "' + e.record.id + '"',
      '',
      1000,
      0,
    )
    for (var i = 0; i < proposals.length; i++) {
      proposals[i].set('projeto', null)
      $app.saveNoValidate(proposals[i])
    }
  } catch (err) {
    console.log('Erro ao dissociar propostas do projeto: ' + err.message)
  }
  return e.next()
}, 'projetos')
