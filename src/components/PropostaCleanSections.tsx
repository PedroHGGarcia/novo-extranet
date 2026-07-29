import { formatCurrency } from '@/pages/controle-propostas/utils'
import type { TipoProposta } from '@/services/tipos-propostas'

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
  const h2Class = 'font-bold text-[12pt] uppercase mb-1 font-sans'
  const bodyClass = 'text-[10pt] leading-tight font-sans'
  const th =
    'border border-[#003366] px-2 py-0.5 text-left font-bold bg-[#003366] text-white text-[10pt]'
  const td = 'border border-slate-400 px-2 py-0.5 text-[10pt]'

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
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={th + ' w-[35%]'}>PARÂMETRO</th>
            {comparisonVersions.map((v, i) => (
              <th key={i} className={th + ' text-center'}>
                {v.nome}
              </th>
            ))}
            <th className={th + ' text-center w-[15%]'}>UNIDADE</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(paramMap.values()).map((row, i) => (
            <tr key={i}>
              <td className={td + ' font-bold'}>{row.parametro}</td>
              {row.values.map((val, j) => (
                <td key={j} className={td + ' text-center'}>
                  {val}
                </td>
              ))}
              <td className={td + ' text-center'}>{row.unidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <>
      {acessoriosStandards?.trim() && (
        <section className="mb-3 break-inside-avoid">
          <h2 className={h2Class}>1. EQUIPADA COM SEUS ACESSÓRIOS STANDARD ABAIXO DESCRITOS</h2>
          <div
            className={bodyClass + ' pl-4 rich-text-content'}
            dangerouslySetInnerHTML={{ __html: acessoriosStandards }}
          />
        </section>
      )}

      {caracteristicasConstrutivas?.trim() && (
        <section className="mb-3 break-inside-avoid">
          <h2 className={h2Class}>2. CARACTERÍSTICAS CONSTRUTIVAS PRINCIPAIS</h2>
          <div
            className={bodyClass + ' text-justify rich-text-content'}
            dangerouslySetInnerHTML={{ __html: caracteristicasConstrutivas }}
          />
        </section>
      )}

      {(hasSpecsJson || especificacoesTecnicas?.trim()) && (
        <section className="mb-3 break-inside-avoid">
          <h2 className={h2Class}>3. ESPECIFICAÇÕES TÉCNICAS PRINCIPAIS</h2>
          {isMultiCol ? (
            renderMultiColSpecs()
          ) : hasSpecsJson ? (
            <table className="w-full border-collapse">
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
              className={bodyClass + ' text-justify rich-text-content'}
              dangerouslySetInnerHTML={{ __html: especificacoesTecnicas || '' }}
            />
          )}
        </section>
      )}

      {includedAcc.length > 0 && (
        <section className="mb-3 break-inside-avoid">
          <h2 className={h2Class}>4. ACESSÓRIOS OPCIONAIS INCLUSOS NO PREÇO</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Item</th>
                <th className={th + ' text-center'}>Situação</th>
              </tr>
            </thead>
            <tbody>
              {includedAcc.map((acc, i) => (
                <tr key={i}>
                  <td className={td}>
                    <span className="font-bold">{acc.nome}</span>
                  </td>
                  <td className={td + ' text-center font-bold'}>Incluso</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mb-3 break-inside-avoid">
        <h2 className={h2Class}>5. PREÇOS</h2>
        <p className={bodyClass + ' mb-0.5'}>
          {frasePreco ||
            `Ex Works Vinhedo / Importação direta pelo cliente — ${formatCurrency(valorFinal, moeda)}`}
        </p>
        {showPagamentoBrasil && (
          <p className={bodyClass}>
            <span className="font-bold">Pagamento Brasil:</span> Serviços e Comissão Bener —{' '}
            {formatCurrency(valorFinal, moeda)}
          </p>
        )}
      </section>

      {optionalAcc.length > 0 && (
        <section className="mb-3 break-inside-avoid">
          <h2 className={h2Class}>6. ACESSÓRIOS OPCIONAIS NÃO INCLUSOS NO PREÇO ACIMA</h2>
          <ul className="list-none pl-0 space-y-1 font-sans text-[10pt] leading-tight">
            {optionalAcc.map((acc, i) => (
              <li key={i} className="leading-tight">
                <span className="font-bold">{acc.nome}</span>
                {' — '}
                <span>{formatCurrency(acc.valor, acc.moeda)}</span>
                {' — '}
                <span className="font-bold uppercase text-slate-700">Não Incluso</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-3 break-inside-avoid">
        <h2 className={h2Class}>{conditionsNum}. CONDIÇÕES GERAIS DE FORNECIMENTO</h2>
        <div className="font-sans text-[10pt] space-y-1">
          <div>
            <p className="font-bold">{conditionsNum}.1 Prazo de Entrega</p>
            <p className="whitespace-pre-wrap leading-tight">
              {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
            </p>
          </div>
          <div>
            <p className="font-bold">{conditionsNum}.2 Condições de Pagamento</p>
            <p className="whitespace-pre-wrap leading-tight">
              {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
            </p>
          </div>
          {garantia && (
            <div className="break-inside-avoid">
              <p className="font-bold">{conditionsNum}.3 Garantia</p>
              <p className="whitespace-pre-wrap leading-tight italic">{garantia}</p>
            </div>
          )}
          {assist && (
            <div className="break-inside-avoid">
              <p className="font-bold">{conditionsNum}.4 Assistência Técnica</p>
              <p className="whitespace-pre-wrap leading-tight">{assist}</p>
            </div>
          )}
          {treinamento && (
            <div className="break-inside-avoid">
              <p className="font-bold">{conditionsNum}.5 Treinamento Técnico</p>
              <p className="whitespace-pre-wrap leading-tight">{treinamento}</p>
            </div>
          )}
          {transporte && (
            <div className="break-inside-avoid">
              <p className="font-bold">{conditionsNum}.6 Transporte / Seguro</p>
              <p className="whitespace-pre-wrap leading-tight">{transporte}</p>
            </div>
          )}
          {validade && (
            <div className="break-inside-avoid">
              <p className="font-bold">{conditionsNum}.7 Validade desta Oferta</p>
              <p className="whitespace-pre-wrap leading-tight">{validade}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
