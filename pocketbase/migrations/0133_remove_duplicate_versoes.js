migrate(
  (app) => {
    app.runInTransaction((txApp) => {
      var allVersoes = txApp.findRecordsByFilter('versoes', "id != ''", '-updated', 10000, 0)
      if (allVersoes.length === 0) return

      var adminUserId = ''
      try {
        var admins = txApp.findRecordsByFilter('users', "role = 'admin'", '-created', 1, 0)
        if (admins.length > 0) adminUserId = admins[0].id
      } catch (_) {}
      if (!adminUserId) return

      var auditoriaCol = txApp.findCollectionByNameOrId('auditoria')

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
        'desconto_max_representante',
        'desconto_max_bener',
        'estoque_total',
        'estoque_bloqueado',
        'estoque_reservado',
        'estoque_disponivel',
        'acessorios_standards',
        'caracteristicas_construtivas',
        'especificacoes_tecnicas',
        'tipos_proposta',
        'status',
        'imagem_preview',
        'galeria',
      ]

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

      var allAcessorios = txApp.findRecordsByFilter('acessorios', "id != ''", '-created', 10000, 0)

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
          scored.push({
            versao: item,
            filled: filledCount,
            updated: item.getString('updated') || '',
          })
        }

        scored.sort(function (a, b) {
          if (b.filled !== a.filled) return b.filled - a.filled
          return (b.updated || '').localeCompare(a.updated || '')
        })

        var keptVersao = scored[0].versao
        var keptId = keptVersao.id

        for (var d = 1; d < scored.length; d++) {
          var dupVersao = scored[d].versao
          var dupId = dupVersao.id

          var originalData = {}
          for (var ofi = 0; ofi < checkFields.length; ofi++) {
            var fieldName = checkFields[ofi]
            originalData[fieldName] = dupVersao.get(fieldName)
          }
          originalData.id = dupId
          originalData.created = dupVersao.getString('created') || ''
          originalData.updated = dupVersao.getString('updated') || ''

          var propostas = txApp.findRecordsByFilter(
            'propostas',
            "versao = '" + dupId + "'",
            '-created',
            10000,
            0,
          )
          for (var p = 0; p < propostas.length; p++) {
            var proposta = propostas[p]
            proposta.set('versao', keptId)

            var versaoOriginal = (proposta.getString('versao_original') || '').trim()
            if (versaoOriginal !== '') {
              var dupNome = (dupVersao.getString('nome') || '').trim()
              var keptNome = (keptVersao.getString('nome') || '').trim()
              if (versaoOriginal.toLowerCase() === dupNome.toLowerCase()) {
                proposta.set('versao_original', keptNome)
              }
            }

            var versoesComparacao = proposta.get('versoes_comparacao')
            if (versoesComparacao && typeof versoesComparacao === 'object') {
              var vcArray = Array.isArray(versoesComparacao) ? versoesComparacao : []
              var modified = false
              for (var vc = 0; vc < vcArray.length; vc++) {
                if (vcArray[vc] === dupId) {
                  vcArray[vc] = keptId
                  modified = true
                }
              }
              if (modified) {
                proposta.set('versoes_comparacao', vcArray)
              }
            }

            txApp.save(proposta)
            totalRelinkedPropostas++
          }

          for (var ac = 0; ac < allAcessorios.length; ac++) {
            var acessorio = allAcessorios[ac]
            var versoesRel = acessorio.get('versoes')
            if (versoesRel && Array.isArray(versoesRel)) {
              var modifiedAc = false
              var newVersoes = []
              for (var ri = 0; ri < versoesRel.length; ri++) {
                if (versoesRel[ri] === dupId) {
                  if (newVersoes.indexOf(keptId) === -1) {
                    newVersoes.push(keptId)
                  }
                  modifiedAc = true
                } else {
                  newVersoes.push(versoesRel[ri])
                }
              }
              if (modifiedAc) {
                acessorio.set('versoes', newVersoes)
                txApp.save(acessorio)
                totalRelinkedAcessorios++
              }
            }
          }

          var auditRec = new Record(auditoriaCol)
          auditRec.set('user', adminUserId)
          auditRec.set('acao', 'Remover versão duplicada')
          auditRec.set('tabela', 'versoes')
          auditRec.set('registro_id', dupId)
          auditRec.set('dados', {
            registro_original: originalData,
            kept_record_id: keptId,
            kept_record_nome: (keptVersao.getString('nome') || '').trim(),
            relinked_propostas: propostas.length,
            timestamp: new Date().toISOString(),
          })
          txApp.save(auditRec)

          txApp.delete(dupVersao)
          totalDeleted++
        }
      }

      console.log(
        'Deduplicação de versões concluída: ' +
          totalDeleted +
          ' duplicados removidos, ' +
          totalRelinkedPropostas +
          ' propostas re-vinculadas, ' +
          totalRelinkedAcessorios +
          ' acessórios re-vinculados.',
      )
    })
  },
  (app) => {
    // Downgrade not possible — deletions are permanent
  },
)
