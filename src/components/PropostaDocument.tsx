import { type Proposta } from '@/services/propostas'
import { type TipoProposta } from '@/services/tipos-propostas'
import benerLogoUrl from '@/assets/bener-thumb-c5c1b.png'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  const map: Record<string, string> = {
    Dolar: 'USD',
    Dólar: 'USD',
    Real: 'BRL',
    Euro: 'EUR',
    US$: 'USD',
  }
  let code = map[currency] || currency || 'BRL'
  if (!/^[A-Z]{3}$/.test(code)) code = 'BRL'
  const locales: Record<string, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' }
  const locale = locales[code] || 'pt-BR'
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
    }).format(value)
  } catch (e) {
    return `${code} ${value}`
  }
}

interface PropostaDocumentProps {
  proposta: Partial<Proposta>
  tipoProposta?: TipoProposta | null
  clienteNome: string
  clienteEndereco?: string
  clienteEmail?: string
  representanteNome: string
  representanteSigla?: string
  versaoNome: string
  versaoImagemUrl?: string | null
  categoriaNome?: string
  marcaNome?: string
  gerenteNome: string
  acessorios: any[]
  acessoriosStandards?: string
  caracteristicasConstrutivas?: string
  especificacoesTecnicas?: string
  representanteAssinaturaUrl?: string | null
  gerenteAssinaturaUrl?: string | null
}

