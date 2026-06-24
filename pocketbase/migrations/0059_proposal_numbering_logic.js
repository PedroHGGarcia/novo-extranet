migrate(
  (app) => {
    const records = app.findRecordsByFilter('propostas', '', 'created', 10000, 0)
    let baseNum = 39130

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const currentNum = rec.getString('numero_proposta') || ''

      if (!currentNum.match(/^\d+-[A-Z]+$/)) {
        baseNum++
        rec.set('numero_proposta', `${baseNum}-A`)
        rec.set('revisao', 'A')
        app.save(rec)
      } else {
        const parts = currentNum.split('-')
        const parsed = parseInt(parts[0], 10)
        if (!isNaN(parsed) && parsed > baseNum) {
          baseNum = parsed
        }
      }
    }
  },
  (app) => {
    // No easy revert, preserving structure
  },
)
