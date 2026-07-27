migrate(
  (app) => {
    app.runInTransaction((txApp) => {
      var allReps = txApp.findRecordsByFilter('representantes', "id != ''", '-updated', 10000, 0)
      if (allReps.length === 0) return

      var adminUserId = ''
      try {
        var admins = txApp.findRecordsByFilter('users', "role = 'admin'", '-created', 1, 0)
        if (admins.length > 0) adminUserId = admins[0].id
      } catch (_) {}
      if (!adminUserId) return

      var auditoriaCol = txApp.findCollectionByNameOrId('auditoria')

      var checkFields = [
        'fantasia',
        'sigla',
        'telefone',
        'cidade',
        'uf',
        'dt_cad',
        'status',
        'coordenadas',
        'documento',
        'kml_style',
        'razao_social',
        'rd_station_id',
        'telefone_principal',
        'emails',
        'regiao_texto',
        'cep',
        'bairro',
        'logradouro',
        'numero',
        'complementos',
        'categorias_rel',
        'regioes_rel',
      ]

      var groups = {}
      for (var i = 0; i < allReps.length; i++) {
        var rep = allReps[i]
        var fantasia = (rep.getString('fantasia') || '').trim().toLowerCase()
        var razaoSocial = (rep.getString('razao_social') || '').trim().toLowerCase()
        var key = ''
        if (fantasia !== '') {
          key = 'f:' + fantasia
        } else if (razaoSocial !== '') {
          key = 'r:' + razaoSocial
        } else {
          continue
        }
        if (!groups[key]) groups[key] = []
        groups[key].push(rep)
      }

      var hasDuplicates = false
      for (var hk in groups) {
        if (Object.prototype.hasOwnProperty.call(groups, hk) && groups[hk].length > 1) {
          hasDuplicates = true
          break
        }
      }
      if (!hasDuplicates) return

      var allPrepostos = txApp.findRecordsByFilter('prepostos', "id != ''", '-created', 10000, 0)

      var totalDeleted = 0
      var totalRelinkedPropostas = 0
      var totalRelinkedPrepostos = 0

      for (var groupKey in groups) {
        if (!Object.prototype.hasOwnProperty.call(groups, groupKey)) continue
        var groupReps = groups[groupKey]
        if (groupReps.length <= 1) continue

        var scored = []
        for (var j = 0; j < groupReps.length; j++) {
          var r = groupReps[j]
          var filledCount = 0
          for (var fi = 0; fi < checkFields.length; fi++) {
            var val = r.get(checkFields[fi])
            if (val !== null && val !== undefined && val !== '') {
              if (Array.isArray(val) && val.length === 0) continue
              filledCount++
            }
          }
          scored.push({
            rep: r,
            filled: filledCount,
            updated: r.getString('updated') || '',
          })
        }

        scored.sort(function (a, b) {
          if (b.filled !== a.filled) return b.filled - a.filled
          return (b.updated || '').localeCompare(a.updated || '')
        })

        var keptRep = scored[0].rep
        var keptId = keptRep.id
        var keptFantasia = (keptRep.getString('fantasia') || '').trim()
        var keptRazaoSocial = (keptRep.getString('razao_social') || '').trim()
        var keptName = keptFantasia !== '' ? keptFantasia : keptRazaoSocial

        for (var d = 1; d < scored.length; d++) {
          var dupRep = scored[d].rep
          var dupId = dupRep.id
          var dupFantasia = (dupRep.getString('fantasia') || '').trim()
          var dupRazaoSocial = (dupRep.getString('razao_social') || '').trim()
          var dupName = dupFantasia !== '' ? dupFantasia : dupRazaoSocial

          var originalData = {}
          for (var ofi = 0; ofi < checkFields.length; ofi++) {
            var fieldName = checkFields[ofi]
            originalData[fieldName] = dupRep.get(fieldName)
          }
          originalData.id = dupId
          originalData.created = dupRep.getString('created') || ''
          originalData.updated = dupRep.getString('updated') || ''

          var propostas = txApp.findRecordsByFilter(
            'propostas',
            "representante = '" + dupId + "'",
            '-created',
            10000,
            0,
          )
          for (var p = 0; p < propostas.length; p++) {
            var proposta = propostas[p]
            proposta.set('representante', keptId)

            var repOriginal = (proposta.getString('representante_original') || '').trim()
            if (repOriginal !== '' && repOriginal.toLowerCase() === dupName.toLowerCase()) {
              proposta.set('representante_original', keptName)
            }

            txApp.save(proposta)
            totalRelinkedPropostas++
          }

          for (var pp = 0; pp < allPrepostos.length; pp++) {
            var preposto = allPrepostos[pp]
            var prepostoRep = (preposto.getString('representante') || '').trim()
            if (prepostoRep !== '' && prepostoRep.toLowerCase() === dupName.toLowerCase()) {
              preposto.set('representante', keptName)
              txApp.save(preposto)
              totalRelinkedPrepostos++
            }
          }

          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', adminUserId)
          auditRec.set('acao', 'Remover representante duplicado')
          auditRec.set('tabela', 'representantes')
          auditRec.set('registro_id', dupId)
          auditRec.set('dados', {
            registro_original: originalData,
            kept_record_id: keptId,
            kept_record_name: keptName,
            relinked_propostas: propostas.length,
            timestamp: new Date().toISOString(),
          })
          txApp.save(auditRec)

          txApp.delete(dupRep)
          totalDeleted++
        }
      }

      console.log(
        'Deduplicação de representantes concluída: ' +
          totalDeleted +
          ' duplicados removidos, ' +
          totalRelinkedPropostas +
          ' propostas re-vinculadas, ' +
          totalRelinkedPrepostos +
          ' prepostos re-vinculados.',
      )
    })
  },
  (app) => {
    // Downgrade not possible — deletions are permanent
  },
)
