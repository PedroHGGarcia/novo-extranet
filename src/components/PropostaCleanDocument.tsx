import { type Proposta } from '@/services/propostas'
import { type TipoProposta } from '@/services/tipos-propostas'
import benerLogoUrl from '@/assets/bener-thumb-c5c1b.png'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PropostaCleanSections } from '@/components/PropostaCleanSections'

interface VersaoComparacaoItem {
  nome: string
  especificacoes?: any[]
}

interface PropostaCleanDocumentProps {
  proposta: Partial<Proposta>
  tipoProposta?: TipoProposta | null
  clienteNome: string
  clienteEndereco?: string
  clienteEmail?: string
  clienteCnpj?: string
  clienteTelefone?: string
  clienteContato?: string
  representanteNome: string
  representanteSigla?: string
  representanteTelefone?: string
  versaoNome: string
  versaoImagemUrl?: string | null
  categoriaNome?: string
  marcaNome?: string
  gerenteNome: string
  acessorios: any[]
  acessoriosStandards?: string
  caracteristicasConstrutivas?: string
  especificacoesTecnicas?: string
  especificacoesJson?: any[]
  assinaturaRepresentanteUrl?: string | null
  gerenteAssinaturaUrl?: string | null
  assinaturaClienteUrl?: string | null
  assinaturaGerenteProdutoUrl?: string | null
  assinaturaAssessorTecnicoUrl?: string | null
  nomeGerenteProduto?: string
  nomeAssessorTecnico?: string
  nomeRepresentanteComercial?: string
  issuerSectorLabel?: string
  issuerName?: string
  mostrarPagamentoBrasil?: boolean
  versoesComparacao?: VersaoComparacaoItem[]
}

