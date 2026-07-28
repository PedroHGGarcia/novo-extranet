import { formatCurrency } from '@/pages/controle-propostas/utils'
import type { TipoProposta } from '@/services/tipos-propostas'

interface PropostaCleanSectionsProps {
  acessoriosStandards?: string
  caracteristicasConstrutivas?: string
  especificacoesTecnicas?: string
  especificacoesJson?: any[]
  acessorios: any[]
  valorFinal?: number
  moeda?: string
  frasePreco?: string
  tipoProposta?: TipoProposta | null
  proposta: any
}

export function PropostaCleanSections({
  acessoriosStandards,
  caracteristicasConstrutivas,
  especificacoesTecnicas,
  especificacoesJson,
  acessorios,
  valorFinal,
  moeda,
  frasePreco,
  tipoProposta,
  proposta,
}: PropostaCleanSectionsProps) {
  const includedAcc = acessorios.filter((a) => a.estado === 'incluir')
  const optionalAcc = acessorios.filter((a) => a.estado === 'exibir')
  const hasSpecsJson = Array.isArray(especificacoesJson) && especificacoesJson.length > 0
  const garantia = proposta.cobertura_garantia || tipoProposta?.garantia || ''
  const assist = proposta.assistencia_tecnica_detalhada || tipoProposta?.assistencia_tecnica || ''
  const treinamento = proposta.treinamento_tecnico || tipoProposta?.treinamento_tecnico || ''
  const transporte = proposta.transporte_seguro || tipoProposta?.transporte_seguro || ''
  const validade = proposta.validade_oferta || tipoProposta?.validade_oferta || ''

  const th = 'border border-slate-400 px-2 py-1 text-left font-bold'
  const td = 'border border-slate-400 px-2 py-1'

  return (
    <>
      {acessoriosStandards?.trim() && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="font-bold text-[11pt] uppercase mb-2">
            1. EQUIPADA COM SEUS ACESSÓRIOS STANDARD ABAIXO DESCRITOS
          </h2>
          <div
            className="text-[10pt] pl-4 rich-text-content"
            dangerouslySetInnerHTML={{ __html: acessoriosStandards }}
          />
        </section>
      )}

      {caracteristicasConstrutivas?.trim() && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="font-bold text-[11pt] uppercase mb-2">
            2. CARACTERÍSTICAS CONSTRUTIVAS PRINCIPAIS
          </h2>
          <div
            className="text-[10pt] text-justify rich-text-content"
            dangerouslySetInnerHTML={{ __html: caracteristicasConstrutivas }}
          />
        </section>
      )}

      {(hasSpecsJson || especificacoesTecnicas?.trim()) && (
        <section className="mb-6">
          <h2 className="font-bold text-[11pt] uppercase mb-2">
            3. ESPECIFICAÇÕES TÉCNICAS PRINCIPAIS
          </h2>
          {hasSpecsJson ? (
            <table className="w-full text-[10pt] border-collapse">
              <thead>
                <tr className="bg-slate-100">
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
              className="text-[10pt] text-justify rich-text-content"
              dangerouslySetInnerHTML={{ __html: especificacoesTecnicas || '' }}
            />
          )}
        </section>
      )}

      {includedAcc.length > 0 && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="font-bold text-[11pt] uppercase mb-2">
            4. ACESSÓRIOS OPCIONAIS INCLUSOS NO PREÇO
          </h2>
          <ul className="list-disc pl-5 text-[10pt] space-y-1">
            {includedAcc.map((acc, i) => (
              <li key={i}>{acc.nome}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-6 break-inside-avoid">
        <h2 className="font-bold text-[11pt] uppercase mb-2">5. PREÇOS</h2>
        <p className="text-[10pt] mb-1">
          {frasePreco ||
            `Ex Works Vinhedo / Importação direta pelo cliente — ${formatCurrency(valorFinal, moeda)}`}
        </p>
        <p className="text-[10pt]">
          Pagamento Brasil: Serviços e Comissão Bener — {formatCurrency(valorFinal, moeda)}
        </p>
      </section>

      {optionalAcc.length > 0 && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="font-bold text-[11pt] uppercase mb-2">
            6. ACESSÓRIOS OPCIONAIS NÃO INCLUSOS NO PREÇO ACIMA
          </h2>
          <table className="w-full text-[10pt] border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className={th}>Código</th>
                <th className={th}>Descrição</th>
                <th className={th + ' text-right'}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {optionalAcc.map((acc, i) => (
                <tr key={i}>
                  <td className={td}>{acc.id || '-'}</td>
                  <td className={td}>{acc.nome}</td>
                  <td className={td + ' text-right'}>{formatCurrency(acc.valor, acc.moeda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mb-6">
        <h2 className="font-bold text-[11pt] uppercase mb-3">
          7. CONDIÇÕES GERAIS DE FORNECIMENTO
        </h2>
        <div className="text-[10pt] space-y-3">
          <div>
            <p className="font-bold">7.1 Prazo de Entrega</p>
            <p className="whitespace-pre-wrap">
              {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
            </p>
          </div>
          <div>
            <p className="font-bold">7.2 Condições de Pagamento</p>
            <p className="whitespace-pre-wrap">
              {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
            </p>
          </div>
          {garantia && (
            <div className="break-inside-avoid">
              <p className="font-bold">7.3 Garantia</p>
              <p className="whitespace-pre-wrap">{garantia}</p>
            </div>
          )}
          {assist && (
            <div className="break-inside-avoid">
              <p className="font-bold">7.4 Assistência Técnica</p>
              <p className="whitespace-pre-wrap">{assist}</p>
            </div>
          )}
          {treinamento && (
            <div className="break-inside-avoid">
              <p className="font-bold">7.5 Treinamento Técnico</p>
              <p className="whitespace-pre-wrap">{treinamento}</p>
            </div>
          )}
          {transporte && (
            <div className="break-inside-avoid">
              <p className="font-bold">7.6 Transporte / Seguro</p>
              <p className="whitespace-pre-wrap">{transporte}</p>
            </div>
          )}
          {validade && (
            <div className="break-inside-avoid">
              <p className="font-bold">7.7 Validade desta Oferta</p>
              <p className="whitespace-pre-wrap">{validade}</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
