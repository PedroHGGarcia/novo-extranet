import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropostaCleanDocument } from '@/components/PropostaCleanDocument'
import { getProposta } from '@/services/propostas'
import { getTiposProposta } from '@/services/tipos-propostas'
import pb from '@/lib/pocketbase/client'

export default function PropostaPDF() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [tipos, setTipos] = useState<any[]>([])
  const [draftSignatureUrl, setDraftSignatureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    if (id === 'draft') {
      const draftData = sessionStorage.getItem('proposta-draft-data')
      const sigUrl = sessionStorage.getItem('proposta-draft-signature')
      if (draftData) {
        setData(JSON.parse(draftData))
        if (sigUrl) setDraftSignatureUrl(sigUrl)
      }
      getTiposProposta()
        .then(setTipos)
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }

    Promise.all([getProposta(id), getTiposProposta()])
      .then(([prop, tps]) => {
        setData(prop)
        setTipos(tps)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-slate-600">Proposta não encontrada.</p>
        <Button onClick={() => navigate('/controle-propostas/emitir-proposta')}>Voltar</Button>
      </div>
    )
  }

  const selectedCliente = data.expand?.cliente
  const selectedRep = data.expand?.representante
  const selectedVersao = data.expand?.versao
  const modelo = selectedVersao?.expand?.modelo
  const gerente = data.expand?.gerente
  const user = data.expand?.user
  const tipoProposta =
    tipos.find((t) => t.id === data.tipo_proposta) || data.expand?.tipo_proposta || null

  const clienteEndereco = selectedCliente
    ? `${selectedCliente.logradouro || ''}, ${selectedCliente.numero || ''} - ${selectedCliente.bairro || ''} - ${selectedCliente.cidade || ''}/${selectedCliente.estado || ''}`.replace(
        /^[,\s/-]+|[,\s/-]+$/g,
        '',
      )
    : ''

  const getGerenteAssinatura = () => {
    const gUser = gerente?.expand?.usuario
    return gUser?.assinatura ? pb.files.getURL(gUser, gUser.assinatura) : null
  }

  const getAssinaturaRep = () => {
    if (data.assinatura_representante) return pb.files.getURL(data, data.assinatura_representante)
    if (draftSignatureUrl) return draftSignatureUrl
    if (user?.assinatura) return pb.files.getURL(user, user.assinatura)
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4 print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate('/controle-propostas/emitir-proposta')}
          className="gap-2 bg-white text-slate-700 hover:text-slate-900 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a Lista de Propostas
        </Button>
        <Button
          onClick={() => window.open(`/propostas/${id}/imprimir`, '_blank')}
          className="bg-[#337ab7] hover:bg-[#286090] text-white gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimir Proposta
        </Button>
      </div>
      <div
        id="proposta-print-content"
        className="proposta-print-area bg-white shadow-xl overflow-hidden w-fit print:shadow-none print:w-full"
      >
        <PropostaCleanDocument
          proposta={data}
          tipoProposta={tipoProposta}
          clienteNome={
            selectedCliente?.fantasia ||
            selectedCliente?.razao_social ||
            data.cliente_original ||
            '-'
          }
          clienteEndereco={clienteEndereco}
          clienteEmail={selectedCliente?.email || ''}
          clienteCnpj={selectedCliente?.documento || ''}
          clienteTelefone={selectedCliente?.telefone || selectedCliente?.celular || ''}
          clienteContato={data.contato || ''}
          representanteNome={selectedRep?.fantasia || data.representante_original || '-'}
          representanteSigla={
            selectedRep?.sigla || selectedRep?.fantasia?.substring(0, 3).toUpperCase() || '-'
          }
          representanteTelefone={selectedRep?.telefone_principal || selectedRep?.telefone || ''}
          versaoNome={selectedVersao?.nome || data.versao_original || '-'}
          versaoImagemUrl={
            selectedVersao?.imagem_preview
              ? pb.files.getURL(selectedVersao, selectedVersao.imagem_preview)
              : null
          }
          categoriaNome={modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'}
          marcaNome={modelo?.expand?.marca?.nome || '-'}
          gerenteNome={gerente?.nome || data.gerente_original || '-'}
          acessorios={(data.acessorios_proposta || []).filter(
            (a: any) => a.estado === 'incluir' || a.estado === 'exibir',
          )}
          acessoriosStandards={selectedVersao?.acessorios_standards || ''}
          caracteristicasConstrutivas={selectedVersao?.caracteristicas_construtivas || ''}
          especificacoesTecnicas={selectedVersao?.especificacoes_tecnicas || ''}
          especificacoesJson={modelo?.expand?.produto?.especificacoes}
          assinaturaRepresentanteUrl={getAssinaturaRep()}
          gerenteAssinaturaUrl={getGerenteAssinatura()}
          issuerName={user?.name}
          issuerSectorLabel={user?.setor || 'Comercial'}
          assinaturaGerenteProdutoUrl={
            data.assinatura_gerente_produto
              ? pb.files.getURL(data, data.assinatura_gerente_produto)
              : null
          }
          assinaturaAssessorTecnicoUrl={
            data.assinatura_assessor_tecnico
              ? pb.files.getURL(data, data.assinatura_assessor_tecnico)
              : null
          }
          nomeGerenteProduto={data.nome_gerente_produto}
          nomeAssessorTecnico={data.nome_assessor_tecnico}
          nomeRepresentanteComercial={data.nome_representante_comercial}
          versoesComparacao={(() => {
            try {
              return typeof data.versoes_comparacao === 'string'
                ? JSON.parse(data.versoes_comparacao)
                : data.versoes_comparacao
            } catch {
              return undefined
            }
          })()}
        />
      </div>
    </div>
  )
}
