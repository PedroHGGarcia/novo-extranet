import { formatCurrency } from '@/pages/controle-propostas/utils'
import type { TipoProposta } from '@/services/tipos-propostas'
import { sanitizeHtml } from '@/lib/sanitize'

interface VersaoComparacaoItem {
  nome: string
  especificacoes?: any[]
}

interface PropostaCleanSectionsProps {
  acessoriosStandards?: string
  caracteristicasConstrutivas?: string
  especificacoesTecnicas?: string
  especificacoesJson?: any[]
  versaoNome?: string
  acessorios: any[]
  valorFinal?: number
  moeda?: string
  frasePreco?: string
  tipoProposta?: TipoProposta | null
  proposta: any
  mostrarPagamentoBrasil?: boolean
  versoesComparacao?: VersaoComparacaoItem[]
}

export function PropostaCleanSections({
  acessoriosStandards,
  caracteristicasConstrutivas,
  especificacoesTecnicas,
  especificacoesJson,
  versaoNome,
  acessorios,
  valorFinal,
  moeda,
  frasePreco,
  tipoProposta,
  proposta,
  mostrarPagamentoBrasil,
  versoesComparacao,
}: PropostaCleanSectionsProps) {
  const includedAcc = acessorios.filter((a) => a.estado === 'incluir')
  const optionalAcc = acessorios.filter((a) => a.estado === 'exibir')
  const hasSpecsJson = Array.isArray(especificacoesJson) && especificacoesJson.length > 0
  const garantia = proposta.cobertura_garantia || tipoProposta?.garantia || ''
  const assist = proposta.assistencia_tecnica_detalhada || tipoProposta?.assistencia_tecnica || ''
  const treinamento = proposta.treinamento_tecnico || tipoProposta?.treinamento_tecnico || ''
  const transporte = proposta.transporte_seguro || tipoProposta?.transporte_seguro || ''
  const validade = proposta.validade_oferta || tipoProposta?.validade_oferta || ''
  const showPagamentoBrasil =
    mostrarPagamentoBrasil ?? tipoProposta?.mostrar_pagamento_brasil ?? false
  const conditionsNum = optionalAcc.length > 0 ? 7 : 6

  const h2Class = 'fw-bold fs-12 tt-upper mb-1'
  const bodyClass = 'fs-10 leading-tight'
  const th = 'border-header px-2 py-0.5 ta-left fw-bold bg-doc-header fc-white fs-10'
  const td = 'border-slate px-2 py-0.5 fs-10'

  const comparisonVersions: VersaoComparacaoItem[] = [
    ...(hasSpecsJson ? [{ nome: versaoNome || 'A', especificacoes: especificacoesJson }] : []),
    ...(versoesComparacao || []),
  ].filter((v) => v.especificacoes && v.especificacoes.length > 0)
  const isMultiCol = comparisonVersions.length > 1

  const renderMultiColSpecs = () => {
    const paramMap = new Map<string, { parametro: string; unidade: string; values: string[] }>()
    comparisonVersions.forEach((v, idx) => {
      ;(v.especificacoes || []).forEach((s) => {
        const key = s.parametro || s.nome || ''
        if (!paramMap.has(key)) {
          paramMap.set(key, {
            parametro: key,
            unidade: s.unidade || '',
            values: new Array(comparisonVersions.length).fill('-'),
          })
        }
        paramMap.get(key)!.values[idx] = s.valor ?? '-'
      })
    })
    return (
      <table className="doc-table w-full">
        <thead>
          <tr>
            <th className={th + ' w-[35%]'}>PARÂMETRO</th>
            {comparisonVersions.map((v, i) => (
              <th key={i} className={th + ' ta-center'}>
                {v.nome}
              </th>
            ))}
            <th className={th + ' ta-center w-[15%]'}>UNIDADE</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(paramMap.values()).map((row, i) => (
            <tr key={i}>
              <td className={td + ' fw-bold'}>{row.parametro}</td>
              {row.values.map((val, j) => (
                <td key={j} className={td + ' ta-center'}>
                  {val}
                </td>
              ))}
              <td className={td + ' ta-center'}>{row.unidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {acessoriosStandards?.trim() && (
        <section className="doc-section mb-3 break-inside-avoid">
          <h2 className={h2Class}>1. EQUIPADA COM SEUS ACESSÓRIOS STANDARD ABAIXO DESCRITOS</h2>
          <div
            className={bodyClass + ' pl-4 rich-text-content'}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(acessoriosStandards || '') }}
          />
        </section>
      )}
      {caracteristicasConstrutivas?.trim() && (
        <section className="doc-section mb-3 break-inside-avoid">
          <h2 className={h2Class}>2. CARACTERÍSTICAS CONSTRUTIVAS PRINCIPAIS</h2>
          <div
            className={bodyClass + ' ta-justify rich-text-content'}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(caracteristicasConstrutivas || '') }}
          />
        </section>
      )}
      {(hasSpecsJson || especificacoesTecnicas?.trim()) && (
        <section className="doc-section mb-3 break-inside-avoid">
          <h2 className={h2Class}>3. ESPECIFICAÇÕES TÉCNICAS PRINCIPAIS</h2>
          {isMultiCol ? (
            renderMultiColSpecs()
          ) : hasSpecsJson ? (
            <table className="doc-table w-full">
              <thead>
                <tr>
                  <th className={th}>PARÂMETRO</th>
                  <th className={th}>VALOR</th>
                  <th className={th}>UNIDADE</th>
                </tr>
              </thead>
              <tbody>
                {especificacoesJson!.map((spec, i) => (
                  <tr key={i}>
                    <td className={td}>{spec.parametro || spec.nome || '-'}</td>
                    <td className={td}>{spec.valor ?? '-'}</td>
                    <td className={td}>{spec.unidade || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className={bodyClass + ' ta-justify rich-text-content'}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(especificacoesTecnicas || '') }}
            />
          )}
        </section>
      )}
      {includedAcc.length > 0 && (
        <section className="doc-section mb-3 break-inside-avoid">
          <h2 className={h2Class}>4. ACESSÓRIOS OPCIONAIS INCLUSOS NO PREÇO</h2>
          <ul className="doc-bullet-list space-y-1 pl-4 leading-tight">
            {includedAcc.map((acc, i) => (
              <li key={i} className={bodyClass + ' leading-tight flex items-start gap-1.5'}>
                <span className="shrink-0 select-none">•</span>
                <span>{acc.nome}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="doc-section mb-3 break-inside-avoid">
        <h2 className={h2Class}>5. PREÇOS</h2>
        <p className={bodyClass + ' mb-0.5'}>
          {frasePreco ||
            `Ex Works Vinhedo / Importação direta pelo cliente — ${formatCurrency(valorFinal, moeda)}`}
        </p>
        {showPagamentoBrasil && (
          <p className={bodyClass}>
            <span className="fw-bold">Pagamento Brasil:</span> Serviços e Comissão Bener —{' '}
            {formatCurrency(valorFinal, moeda)}
          </p>
        )}
      </section>
      {optionalAcc.length > 0 && (
        <section className="doc-section mb-3 break-inside-avoid">
          <h2 className={h2Class}>6. ACESSÓRIOS OPCIONAIS NÃO INCLUSOS NO PREÇO ACIMA</h2>
          <ul className="doc-optional-list space-y-1 pl-4 leading-tight">
            {optionalAcc.map((acc, i) => (
              <li key={i} className={bodyClass + ' leading-tight flex items-start gap-1.5'}>
                <span className="shrink-0 select-none">•</span>
                <span>
                  <span>{acc.nome}</span>
                  {' — '}
                  <span>{formatCurrency(acc.valor, acc.moeda)}</span>
                  {' — '}
                  <span className="fw-bold tt-upper fc-muted-dark">Não Incluso</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="doc-section mb-3 break-inside-avoid">
        <h2 className={h2Class}>{conditionsNum}. CONDIÇÕES GERAIS DE FORNECIMENTO</h2>
        <div className="doc-conditions space-y-1">
          <div>
            <p className="fw-bold">{conditionsNum}.1 Prazo de Entrega</p>
            <p className="whitespace-pre-wrap leading-tight">
              {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
            </p>
          </div>
          <div>
            <p className="fw-bold">{conditionsNum}.2 Condições de Pagamento</p>
            <p className="whitespace-pre-wrap leading-tight">
              {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
            </p>
          </div>
          {garantia && (
            <div className="break-inside-avoid">
              <p className="fw-bold">{conditionsNum}.3 Garantia</p>
              <p className="whitespace-pre-wrap leading-tight fs-italic">{garantia}</p>
            </div>
          )}
          {assist && (
            <div className="break-inside-avoid">
              <p className="fw-bold">{conditionsNum}.4 Assistência Técnica</p>
              <p className="whitespace-pre-wrap leading-tight">{assist}</p>
            </div>
          )}
          {treinamento && (
            <div className="break-inside-avoid">
              <p className="fw-bold">{conditionsNum}.5 Treinamento Técnico</p>
              <p className="whitespace-pre-wrap leading-tight">{treinamento}</p>
            </div>
          )}
          {transporte && (
            <div className="break-inside-avoid">
              <p className="fw-bold">{conditionsNum}.6 Transporte / Seguro</p>
              <p className="whitespace-pre-wrap leading-tight">{transporte}</p>
            </div>
          )}
          {validade && (
            <div className="break-inside-avoid">
              <p className="fw-bold">{conditionsNum}.7 Validade desta Oferta</p>
              <p className="whitespace-pre-wrap leading-tight">{validade}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
