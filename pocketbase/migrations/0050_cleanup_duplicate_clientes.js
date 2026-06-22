migrate(
  (app) => {
    // 1. Deduplicate by documento (keep most recently updated)
    app
      .db()
      .newQuery(`
    DELETE FROM clientes 
    WHERE documento != '' AND documento IS NOT NULL
      AND id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY documento 
            ORDER BY updated DESC, created DESC, id DESC
          ) as rn
          FROM clientes
          WHERE documento != '' AND documento IS NOT NULL
        ) WHERE rn = 1
      )
  `)
      .execute()

    // 2. Deduplicate by razao_social for records with empty documento
    app
      .db()
      .newQuery(`
    DELETE FROM clientes 
    WHERE (documento = '' OR documento IS NULL) 
      AND razao_social != '' AND razao_social IS NOT NULL
      AND id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY razao_social 
            ORDER BY updated DESC, created DESC, id DESC
          ) as rn
          FROM clientes
          WHERE (documento = '' OR documento IS NULL) 
            AND razao_social != '' AND razao_social IS NOT NULL
        ) WHERE rn = 1
      )
  `)
      .execute()

    // 3. Deduplicate by fantasia for records with empty documento and empty razao_social
    app
      .db()
      .newQuery(`
    DELETE FROM clientes 
    WHERE (documento = '' OR documento IS NULL) 
      AND (razao_social = '' OR razao_social IS NULL) 
      AND fantasia != '' AND fantasia IS NOT NULL
      AND id NOT IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (
            PARTITION BY fantasia 
            ORDER BY updated DESC, created DESC, id DESC
          ) as rn
          FROM clientes
          WHERE (documento = '' OR documento IS NULL) 
            AND (razao_social = '' OR razao_social IS NULL) 
            AND fantasia != '' AND fantasia IS NOT NULL
        ) WHERE rn = 1
      )
  `)
      .execute()

    // Verify and enforce unique index on documento
    const col = app.findCollectionByNameOrId('clientes')
    col.addIndex('idx_clientes_documento', true, 'documento', "documento != ''")
    app.save(col)
  },
  (app) => {
    // Downgrade is not possible as duplicate data has been permanently deleted
  },
)
