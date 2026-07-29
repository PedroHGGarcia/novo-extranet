import { buildPdf, paginateLines, wrapText, getMaxChars, type TextLine } from '@/lib/pdf-builder'

export interface ProposalPdfData {
  proposta: any
  cliente?: any
  representante?: any
  versao?: any
  gerente?: any
  tipoProposta?: any
  acessorios: any[]
  user?: any
}

function formatCurrencyPdf(value: number | undefined, currency: string = 'BRL'): string {
  if (value === undefined || value === null) return '-'
  const code = ['USD', 'EUR', 'BRL'].includes(currency) ? currency : 'BRL'
  const locale = code === 'BRL' ? 'pt-BR' : code === 'USD' ? 'en-US' : 'de-DE'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code }).format(value)
  } catch {
    return `${code} ${value}`
  }
}

function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  - ')
    .replace(/<h[1-6][^>]*>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function addText(lines: TextLine[], text: string, opts: Partial<TextLine> = {}) {
  const size = opts.size || 10
  const indent = opts.indent || 0
  const maxChars = getMaxChars(size, indent)
  const wrapped = wrapText(text, maxChars)
  for (let i = 0; i < wrapped.length; i++) {
    lines.push({
      text: wrapped[i],
      size,
      bold: opts.bold || false,
      indent,
      gapAfter: i === wrapped.length - 1 ? opts.gapAfter || 0 : 0,
    })
  }
}

function addHtml(lines: TextLine[], html: string, opts: Partial<TextLine> = {}) {
  const text = stripHtml(html)
  for (const tl of text.split('\n')) {
    if (tl.trim()) {
      addText(lines, tl.trim(), opts)
    } else {
      lines.push({
        text: '',
        size: opts.size || 10,
        bold: false,
        indent: opts.indent || 0,
        gapAfter: 0,
      })
    }
  }
}

export function generateProposalPdf(data: ProposalPdfData): Blob {
  const lines: TextLine[] = []
  const p = data.proposta
  const c = data.cliente
  const rep = data.representante
  const v = data.versao
  const gerente = data.gerente
  const tipo = data.tipoProposta
  const user = data.user
  const modelo = v?.expand?.modelo

  let dataEmissao = new Date()
  if (p.dt_cad) {
    const d = new Date(p.dt_cad)
    if (!isNaN(d.getTime())) dataEmissao = d
  }
  const dataFmt = dataEmissao.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const mes = String(dataEmissao.getMonth() + 1).padStart(2, '0')
  const ano = String(dataEmissao.getFullYear())
  const numRev = p.revisao ? `${p.numero_proposta}-${p.revisao}` : p.numero_proposta || ''

  addText(lines, 'BENER COMERCIAL IMPORTADORA EXPORTADORA LTDA.', { bold: true, gapAfter: 2 })
  addText(lines, `Vinhedo, ${dataFmt}`, { gapAfter: 2 })
  addText(
    lines,
    `Sigla: ${rep?.sigla || '-'}  |  Nº Oferta: ${numRev || '-'}  |  Mês: ${mes}  |  Ano: ${ano}`,
    { gapAfter: 6 },
  )
  addText(lines, '-'.repeat(75), { size: 8, gapAfter: 6 })

  addText(lines, 'À', { gapAfter: 2 })
  addText(lines, (c?.fantasia || c?.razao_social || p.cliente_original || '-').toUpperCase(), {
    bold: true,
    gapAfter: 2,
  })
  const endereco = c
    ? [
        c.logradouro,
        c.numero ? `, ${c.numero}` : '',
        c.bairro ? ` - ${c.bairro}` : '',
        c.cidade ? ` - ${c.cidade}` : '',
        c.estado ? `/${c.estado}` : '',
      ]
        .join('')
        .replace(/^[,\s-]+/, '')
    : ''
  if (endereco) addText(lines, endereco, { gapAfter: 2 })
  if (c?.documento) addText(lines, `CNPJ: ${c.documento}`, { gapAfter: 2 })
  addText(lines, `Telefone: ${c?.telefone || c?.celular || p.telefone || '-'}`, { gapAfter: 2 })
  addText(lines, `E-mail: ${c?.email || '-'}`, { gapAfter: 2 })
  addText(lines, `A/C. Sr. ${p.contato || '-'}`, { bold: true, gapAfter: 6 })

  addText(lines, 'Prezados Senhores,', { gapAfter: 4 })
  addText(
    lines,
    'Atendendo a sua prezada consulta, temos o prazer de submeter a vossa devida apreciação nossa proposta acima citada, para o fornecimento de:',
    { gapAfter: 6 },
  )

  const catNome = modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'
  const marcaNome = modelo?.expand?.marca?.nome || '-'
  const versaoNome = v?.nome || p.versao_original || '-'
  addText(lines, `${catNome} MARCA ${marcaNome} - ${versaoNome}`.toUpperCase(), {
    bold: true,
    size: 11,
    gapAfter: 6,
  })

  let sn = 1
  if (v?.acessorios_standards?.trim()) {
    addText(lines, `${sn}. EQUIPADA COM SEUS ACESSÓRIOS STANDARD ABAIXO DESCRITOS`, {
      bold: true,
      gapAfter: 3,
    })
    addHtml(lines, v.acessorios_standards, { indent: 10, gapAfter: 6 })
    sn++
  }
  if (v?.caracteristicas_construtivas?.trim()) {
    addText(lines, `${sn}. CARACTERÍSTICAS CONSTRUTIVAS PRINCIPAIS`, { bold: true, gapAfter: 3 })
    addHtml(lines, v.caracteristicas_construtivas, { indent: 10, gapAfter: 6 })
    sn++
  }
  if (v?.especificacoes_tecnicas?.trim()) {
    addText(lines, `${sn}. ESPECIFICAÇÕES TÉCNICAS PRINCIPAIS`, { bold: true, gapAfter: 3 })
    addHtml(lines, v.especificacoes_tecnicas, { indent: 10, gapAfter: 6 })
    sn++
  }

  const allAcc = data.acessorios || p.acessorios_proposta || []
  const included = allAcc.filter((a: any) => a.estado === 'incluir')
  const optional = allAcc.filter((a: any) => a.estado === 'exibir')

  if (included.length > 0) {
    addText(lines, `${sn}. ACESSÓRIOS OPCIONAIS INCLUSOS NO PREÇO`, { bold: true, gapAfter: 3 })
    for (const a of included) addText(lines, `- ${a.nome}`, { indent: 10, gapAfter: 1 })
    lines.push({ text: '', size: 10, bold: false, indent: 0, gapAfter: 6 })
    sn++
  }

  addText(lines, `${sn}. PREÇOS`, { bold: true, gapAfter: 3 })
  const valorStr = formatCurrencyPdf(p.valor_final, p.moeda)
  const frasePreco =
    tipo?.frase_preco || `Ex Works Vinhedo / Importação direta pelo cliente — ${valorStr}`
  addText(lines, frasePreco, { indent: 10, gapAfter: 2 })
  if (tipo?.mostrar_pagamento_brasil !== false) {
    addText(lines, `Pagamento Brasil: Serviços e Comissão Bener — ${valorStr}`, {
      indent: 10,
      gapAfter: 6,
    })
  }
  sn++

  if (optional.length > 0) {
    addText(lines, `${sn}. ACESSÓRIOS OPCIONAIS NÃO INCLUSOS NO PREÇO`, { bold: true, gapAfter: 3 })
    for (const a of optional) {
      addText(lines, `${a.nome} — ${formatCurrencyPdf(a.valor, a.moeda)} — NÃO INCLUSO`, {
        indent: 10,
        gapAfter: 1,
      })
    }
    lines.push({ text: '', size: 10, bold: false, indent: 0, gapAfter: 6 })
    sn++
  }

  addText(lines, `${sn}. CONDIÇÕES GERAIS DE FORNECIMENTO`, { bold: true, gapAfter: 3 })
  const condicoes = [
    { t: 'Prazo de Entrega', v: p.prazo_entrega || tipo?.prazo_entrega },
    { t: 'Condições de Pagamento', v: p.condicoes_pagamento || tipo?.condicoes_pagamento },
    { t: 'Garantia', v: p.cobertura_garantia || tipo?.garantia },
    { t: 'Assistência Técnica', v: p.assistencia_tecnica_detalhada || tipo?.assistencia_tecnica },
    { t: 'Treinamento Técnico', v: p.treinamento_tecnico || tipo?.treinamento_tecnico },
    { t: 'Transporte / Seguro', v: p.transporte_seguro || tipo?.transporte_seguro },
    { t: 'Validade da Oferta', v: p.validade_oferta || tipo?.validade_oferta },
  ].filter((x) => x.v)
  for (const cond of condicoes) {
    addText(lines, `${cond.t}:`, { bold: true, indent: 10, gapAfter: 1 })
    addText(lines, cond.v, { indent: 20, gapAfter: 3 })
  }

  addText(lines, 'Antecipadamente agradecemos vossa honrosa preferência.', { gapAfter: 3 })
  addText(lines, 'Atenciosamente,', { gapAfter: 6 })
  addText(lines, user?.name || rep?.fantasia || '-', { bold: true, gapAfter: 1 })
  addText(lines, user?.setor || 'Comercial', { gapAfter: 4 })
  if (gerente?.nome || p.gerente_original) {
    addText(lines, gerente?.nome || p.gerente_original || '-', { bold: true, gapAfter: 1 })
    addText(lines, 'Gerente', { gapAfter: 4 })
  }

  addText(lines, '-'.repeat(75), { size: 8, gapAfter: 2 })
  addText(lines, 'Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial', {
    size: 8,
    gapAfter: 1,
  })
  addText(lines, 'Vinhedo - SP - Brasil - CEP: 13280-172 - Fone: (19) 3826-7373', {
    size: 8,
    gapAfter: 1,
  })
  addText(lines, 'E-mail: vendas@bener.com.br - Site: www.bener.com.br', { size: 8, gapAfter: 0 })

  return buildPdf(paginateLines(lines))
}