export function PropostaDocument({
  proposta,
  tipoProposta,
  clienteNome,
  clienteEndereco,
  clienteEmail,
  representanteSigla,
  versaoNome,
  versaoImagemUrl,
  categoriaNome,
  marcaNome,
  gerenteNome,
  acessorios,
  acessoriosStandards,
  caracteristicasConstrutivas,
  especificacoesTecnicas,
  representanteNome,
  representanteAssinaturaUrl,
  gerenteAssinaturaUrl,
}: PropostaDocumentProps) {
  const dataEmissao = proposta.dt_cad ? new Date(`${proposta.dt_cad}T00:00:00`) : new Date()
  const dataFormatada = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const mesOferta = format(dataEmissao, 'MM')
  const anoOferta = format(dataEmissao, 'yyyy')
  const numRevisao = proposta.revisao
    ? `${proposta.numero_proposta}-${proposta.revisao}`
    : proposta.numero_proposta

  return (
    <div className="bg-white text-black w-[210mm] max-w-full min-h-[297mm] p-12 shadow-lg print:shadow-none print:w-full print:m-0 print:pb-16 relative mx-auto box-border">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <img src={benerLogoUrl} alt="Bener" className="h-20 object-contain" />

        <div className="flex flex-col items-end font-mono">
          <p className="font-bold text-[13px]">Bener Comercial Importadora Exportadora Ltda.</p>
          <p className="text-[13px] mb-4">Vinhedo, {dataFormatada}</p>

          <table className="border-collapse border border-black text-center w-[340px] text-[13px]">
            <thead>
              <tr className="font-bold">
                <th className="border border-black px-2 py-1.5">Sigla</th>
                <th className="border border-black px-2 py-1.5">Nº Oferta</th>
                <th className="border border-black px-2 py-1.5">Mês</th>
                <th className="border border-black px-2 py-1.5">Ano</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1.5">{representanteSigla || '-'}</td>
                <td className="border border-black px-2 py-1.5">{numRevisao}</td>
                <td className="border border-black px-2 py-1.5">{mesOferta}</td>
                <td className="border border-black px-2 py-1.5">{anoOferta}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Info */}
      <div className="text-[14px] font-mono leading-snug mb-10 tracking-tight">
        <p>À</p>
        <p className="font-bold uppercase">{clienteNome}</p>
        <p>{clienteEndereco || '-'}</p>
        <p>Telefone: {proposta.telefone || '-'}</p>
        <p>E-mail: {clienteEmail || '-'}</p>
        <br />
        <p className="font-bold uppercase">A/C. SR. {proposta.contato || '-'}</p>
      </div>

      {/* Salutation */}
      <div className="text-[14px] font-mono leading-relaxed mb-8">
        <p>Prezados Senhores,</p>
        <br />
        <p>
          Atendendo a sua prezada consulta, temos o prazer de submeter a vossa devida apreciação
          nossa proposta acima citada, para o fornecimento de:
        </p>
      </div>

      {/* Product Title */}
      <div className="text-center mb-8">
        <h2 className="text-[16px] font-bold uppercase font-mono tracking-wide">
          {categoriaNome} MARCA {marcaNome} - {versaoNome}
        </h2>
      </div>

      {/* Product Image */}
      <div className="flex flex-col items-center mb-12 print-break-inside-avoid">
        {versaoImagemUrl ? (
          <img
            src={versaoImagemUrl}
            alt={versaoNome}
            className="max-w-full max-h-[280px] object-contain"
          />
        ) : (
          <div className="w-[80%] h-[250px] bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
            Sem imagem disponível
          </div>
        )}
        <p className="text-[11px] text-slate-500 mt-4 font-mono font-bold tracking-widest uppercase">
          Imagem meramente ilustrativa
        </p>
      </div>

      {/* Acessorios (Included & Optional) */}
      {acessorios.length > 0 && (
        <div className="mb-10 print-break-inside-avoid px-8">
          <h3 className="font-bold font-mono text-[14px] uppercase mb-3 border-b border-black pb-1">
            Itens Adicionais e Opcionais
          </h3>
          <ul className="list-disc pl-5 text-[13px] font-mono space-y-2">
            {acessorios.map((acc, i) => {
              const isOpcional =
                acc.estado === 'exibir' || (!acc.estado && acc.exibir && !acc.incluir)
              return (
                <li key={i}>
                  {acc.nome}{' '}
                  {isOpcional ? (
                    <span className="italic text-slate-500 ml-2">
                      (Item Opcional - não incluso no valor final)
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {(acessoriosStandards?.trim() ||
        caracteristicasConstrutivas?.trim() ||
        especificacoesTecnicas?.trim()) && (
        <div className="mb-10 print-break-inside-avoid">
          <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
            Detalhes Técnicos
          </h2>
          <div className="space-y-4">
            {acessoriosStandards?.trim() && (
              <div>
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Acessórios Standards
                </p>
                <div
                  className="font-mono text-[12px] leading-relaxed text-justify rich-text-content"
                  dangerouslySetInnerHTML={{ __html: acessoriosStandards }}
                />
              </div>
            )}
            {caracteristicasConstrutivas?.trim() && (
              <div>
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Características Construtivas Principais
                </p>
                <div
                  className="font-mono text-[12px] leading-relaxed text-justify rich-text-content"
                  dangerouslySetInnerHTML={{ __html: caracteristicasConstrutivas }}
                />
              </div>
            )}
            {especificacoesTecnicas?.trim() && (
              <div>
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Especificações Técnicas Principais
                </p>
                <div
                  className="font-mono text-[12px] leading-relaxed text-justify rich-text-content"
                  dangerouslySetInnerHTML={{ __html: especificacoesTecnicas }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Break page to separate presentation from commercial clauses */}
      <div className="print-break-before pt-8">
        <h2 className="font-bold font-mono text-[15px] uppercase tracking-wide border-b-2 border-black pb-2 mb-6">
          Preço e Condições
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 font-mono text-[13px]">
          <div className="col-span-2 flex items-center justify-between border-b border-slate-300 pb-4 mb-2">
            <span className="font-bold text-[15px] uppercase">Valor Final do Equipamento:</span>
            <span className="text-[18px] font-bold">
              {formatCurrency(proposta.valor_final, proposta.moeda)}
            </span>
          </div>

          <div>
            <p className="font-bold uppercase tracking-wider mb-1">Condições de Pagamento</p>
            <p className="leading-relaxed">
              {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider mb-1">Prazo de Entrega</p>
            <p className="leading-relaxed">
              {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
            </p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-wider mb-1">Validade da Oferta</p>
            <p className="leading-relaxed">Validade da proposta: 20 dias</p>
          </div>
        </div>

        <div className="mb-10 font-mono text-[13px] print-break-inside-avoid">
          <h2 className="font-bold text-[15px] uppercase tracking-wide border-b-2 border-black pb-2 mb-4">
            Observações de Preço
          </h2>
          <p className="leading-relaxed font-medium">
            {tipoProposta?.frase_preco || 'Proposta sem valor comercial'}
          </p>
        </div>

        <div className="mb-12 font-mono text-[13px] text-justify leading-relaxed">
          <h2 className="font-bold text-[15px] uppercase tracking-wide border-b-2 border-black pb-2 mb-6">
            Cláusulas Contratuais e Condições Gerais
          </h2>

          {tipoProposta ? (
            <div className="space-y-6">
              {tipoProposta.garantia && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">1. Garantia</h3>
                  <p className="whitespace-pre-wrap">{tipoProposta.garantia}</p>
                </div>
              )}

              {tipoProposta.assistencia_tecnica && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">2. Assistência Técnica</h3>
                  <p className="whitespace-pre-wrap">{tipoProposta.assistencia_tecnica}</p>
                </div>
              )}

              {tipoProposta.treinamento_tecnico && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">3. Treinamento Técnico</h3>
                  <p className="whitespace-pre-wrap">{tipoProposta.treinamento_tecnico}</p>
                </div>
              )}

              {tipoProposta.transporte_seguro && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">4. Transporte e Seguro</h3>
                  <p className="whitespace-pre-wrap">{tipoProposta.transporte_seguro}</p>
                </div>
              )}

              {(tipoProposta.imposto_ipi || tipoProposta.imposto_icms) && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">5. Impostos</h3>
                  <div className="p-4 border border-black">
                    <ul className="list-disc pl-5 space-y-2">
                      {tipoProposta.imposto_ipi && (
                        <li>
                          <strong>IPI:</strong> {tipoProposta.imposto_ipi}
                        </li>
                      )}
                      {tipoProposta.imposto_icms && (
                        <li>
                          <strong>ICMS:</strong> {tipoProposta.imposto_icms}
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              <div className="border-b border-black w-full"></div>
              <div className="border-b border-black w-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Footer info & Assinaturas */}
      <div className="mt-12 font-mono print-break-inside-avoid pt-12">
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="flex flex-col items-center text-center">
            <div className="h-24 flex items-end justify-center w-full mb-1">
              {representanteAssinaturaUrl ? (
                <img
                  src={representanteAssinaturaUrl}
                  alt="Assinatura do Representante"
                  className="max-h-24 max-w-[200px] object-contain"
                />
              ) : null}
            </div>
            <p className="font-bold text-[12px] uppercase mb-1 h-4">
              {proposta.expand?.user?.name || representanteNome || '-'}
            </p>
            <div className="w-[250px] border-t-2 border-black mb-2"></div>
            <p className="text-[11px] font-bold text-slate-600">Assinatura do Representante</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="h-24 flex items-end justify-center w-full mb-1">
              {gerenteAssinaturaUrl ? (
                <img
                  src={gerenteAssinaturaUrl}
                  alt="Assinatura do Gerente"
                  className="max-h-24 max-w-[200px] object-contain"
                />
              ) : null}
            </div>
            <p className="font-bold text-[12px] uppercase mb-1 h-4">{gerenteNome || '-'}</p>
            <div className="w-[250px] border-t-2 border-black mb-2"></div>
            <p className="text-[11px] font-bold text-slate-600">Assinatura do Gerente</p>
          </div>
        </div>

        <div className="flex justify-between items-end text-[10px] gap-4">
          <div className="max-w-sm">
            <p className="font-bold mb-1 uppercase text-[11px]">
              Bener - Soluções em Máquinas e Equipamentos
            </p>
            <p className="text-slate-600">
              Este é um documento gerado eletronicamente e tem validade como proposta comercial.
            </p>
          </div>
          {proposta.id && (
            <div className="flex flex-col items-center text-center shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://extranetgourmet.goskip.app/validar-proposta/${proposta.id}`)}`}
                alt="QR Code de Validação"
                className="w-[70px] h-[70px] mb-2"
              />
              <p className="text-[9px] uppercase leading-tight font-bold">
                Escaneie para validar
                <br />a autenticidade
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .print-only-footer { display: none; }
        @media print {
          @page { size: A4; margin: 12mm 15mm 28mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-break-inside-avoid { break-inside: avoid; }
          .print-break-before { page-break-before: always; }
          .no-print { display: none !important; }
          .print-only-footer {
            display: block;
            position: fixed;
            bottom: 4mm;
            left: 15mm;
            right: 15mm;
            padding-top: 6px;
            border-top: 1px solid #000;
            background: white;
            font-family: monospace;
            font-size: 9px;
            line-height: 1.5;
            text-align: center;
            z-index: 100;
          }
          .print-only-footer .page-num::after {
            content: "Página " counter(page) "/" counter(pages);
          }
          .print-only-footer .page-num {
            text-align: right;
            font-weight: bold;
            margin-top: 2px;
          }
        }
      `}</style>
      <div className="print-only-footer">
        <p>Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial</p>
        <p>Vinhedo - SP - Brasil - CEP: 13280-172 - Fone: (19) 3826-7373</p>
        <p>E-mail: vendas@bener.com.br - Site: www.bener.com.br</p>
        <p className="page-num"></p>
      </div>
    </div>
  )
}
