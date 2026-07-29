import { type Proposta } from '@/services/propostas'
import { type TipoProposta } from '@/services/tipos-propostas'
import benerLogoUrl from '@/assets/bener-thumb-c5c1b.png'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PropostaCleanSections } from '@/components/PropostaCleanSections'
import '@/pages/PrintProposta.css'

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
  nomeGerenteProduto?: string
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
  nomeGerenteProduto,
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
      label: 'Representante Comercial',
      sigUrl: assinaturaRepresentanteUrl,
      nome: nomeRepresentanteComercial ?? issuerName ?? representanteNome,
    },
  ]

  return (
    <div className="clean-doc-root w-[210mm] max-w-full min-h-[297mm] p-12 mx-auto print:p-0">
      <div className="doc-header flex justify-between items-start mb-4 pb-3">
        <img src={benerLogoUrl} alt="Bener" className="h-16 object-contain" />
        <div className="ta-right fs-10">
          <p className="fw-bold">Bener Comercial Importadora Exportadora Ltda.</p>
          <p>Vinhedo, {dataFormatada}</p>
          <table className="doc-header-table ml-auto mt-2">
            <tbody>
              <tr>
                <td>
                  <span className="fw-bold">Sigla:</span> {representanteSigla || '-'}
                </td>
                <td>
                  <span className="fw-bold">Nº Oferta:</span> {numRevisao || '-'}
                </td>
                <td>
                  <span className="fw-bold">Mês:</span> {mesOferta}
                </td>
                <td>
                  <span className="fw-bold">Ano:</span> {anoOferta}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="fs-10 leading-tight mb-3 break-inside-avoid">
        <p>À</p>
        <p className="fw-bold tt-upper">{clienteNome}</p>
        <p>{clienteEndereco || '-'}</p>
        {clienteCnpj && (
          <p>
            <span className="fw-bold">CNPJ:</span> {clienteCnpj}
          </p>
        )}
        <p>
          <span className="fw-bold">Telefone:</span> {clienteTelefone || proposta.telefone || '-'}
        </p>
        <p>
          <span className="fw-bold">E-mail:</span> {clienteEmail || '-'}
        </p>
        <br />
        <p className="fw-bold tt-upper">A/C. Sr. {clienteContato || '-'}</p>
        <br />
        <p>Prezados Senhores,</p>
        <br />
        <p className="ta-justify leading-tight">
          Atendendo a sua prezada consulta, temos o prazer de submeter a vossa devida apreciação
          nossa proposta acima citada, para o fornecimento de:
        </p>
      </div>

      <div className="ta-center mb-3 break-inside-avoid">
        <h2 className="fs-12 fw-bold tt-upper">
          {categoriaNome} MARCA {marcaNome} - {versaoNome}
        </h2>
      </div>

      {versaoImagemUrl && (
        <div className="doc-equipamento-imagem flex flex-col items-center mb-3 break-inside-avoid">
          <img src={versaoImagemUrl} alt={versaoNome} />
          <p className="fs-10 fc-muted mt-1 fs-italic">Imagem meramente ilustrativa</p>
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

      <div className="fs-10 ta-justify leading-tight mb-4 mt-3 break-inside-avoid">
        <p>
          Antecipadamente agradecemos vossa honrosa preferência, permanecendo ao vosso inteiro
          dispor, para dirimir e atender quaisquer eventuais esclarecimentos adicionais que se
          fizerem necessários.
        </p>
        <br />
        <p>Atenciosamente,</p>
      </div>

      <div className="doc-signatures grid grid-cols-2 gap-6 mb-4 break-inside-avoid items-stretch">
        {signatureBlocks.map((block, i) => (
          <div key={i} className="doc-sig-block flex flex-col items-center">
            <div className="doc-sig-img-wrapper h-16 w-full">
              {block.sigUrl ? (
                <img src={block.sigUrl} alt={block.label} className="doc-sig-img" />
              ) : (
                <div className="doc-sig-placeholder" />
              )}
            </div>
            <div className="doc-sig-line w-full pt-1">
              <p className="doc-sig-name fw-bold fs-10">{block.nome || '-'}</p>
              <p className="doc-sig-label fs-9 fc-muted-dark">{block.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="doc-footer ta-center fs-8 fc-body">
        <p>Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial</p>
        <p>Vinhedo - SP - Brasil - CEP: 13280-172 - Fone / Fax: (0**19) 3826-7373</p>
        <p>E-mail: vendas@bener.com.br - Site: www.bener.com.br</p>
      </div>
    </div>
  )
}
