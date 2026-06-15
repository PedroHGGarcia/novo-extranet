routerAdd(
  'POST',
  '/backend/v1/ai/suggest-specs',
  (e) => {
    const body = e.requestInfo().body || {}
    const modelo = body.modelo || 'Máquina genérica'

    const prompt = `Gere uma lista de especificações técnicas para o modelo de máquina industrial ${modelo}. 
Aja como um assistente técnico de produtos de maquinário industrial. 
Responda APENAS com a lista formatada usando HTML básico (ex: <ul><li>Peso: 1500 kg</li><li>Tensão: 220V</li></ul>), sem markdown e sem textos adicionais. Não use blocos de código markdown.`

    const reply = $ai.chat({
      model: 'fast',
      messages: [
        { role: 'system', content: 'Você é um assistente técnico industrial preciso e direto.' },
        { role: 'user', content: prompt },
      ],
    })

    return e.json(200, { content: reply.choices[0].message.content })
  },
  $apis.requireAuth(),
)
