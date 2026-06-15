routerAdd(
  'POST',
  '/backend/v1/ai/suggest-specs',
  (e) => {
    const body = e.requestInfo().body || {}
    if (!body.modelo) return e.badRequestError('modelo is required')

    const prompt = `Act as a Technical Product Assistant focused on industrial machinery specs.
Generate a professional, structured template for technical specifications for the product: ${body.produto || 'Máquina'} - Model: ${body.modelo}.
Return only the structured text in HTML format (using <ul>, <li>, and <strong> tags). Do NOT include markdown code block syntax like \`\`\`html. Use placeholders like [value] for numbers.`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'You are a Technical Product Assistant.' },
        { role: 'user', content: prompt },
      ],
    })

    return e.json(200, { text: reply.choices[0].message.content })
  },
  $apis.requireAuth(),
)
