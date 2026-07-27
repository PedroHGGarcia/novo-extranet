migrate(
  (app) => {
    console.log(
      '⚠️ WARNING: Migration 0122_clear_all_propostas — irreversible data deletion starting.',
    )
    console.log(
      '⚠️ This will permanently delete ALL records from "propostas" and "visualizacoes_proposta".',
    )

    // Delete visualizacoes_proposta first (child records that reference propostas)
    try {
      const vpCount = app.countRecords('visualizacoes_proposta')
      if (vpCount > 0) {
        app.db().newQuery('DELETE FROM visualizacoes_proposta').execute()
        console.log('Deleted ' + vpCount + ' records from visualizacoes_proposta.')
      } else {
        console.log('visualizacoes_proposta already empty — skipping.')
      }
    } catch (e) {
      console.log('visualizacoes_proposta table not found or already empty: ' + e)
    }

    // Delete all propostas (parent records)
    try {
      const pCount = app.countRecords('propostas')
      if (pCount > 0) {
        app.db().newQuery('DELETE FROM propostas').execute()
        console.log('Deleted ' + pCount + ' records from propostas.')
      } else {
        console.log('propostas already empty — skipping.')
      }
    } catch (e) {
      console.log('propostas table not found or already empty: ' + e)
    }

    // Confirm zero records remain
    try {
      const remainingP = app.countRecords('propostas')
      const remainingVp = app.countRecords('visualizacoes_proposta')
      console.log(
        '✅ Confirmation — propostas remaining: ' +
          remainingP +
          ', visualizacoes_proposta remaining: ' +
          remainingVp,
      )
    } catch (e) {
      console.log('Confirmation check failed: ' + e)
    }

    console.log('⚠️ Migration 0122_clear_all_propostas complete. Operation is irreversible.')
  },
  (app) => {
    // Downgrade is not possible — data is permanently deleted
    console.log(
      '0122_clear_all_propostas: downgrade is not possible (data was permanently deleted).',
    )
  },
)
