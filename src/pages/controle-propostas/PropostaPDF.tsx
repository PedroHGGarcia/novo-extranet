import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProposta, type Proposta } from '@/services/propostas'
import { getTipoProposta, type TipoProposta } from '@/services/tipos-propostas'
import { Button } from '@/components/ui/button'
import { Printer, AlertCircle } from 'lucide-react'
import { PropostaDocument } from '@/components/PropostaDocument'
import pb from '@/lib/pocketbase/client'

export default function PropostaPDF() {
  const { id } = useParams<{ id: string }>()
  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [tipoProposta, setTipoProposta] = useState<TipoProposta | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      getProposta(id)
        .then(async (p) => {
          setProposta(p)
          if (p.tipo_proposta) {
            try {
              const tp = await getTipoProposta(p.tipo_proposta)
              setTipoProposta(tp)
            } catch {
              // Intentionally ignored
            }
          }
          setTimeout(() => {
            window.print()
          }, 1500)
        })
        .catch((err) => {
          console.error('Erro ao carregar proposta:', err)
          setError(
            'Não foi possível carregar o documento da proposta. Verifique se ela existe e tente novamente.',
          )
        })
    }
  }, [id])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-slate-900 mb-2">Erro ao carregar documento</h2>
          <p className="text-slate-600 text-sm mb-6">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#337ab7] hover:bg-[#286090]"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#337ab7]"></div>
        <p className="mt-4 text-slate-500 font-medium">Carregando documento...</p>
      </div>
    )
  }

  const cliente = proposta.expand?.cliente
  const clienteNome = cliente?.razao_social || cliente?.fantasia || proposta.cliente_original || '-'
  const clienteEndereco = cliente
    ? `${cliente.logradouro || ''}, ${cliente.numero || ''} - ${cliente.bairro || ''} - ${cliente.cidade || ''}`.replace(
        /^[,\s-]+|[,\s-]+$/g,
        '',
      )
    : ''
  const clienteEmail = cliente?.email || ''

  const representante = proposta.expand?.representante
  const representanteNome = representante?.fantasia || proposta.representante_original || '-'
  const representanteSigla =
    representante?.sigla || representante?.fantasia?.substring(0, 3).toUpperCase() || '-'

  const versao = proposta.expand?.versao
  const versaoNome = versao?.nome || proposta.versao_original || '-'
  const versaoImagemUrl = versao?.imagem_preview
    ? pb.files.getURL(versao as any, versao.imagem_preview)
    : null

  const modelo = versao?.expand?.modelo
  const marcaNome = modelo?.expand?.marca?.nome || '-'
  const categoriaNome = modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'

  const gerenteNome = proposta.expand?.gerente?.nome || proposta.gerente_original || '-'

  const acessorios = Array.isArray(proposta.acessorios_proposta)
    ? proposta.acessorios_proposta.filter(
        (a: any) => a?.exibir || a?.estado === 'exibir' || a?.incluir || a?.estado === 'incluir',
      )
    : []

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white flex justify-center py-8 print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .print-break-inside-avoid { break-inside: avoid; }
          .print-break-before { page-break-before: always; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed top-4 right-4 no-print z-50">
        <Button
          onClick={() => window.print()}
          className="bg-[#337ab7] hover:bg-[#286090] shadow-md gap-2"
        >
          <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <PropostaDocument
        proposta={proposta}
        tipoProposta={tipoProposta}
        clienteNome={clienteNome}
        clienteEndereco={clienteEndereco}
        clienteEmail={clienteEmail}
        representanteNome={representanteNome}
        representanteSigla={representanteSigla}
        versaoNome={versaoNome}
        versaoImagemUrl={versaoImagemUrl}
        categoriaNome={categoriaNome}
        marcaNome={marcaNome}
        gerenteNome={gerenteNome}
        acessorios={acessorios}
      />
    </div>
  )
}
