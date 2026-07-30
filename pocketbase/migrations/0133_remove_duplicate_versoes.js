migrate(
  (app) => {
    var allVersoes = app.findRecordsByFilter('versoes', "id != ''", '-updated', 500, 0)
    if (allVersoes.length === 0) return

    var adminUserId = ''
    try {
      var admins = app.findRecordsByFilter('users', "role = 'admin'", '-created', 1, 0)
      if (admins.length > 0) adminUserId = admins[0].id
    } catch (_) {}
    if (!adminUserId) return

    var auditoriaCol = app.findCollectionByNameOrId('auditoria')

    var groups = {}
    for (var i = 0; i < allVersoes.length; i++) {
      var v = allVersoes[i]
      var codErp = (v.getString('cod_erp') || '').trim()
      var nome = (v.getString('nome') || '').trim().toLowerCase()
      var modelo = (v.getString('modelo') || '').trim()

      var key = ''
      if (codErp !== '') {
        key = 'c:' + codErp
      } else if (nome !== '' && modelo !== '') {
        key = 'n:' + nome + '|' + modelo
      } else if (nome !== '') {
        key = 'n:' + nome + '|'
      } else {
        continue
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    }

    var hasDuplicates = false
    for (var hk in groups) {
      if (Object.prototype.hasOwnProperty.call(groups, hk) && groups[hk].length > 1) {
        hasDuplicates = true
        break
      }
    }
    if (!hasDuplicates) return

    var checkFields = [
      'nome',
      'cod_erp',
      'modelo',
      'moeda',
      'valor',
      'tem_fator',
      'fator_nac',
      'nome_abreviado',
      'tem_estoque',
      'status',
      'imagem_preview',
    ]

    var totalDeleted = 0
    var totalRelinkedPropostas = 0
    var totalRelinkedAcessorios = 0

    for (var groupKey in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, groupKey)) continue
      var groupItems = groups[groupKey]
      if (groupItems.length <= 1) continue

      var scored = []
      for (var j = 0; j < groupItems.length; j++) {
        var item = groupItems[j]
        var filledCount = 0
        for (var fi = 0; fi < checkFields.length; fi++) {
          var val = item.get(checkFields[fi])
          if (val !== null && val !== undefined && val !== '') {
            if (Array.isArray(val) && val.length === 0) continue
            filledCount++
          }
        }
        scored.push({ versao: item, filled: filledCount, updated: item.getString('updated') || '' })
      }

      scored.sort(function (a, b) {
        if (b.filled !== a.filled) return b.filled - a.filled
        return (b.updated || '').localeCompare(a.updated || '')
      })

      var keptVersao = scored[0].versao
      var keptId = keptVersao.id
      var keptNome = (keptVersao.getString('nome') || '').trim()

      for (var d = 1; d < scored.length; d++) {
        var dupVersao = scored[d].versao
        var dupId = dupVersao.id
        var dupNome = (dupVersao.getString('nome') || '').trim()

        try {
          var propostas = app.findRecordsByFilter(
            'propostas',
            "versao = '" + dupId + "'",
            '-created',
            500,
            0,
          )
          for (var p = 0; p < propostas.length; p++) {
            var proposta = propostas[p]
            proposta.set('versao', keptId)

            var versaoOriginal = (proposta.getString('versao_original') || '').trim()
            if (versaoOriginal !== '' && versaoOriginal.toLowerCase() === dupNome.toLowerCase()) {
              proposta.set('versao_original', keptNome)
            }

            app.save(proposta)
            totalRelinkedPropostas++
          }
        } catch (_) {}

        try {
          var acessorios = app.findRecordsByFilter(
            'acessorios',
            "versoes = '" + dupId + "'",
            '-created',
            500,
            0,
          )
          for (var ac = 0; ac < acessorios.length; ac++) {
            var acessorio = acessorios[ac]
            var versoesRel = acessorio.get('versoes')
            if (versoesRel && Array.isArray(versoesRel)) {
              var newVersoes = []
              for (var ri = 0; ri < versoesRel.length; ri++) {
                if (versoesRel[ri] === dupId) {
                  if (newVersoes.indexOf(keptId) === -1) newVersoes.push(keptId)
                } else {
                  newVersoes.push(versoesRel[ri])
                }
              }
              acessorio.set('versoes', newVersoes)
              app.save(acessorio)
              totalRelinkedAcessorios++
            }
          }
        } catch (_) {}

        try {
          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', adminUserId)
          auditRec.set('acao', 'Remover versao duplicada')
          auditRec.set('tabela', 'versoes')
          auditRec.set('registro_id', dupId)
          auditRec.set('dados', {
            kept_record_id: keptId,
            kept_record_nome: keptNome,
            relinked_propostas: totalRelinkedPropostas,
          })
          app.save(auditRec)
        } catch (_) {}

        app.delete(dupVersao)
        totalDeleted++
      }
    }

    console.log(
      'Deduplicacao concluida: ' +
        totalDeleted +
        ' removidos, ' +
        totalRelinkedPropostas +
        ' propostas, ' +
        totalRelinkedAcessorios +
        ' acessorios.',
    )
  },
  (app) => {},
)