export function PropostaCleanDocument({
  proposta,
  tipoProposta,
  clienteNome,
  clienteEndereco,
  clienteEmail,
  clienteCnpj,
  clienteTelefone,
  clienteContato,
  representanteNome,
  representanteSigla,
  representanteTelefone,
  versaoNome,
  versaoImagemUrl,
  categoriaNome,
  marcaNome,
  gerenteNome,
  acessorios,
  acessoriosStandards,
  caracteristicasConstrutivas,
  especificacoesTecnicas,
  especificacoesJson,
  assinaturaRepresentanteUrl,
  gerenteAssinaturaUrl,
  assinaturaClienteUrl,
  assinaturaGerenteProdutoUrl,
  assinaturaAssessorTecnicoUrl,
  nomeGerenteProduto,
  nomeAssessorTecnico,
  nomeRepresentanteComercial,
  issuerSectorLabel,
  issuerName,
  mostrarPagamentoBrasil,
  versoesComparacao,
}: PropostaCleanDocumentProps) {
  let dataEmissao = new Date()
  if (typeof proposta.dt_cad === 'string' && proposta.dt_cad.length >= 10) {
    const p = proposta.dt_cad.substring(0, 10).split('-')
    if (p.length === 3) {
      const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]))
      if (!isNaN(d.getTime())) dataEmissao = d
    }
  }

  const dataFormatada = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const mesOferta = format(dataEmissao, 'MM')
  const anoOferta = format(dataEmissao, 'yyyy')
  const numRevisao = proposta.revisao
    ? `${proposta.numero_proposta}-${proposta.revisao}`
    : proposta.numero_proposta

  const signatureBlocks = [
    {
      label: 'Gerente de Produto',
      sigUrl: assinaturaGerenteProdutoUrl ?? gerenteAssinaturaUrl,
      nome: nomeGerenteProduto ?? gerenteNome,
    },
    {
      label: 'Assessor Técnico',
      sigUrl: assinaturaAssessorTecnicoUrl,
      nome: nomeAssessorTecnico,
    },
    {
      label: 'Representante Comercial',
      sigUrl: assinaturaRepresentanteUrl,
      nome: nomeRepresentanteComercial ?? issuerName ?? representanteNome,
    },
  ]

  return (
    <div
      className="clean-doc-root bg-white text-black w-[210mm] max-w-full min-h-[297mm] p-12 mx-auto font-sans print:p-0"
      style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
    >
      <div className="doc-header flex justify-between items-start mb-4 pb-3 border-b border-black">
        <img src={benerLogoUrl} alt="Bener" className="h-16 object-contain" />
        <div
          className="text-right text-[10pt]"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          <p className="font-bold">Bener Comercial Importadora Exportadora Ltda.</p>
          <p>Vinhedo, {dataFormatada}</p>
          <table className="ml-auto mt-2 border-collapse text-[10pt]">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1">
                  <span className="font-bold">Sigla:</span> {representanteSigla || '-'}
                </td>
                <td className="border border-black px-2 py-1">
                  <span className="font-bold">Nº Oferta:</span> {numRevisao || '-'}
                </td>
                <td className="border border-black px-2 py-1">
                  <span className="font-bold">Mês:</span> {mesOferta}
                </td>
                <td className="border border-black px-2 py-1">
                  <span className="font-bold">Ano:</span> {anoOferta}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        className="text-[10pt] leading-tight mb-3 break-inside-avoid"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <p>À</p>
        <p className="font-bold uppercase">{clienteNome}</p>
        <p>{clienteEndereco || '-'}</p>
        {clienteCnpj && (
          <p>
            <span className="font-bold">CNPJ:</span> {clienteCnpj}
          </p>
        )}
        <p>
          <span className="font-bold">Telefone:</span> {clienteTelefone || proposta.telefone || '-'}
        </p>
        <p>
          <span className="font-bold">E-mail:</span> {clienteEmail || '-'}
        </p>
        <br />
        <p className="font-bold uppercase">A/C. Sr. {clienteContato || '-'}</p>
        <br />
        <p>Prezados Senhores,</p>
        <br />
        <p className="text-justify leading-tight">
          Atendendo a sua prezada consulta, temos o prazer de submeter a vossa devida apreciação
          nossa proposta acima citada, para o fornecimento de:
        </p>
      </div>

      <div className="text-center mb-3 break-inside-avoid">
        <h2
          className="text-[12pt] font-bold uppercase"
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
        >
          {categoriaNome} MARCA {marcaNome} - {versaoNome}
        </h2>
      </div>

      {versaoImagemUrl && (
        <div className="flex flex-col items-center mb-3 break-inside-avoid">
          <img
            src={versaoImagemUrl}
            alt={versaoNome}
            className="max-w-full max-h-[220px] object-contain"
          />
          <p className="text-[10pt] text-slate-500 mt-1 italic">Imagem meramente ilustrativa</p>
        </div>
      )}

      <PropostaCleanSections
        acessoriosStandards={acessoriosStandards}
        caracteristicasConstrutivas={caracteristicasConstrutivas}
        especificacoesTecnicas={especificacoesTecnicas}
        especificacoesJson={especificacoesJson}
        versaoNome={versaoNome}
        acessorios={acessorios}
        valorFinal={proposta.valor_final}
        moeda={proposta.moeda}
        frasePreco={tipoProposta?.frase_preco}
        tipoProposta={tipoProposta}
        proposta={proposta}
        mostrarPagamentoBrasil={mostrarPagamentoBrasil ?? tipoProposta?.mostrar_pagamento_brasil}
        versoesComparacao={versoesComparacao}
      />

      <div
        className="text-[10pt] text-justify leading-tight mb-4 mt-3 break-inside-avoid"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <p>
          Antecipadamente agradecemos vossa honrosa preferência, permanecendo ao vosso inteiro
          dispor, para dirimir e atender quaisquer eventuais esclarecimentos adicionais que se
          fizerem necessários.
        </p>
        <br />
        <p>Atenciosamente,</p>
      </div>

      <div
        className="grid grid-cols-3 gap-6 mb-4 break-inside-avoid items-stretch"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        {signatureBlocks.map((block, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="h-16 w-full flex items-end justify-center mb-1">
              {block.sigUrl ? (
                <img
                  src={block.sigUrl}
                  alt={block.label}
                  className="max-h-16 max-w-[180px] object-contain"
                />
              ) : (
                <div className="w-full border-b-2 border-dotted border-slate-400 h-10" />
              )}
            </div>
            <div className="w-full border-t border-black pt-1">
              <p className="font-bold text-[10pt]">{block.nome || '-'}</p>
              <p className="text-[9pt] text-slate-600">{block.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="text-[10pt] mb-3 break-inside-avoid"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <p className="underline">{representanteNome}</p>
        <p>{representanteTelefone || '-'}</p>
      </div>

      <div
        className="doc-footer text-center text-[9pt] text-slate-700"
        style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
      >
        <p>Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial</p>
        <p>Vinhedo - SP - Brasil - CEP: 13280-172 - Fone / Fax: (0**19) 3826-7373</p>
        <p>E-mail: vendas@bener.com.br - Site: www.bener.com.br</p>
      </div>

      <style>{`
        @media screen { .doc-footer { display: none; } }
        @media print {
          @page { size: A4; margin: 20mm 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .doc-header { position: fixed; top: 0; left: 0; right: 0; border-bottom: 1px solid #000; padding-bottom: 3mm; background: white; z-index: 100; }
          .doc-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #000; padding-top: 3mm; background: white; z-index: 100; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          .clean-doc-root > div, .clean-doc-root > section { break-inside: avoid; page-break-inside: avoid; page-break-before: auto; }
          .rich-text-content { overflow: visible !important; max-height: none !important; }
          .rich-text-content * { max-height: none !important; overflow: visible !important; }
          .font-bold { font-weight: bold !important; }
          h2, h3, h4 { font-weight: bold !important; }
          th { font-weight: bold !important; }
        }
      `}</style>
    </div>
  )
}
