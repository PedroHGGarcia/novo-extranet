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

interface SecaoAdicional {
  titulo: string
  descricao: string
  imagem?: string
}

interface PropostaDocumentProps {
  proposta: Partial<Proposta>
  tipoProposta?: TipoProposta | null
  clienteNome: string
  clienteEndereco?: string
  clienteEmail?: string
  clienteCnpj?: string
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
  assinaturaRepresentanteUrl?: string | null
  representanteAssinaturaUrl?: string | null
  gerenteAssinaturaUrl?: string | null
  assinaturaClienteUrl?: string | null
  issuerSectorLabel?: string
  issuerName?: string
  secoesAdicionais?: SecaoAdicional[]
}

export function PropostaDocument({
  proposta,
  tipoProposta,
  clienteNome,
  clienteEndereco,
  clienteEmail,
  clienteCnpj,
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
  assinaturaRepresentanteUrl,
  representanteAssinaturaUrl,
  gerenteAssinaturaUrl,
  assinaturaClienteUrl,
  issuerSectorLabel,
  issuerName,
  secoesAdicionais,
}: PropostaDocumentProps) {
  let dataEmissao = new Date()
  if (typeof proposta.dt_cad === 'string' && proposta.dt_cad.length >= 10) {
    const parts = proposta.dt_cad.substring(0, 10).split('-')
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const day = parseInt(parts[2], 10)
      const parsedDate = new Date(year, month, day)
      if (!isNaN(parsedDate.getTime())) {
        dataEmissao = parsedDate
      }
    }
  }

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
        {clienteCnpj && (
          <p>
            <span className="font-bold">CNPJ:</span> {clienteCnpj}
          </p>
        )}
        <p>
          <span className="font-bold">Telefone:</span> {proposta.telefone || '-'}
        </p>
        <p>
          <span className="font-bold">E-mail:</span> {clienteEmail || '-'}
        </p>
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
        {proposta.descricao_proposta && (
          <p className="mt-4 text-[13px] font-mono leading-relaxed text-justify px-4 whitespace-pre-wrap">
            {proposta.descricao_proposta}
          </p>
        )}
      </div>

      {/* Product Image */}
      <div
        className="flex flex-col items-center mb-12 print-break-inside-avoid"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      >
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
        <div className="mb-10 print-detail-block px-8">
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
        especificacoesTecnicas?.trim() ||
        proposta.especificacoes_tecnicas?.trim() ||
        proposta.materiais_utilizados?.trim()) && (
        <div className="mb-10 print-details-section">
          <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
            Detalhes Técnicos
          </h2>
          <div className="space-y-4">
            {acessoriosStandards?.trim() && (
              <div className="print-detail-block">
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
              <div className="print-detail-block">
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
              <div className="print-detail-block">
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Especificações Técnicas Principais
                </p>
                <div
                  className="font-mono text-[12px] leading-relaxed text-justify rich-text-content"
                  dangerouslySetInnerHTML={{ __html: especificacoesTecnicas }}
                />
              </div>
            )}
            {proposta.especificacoes_tecnicas?.trim() && (
              <div className="print-detail-block">
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Especificações Técnicas (Adicionais)
                </p>
                <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                  {proposta.especificacoes_tecnicas}
                </div>
              </div>
            )}
            {proposta.materiais_utilizados?.trim() && (
              <div className="print-detail-block">
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Materiais Utilizados
                </p>
                <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                  {proposta.materiais_utilizados}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {proposta.modelo_licitacao && (
        <>
          {(proposta.certificacoes?.trim() || proposta.normas_aplicaveis?.trim()) && (
            <div className="mb-10 print-detail-block">
              <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
                Normalização
              </h2>
              <div className="space-y-4">
                {proposta.certificacoes?.trim() && (
                  <div>
                    <p className="font-bold font-mono text-[13px] uppercase mb-1">Certificações</p>
                    <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                      {proposta.certificacoes}
                    </div>
                  </div>
                )}
                {proposta.normas_aplicaveis?.trim() && (
                  <div>
                    <p className="font-bold font-mono text-[13px] uppercase mb-1">
                      Normas Aplicáveis
                    </p>
                    <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                      {proposta.normas_aplicaveis}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(proposta.certificacoes_seguranca?.trim() || proposta.normas_seguranca?.trim()) && (
            <div className="mb-10 print-detail-block">
              <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
                Segurança
              </h2>
              <div className="space-y-4">
                {proposta.certificacoes_seguranca?.trim() && (
                  <div>
                    <p className="font-bold font-mono text-[13px] uppercase mb-1">
                      Certificações de Segurança
                    </p>
                    <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                      {proposta.certificacoes_seguranca}
                    </div>
                  </div>
                )}
                {proposta.normas_seguranca?.trim() && (
                  <div>
                    <p className="font-bold font-mono text-[13px] uppercase mb-1">
                      Normas de Segurança
                    </p>
                    <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                      {proposta.normas_seguranca}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {proposta.criterios_aceitacao?.trim() && (
            <div className="mb-10 print-detail-block">
              <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
                Testes de Aceitação
              </h2>
              <div>
                <p className="font-bold font-mono text-[13px] uppercase mb-1">
                  Critérios de Aceitação
                </p>
                <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                  {proposta.criterios_aceitacao}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {secoesAdicionais && secoesAdicionais.length > 0 && (
        <div className="mb-10 print-details-section">
          <h2 className="font-bold font-mono text-[14px] uppercase mb-4 border-b border-black pb-1">
            Informações Adicionais
          </h2>
          <div className="space-y-4">
            {secoesAdicionais.map((secao, i) => (
              <div key={i} className="print-detail-block">
                <p className="font-bold font-mono text-[13px] uppercase mb-1">{secao.titulo}</p>
                <div className="font-mono text-[12px] leading-relaxed text-justify whitespace-pre-wrap">
                  {secao.descricao}
                </div>
                {secao.imagem && (
                  <div className="mt-3 flex justify-center print-break-inside-avoid">
                    <img
                      src={secao.imagem}
                      alt={secao.titulo}
                      className="max-w-full max-h-[300px] object-contain"
                    />
                  </div>
                )}
              </div>
            ))}
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
            <p className="leading-relaxed">
              {proposta.validade_oferta ||
                tipoProposta?.validade_oferta ||
                'Validade da proposta: 20 dias'}
            </p>
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
              {(tipoProposta.garantia ||
                proposta.cobertura_garantia ||
                proposta.garantia_acessorios) && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">1. Garantia</h3>
                  {proposta.cobertura_garantia ? (
                    <p className="whitespace-pre-wrap">{proposta.cobertura_garantia}</p>
                  ) : tipoProposta.garantia ? (
                    <p className="whitespace-pre-wrap">{tipoProposta.garantia}</p>
                  ) : null}

                  {proposta.garantia_acessorios && (
                    <div className="mt-4">
                      <p className="font-bold text-[12px]">Garantia dos Acessórios:</p>
                      <p className="whitespace-pre-wrap">{proposta.garantia_acessorios}</p>
                    </div>
                  )}
                </div>
              )}

              {(tipoProposta.assistencia_tecnica || proposta.assistencia_tecnica_detalhada) && (
                <div className="print-break-inside-avoid">
                  <h3 className="font-bold mb-1.5 uppercase">2. Assistência Técnica</h3>
                  <p className="whitespace-pre-wrap">
                    {proposta.assistencia_tecnica_detalhada || tipoProposta.assistencia_tecnica}
                  </p>
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
              {assinaturaRepresentanteUrl ? (
                <img
                  src={assinaturaRepresentanteUrl}
                  alt="Assinatura do Representante"
                  className="max-h-24 max-w-[200px] object-contain"
                />
              ) : representanteAssinaturaUrl ? (
                <img
                  src={representanteAssinaturaUrl}
                  alt="Assinatura do Representante"
                  className="max-h-24 max-w-[200px] object-contain"
                />
              ) : null}
            </div>
            <p className="font-bold text-[12px] uppercase mb-1 h-4">
              {issuerName || proposta.expand?.user?.name || representanteNome || '-'}
            </p>
            <div className="w-[250px] border-t-2 border-black mb-2"></div>
            <p className="text-[11px] font-bold text-slate-600">
              {issuerSectorLabel || 'Assinatura do Representante'}
            </p>
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

        {assinaturaClienteUrl && (
          <div className="flex flex-col items-center text-center mb-12">
            <div className="h-24 flex items-end justify-center w-full mb-1">
              <img
                src={assinaturaClienteUrl}
                alt="Assinatura do Cliente"
                className="max-h-24 max-w-[200px] object-contain"
              />
            </div>
            <p className="font-bold text-[12px] uppercase mb-1 h-4">{clienteNome || '-'}</p>
            <div className="w-[250px] border-t-2 border-black mb-2"></div>
            <p className="text-[11px] font-bold text-slate-600">Assinatura do Cliente</p>
          </div>
        )}

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
          @page { size: A4; margin: 20mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-break-inside-avoid { break-inside: avoid; }
          .print-break-before { page-break-before: always; }
          .no-print { display: none !important; }
          .print-details-section {
            break-inside: auto;
            page-break-inside: auto;
          }
          .print-detail-block {
            margin-bottom: 1rem;
          }
          .print-detail-block img,
          .print-detail-block table,
          .print-detail-block li {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .print-detail-block .rich-text-content {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .print-detail-block .rich-text-content * {
            max-height: none !important;
            overflow: visible !important;
          }
          .print-detail-block .rich-text-content img {
            max-width: 50% !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .print-detail-block .rich-text-content img[data-align='left'] {
            float: left !important;
            margin-right: 1em;
            margin-bottom: 0.5em;
          }
          .print-detail-block .rich-text-content img[data-align='right'] {
            float: right !important;
            margin-left: 1em;
            margin-bottom: 0.5em;
          }
          .print-detail-block .rich-text-content::after {
            content: '';
            display: table;
            clear: both;
          }
          .print-detail-block .rich-text-content p,
          .print-detail-block .rich-text-content ul,
          .print-detail-block .rich-text-content ol,
          .print-detail-block .rich-text-content li {
            overflow: visible !important;
            max-height: none !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
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
          .font-bold { font-weight: bold !important; }
          h2, h3, h4 { font-weight: bold !important; }
          th { font-weight: bold !important; }
        }
      `}</style>
      <div className="print-only-footer">
        <p>Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial</p>
        <p>Vinhedo - SP - Brasil - CEP: 13280-172 - Fone: (19) 3826-7373</p>
        <p>E-mail: vendas@bener.com.br - Site: www.bener.com.br</p>
      </div>
    </div>
  )
}
