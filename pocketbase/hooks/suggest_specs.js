routerAdd(
  'POST',
  '/backend/v1/suggest-specs',
  (e) => {
    const body = e.requestInfo().body || {}
    const type = body.type || 'acessório'
    const versoesIds = body.versoes || []
    const nome = body.nome || ''

    let versoesText = ''
    if (versoesIds.length > 0) {
      const filterStr = versoesIds.map((id) => `id='${id}'`).join('||')
      const versoes = $app.findRecordsByFilter('versoes', filterStr, '', 100, 0)
      versoesText = versoes.map((v) => v.getString('nome')).join(', ')
    }

    const prompt = `Gere especificações técnicas detalhadas para um ${type} chamado "${nome}".
  ${versoesText ? `Este ${type} é compatível com as versões: ${versoesText}.` : ''}
  Forneça as especificações de forma técnica, em tópicos (bullet points), de maneira concisa e sem introduções ou conclusões.`

    const result = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'Você é um engenheiro especializado em máquinas industriais.' },
        { role: 'user', content: prompt },
      ],
    })

    return e.json(200, { content: result.choices[0].message.content })
  },
  $apis.requireAuth(),
)
