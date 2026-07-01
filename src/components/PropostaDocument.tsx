import { type Proposta } from '@/services/propostas'
import { type TipoProposta } from '@/services/tipos-propostas'
import benerLogoUrl from '@/assets/bener-thumb-c5c1b.png'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[currency] || currency || 'BRL'
  try {
    return new Intl.NumberFormat('pt-BR', {
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
}: PropostaDocumentProps) {
  const dataEmissao = proposta.dt_cad ? new Date(`${proposta.dt_cad}T00:00:00`) : new Date()
  const dataFormatada = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const mesOferta = format(dataEmissao, 'MM')
  const anoOferta = format(dataEmissao, 'yyyy')
  const numRevisao = proposta.revisao
    ? `${proposta.numero_proposta}-${proposta.revisao}`
    : proposta.numero_proposta

  return (
    <div className="bg-white text-black w-[210mm] max-w-full min-h-[297mm] p-12 shadow-lg print:shadow-none print:w-full print:m-0 relative mx-auto box-border">
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
            <p className="leading-relaxed">{tipoProposta?.validade_oferta || '-'}</p>
          </div>

          {tipoProposta?.frase_preco && (
            <div className="col-span-2 mt-4 pt-4 border-t border-slate-300">
              <p className="font-bold uppercase tracking-wider mb-2">Observações de Preço</p>
              <p className="leading-relaxed font-medium">{tipoProposta.frase_preco}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cláusulas Contratuais */}
      {tipoProposta && (
        <div className="mt-12 space-y-8 font-mono text-[13px] text-justify leading-relaxed">
          <h2 className="font-bold text-[15px] uppercase tracking-wide border-b-2 border-black pb-2 mb-6">
            Cláusulas Contratuais e Condições Gerais
          </h2>

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
      )}

      {/* Footer info & Assinatura/QR Code */}
      <div className="mt-20 pt-8 border-t border-black grid grid-cols-3 gap-6 font-mono print-break-inside-avoid items-end">
        <div className="flex flex-col items-center justify-end text-center h-full">
          <div className="w-56 border-t border-black mt-8"></div>
          <p className="font-bold mt-3 text-[12px] uppercase">
            {proposta.expand?.user?.name || gerenteNome}
          </p>
          <p className="text-[11px] mt-1">Assinatura Eletrônica</p>
        </div>

        <div className="text-center text-[10px] flex flex-col justify-end h-full">
          <p className="font-bold mb-1 uppercase">Bener - Soluções em Máquinas e Equipamentos</p>
          <p>Este é um documento gerado eletronicamente e tem validade como proposta comercial.</p>
        </div>

        <div className="flex flex-col items-center justify-end h-full text-center">
          {proposta.id && (
            <>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://extranetgourmet.goskip.app/validar-proposta/${proposta.id}`)}`}
                alt="QR Code de Validação"
                className="w-[80px] h-[80px] mb-3"
              />
              <p className="text-[10px] uppercase leading-tight font-bold">
                Escaneie para validar
                <br />a autenticidade
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
