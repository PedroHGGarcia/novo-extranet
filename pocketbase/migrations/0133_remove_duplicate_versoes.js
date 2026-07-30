migrate(
  (app) => {
    // Fetch all versoes in paginated batches (500 at a time)
    var allVersoes = []
    var batchOffset = 0
    var batchSize = 500
    while (true) {
      var batch = app.findRecordsByFilter('versoes', "id != ''", '-updated', batchSize, batchOffset)
      if (batch.length === 0) break
      allVersoes = allVersoes.concat(batch)
      if (batch.length < batchSize) break
      batchOffset += batchSize
    }
    if (allVersoes.length === 0) return

    // Resolve admin user for audit records
    var adminUserId = ''
    try {
      var admins = app.findRecordsByFilter('users', "role = 'admin'", '-created', 1, 0)
      if (admins.length > 0) adminUserId = admins[0].id
    } catch (err) {
      throw new Error('Failed to fetch admin user for audit: ' + err.message)
    }
    if (!adminUserId) return

    var auditoriaCol = app.findCollectionByNameOrId('auditoria')

    // Group versoes by dedup key (cod_erp preferred, then nome|modelo, then nome)
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

    // Check if any duplicates exist
    var hasDuplicates = false
    for (var hk in groups) {
      if (Object.prototype.hasOwnProperty.call(groups, hk) && groups[hk].length > 1) {
        hasDuplicates = true
        break
      }
    }
    if (!hasDuplicates) return

    // Build set of duplicate IDs to delete and map dupId -> keptId, dupNome -> keptNome
    var dupToKeep = {}
    var dupNomeToKeptNome = {}
    var dupIdsToDelete = []

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

    for (var groupKey in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, groupKey)) continue
      var groupItems = groups[groupKey]
      if (groupItems.length <= 1) continue

      // Score each item by filled fields count, then by most recently updated
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
        dupToKeep[dupId] = keptId
        if (dupNome !== '') {
          dupNomeToKeptNome[dupNome.toLowerCase()] = keptNome
        }
        dupIdsToDelete.push(dupId)
      }
    }

    if (dupIdsToDelete.length === 0) return

    // Fetch all propostas in paginated batches, build index by versao id
    var propostasByVersao = {}
    var allPropostas = []
    batchOffset = 0
    while (true) {
      var pBatch = app.findRecordsByFilter(
        'propostas',
        "id != ''",
        '-created',
        batchSize,
        batchOffset,
      )
      if (pBatch.length === 0) break
      allPropostas = allPropostas.concat(pBatch)
      if (pBatch.length < batchSize) break
      batchOffset += batchSize
    }

    for (var pi = 0; pi < allPropostas.length; pi++) {
      var prop = allPropostas[pi]
      var versaoId = prop.getString('versao') || ''
      if (versaoId && dupToKeep[versaoId]) {
        if (!propostasByVersao[versaoId]) propostasByVersao[versaoId] = []
        propostasByVersao[versaoId].push(prop)
      }
    }

    // Relink propostas in a single pass
    var totalRelinkedPropostas = 0
    for (var dupIdKey in propostasByVersao) {
      if (!Object.prototype.hasOwnProperty.call(propostasByVersao, dupIdKey)) continue
      var keptIdForProp = dupToKeep[dupIdKey]
      var propList = propostasByVersao[dupIdKey]
      for (var pp = 0; pp < propList.length; pp++) {
        var proposta = propList[pp]
        proposta.set('versao', keptIdForProp)
        var versaoOriginal = (proposta.getString('versao_original') || '').trim()
        if (versaoOriginal !== '' && dupNomeToKeptNome[versaoOriginal.toLowerCase()]) {
          proposta.set('versao_original', dupNomeToKeptNome[versaoOriginal.toLowerCase()])
        }
        app.save(proposta)
        totalRelinkedPropostas++
      }
    }

    // Fetch all acessorios in paginated batches, build index by versoes id
    var acessoriosByVersao = {}
    var allAcessorios = []
    batchOffset = 0
    while (true) {
      var aBatch = app.findRecordsByFilter(
        'acessorios',
        "id != ''",
        '-created',
        batchSize,
        batchOffset,
      )
      if (aBatch.length === 0) break
      allAcessorios = allAcessorios.concat(aBatch)
      if (aBatch.length < batchSize) break
      batchOffset += batchSize
    }

    for (var ai = 0; ai < allAcessorios.length; ai++) {
      var ac = allAcessorios[ai]
      var versoesRel = ac.get('versoes')
      if (versoesRel && Array.isArray(versoesRel)) {
        for (var ri = 0; ri < versoesRel.length; ri++) {
          var vId = versoesRel[ri]
          if (dupToKeep[vId]) {
            if (!acessoriosByVersao[vId]) acessoriosByVersao[vId] = []
            acessoriosByVersao[vId].push(ac)
          }
        }
      }
    }

    // Relink acessorios - deduplicate by acessorio id since one acessorio can match multiple dupIds
    var totalRelinkedAcessorios = 0
    var processedAcessorioIds = {}
    for (var dupAccKey in acessoriosByVersao) {
      if (!Object.prototype.hasOwnProperty.call(acessoriosByVersao, dupAccKey)) continue
      var keptIdForAcc = dupToKeep[dupAccKey]
      var accList = acessoriosByVersao[dupAccKey]
      for (var acc = 0; acc < accList.length; acc++) {
        var acessorio = accList[acc]
        if (processedAcessorioIds[acessorio.id]) continue
        processedAcessorioIds[acessorio.id] = true
        var versoesRel2 = acessorio.get('versoes')
        if (versoesRel2 && Array.isArray(versoesRel2)) {
          var newVersoes = []
          for (var ri2 = 0; ri2 < versoesRel2.length; ri2++) {
            var oldId = versoesRel2[ri2]
            if (dupToKeep[oldId]) {
              if (newVersoes.indexOf(keptIdForAcc) === -1) newVersoes.push(keptIdForAcc)
            } else {
              if (newVersoes.indexOf(oldId) === -1) newVersoes.push(oldId)
            }
          }
          acessorio.set('versoes', newVersoes)
          app.save(acessorio)
          totalRelinkedAcessorios++
        }
      }
    }

    // Fetch dup versao records by id for deletion and write audit entries
    var totalDeleted = 0
    for (var di = 0; di < dupIdsToDelete.length; di++) {
      var dupIdFinal = dupIdsToDelete[di]
      var keptIdFinal = dupToKeep[dupIdFinal]

      // Find the kept record's name for audit
      var keptNomeFinal = ''
      for (var ki = 0; ki < allVersoes.length; ki++) {
        if (allVersoes[ki].id === keptIdFinal) {
          keptNomeFinal = (allVersoes[ki].getString('nome') || '').trim()
          break
        }
      }

      // Find the dup record to delete
      var dupRecord = null
      for (var dj = 0; dj < allVersoes.length; dj++) {
        if (allVersoes[dj].id === dupIdFinal) {
          dupRecord = allVersoes[dj]
          break
        }
      }
      if (!dupRecord) continue

      // Write audit record
      var auditRec = new Record(auditoriaCol)
      auditRec.set('user', adminUserId)
      auditRec.set('acao', 'Remover versao duplicada')
      auditRec.set('tabela', 'versoes')
      auditRec.set('registro_id', dupIdFinal)
      auditRec.set('dados', {
        kept_record_id: keptIdFinal,
        kept_record_nome: keptNomeFinal,
        relinked_propostas: totalRelinkedPropostas,
      })
      app.save(auditRec)

      // Delete the duplicate
      app.delete(dupRecord)
      totalDeleted++
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
