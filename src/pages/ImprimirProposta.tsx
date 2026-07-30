import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProposta } from '@/services/propostas'
import { formatCurrency } from '@/pages/controle-propostas/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'
import benerLogoUrl from '@/assets/logo-bener-4ae76.png'
import '@/styles/print-proposta.css'
import { sanitizeHtml } from '@/lib/sanitize'

export default function ImprimirProposta() {
  const { id } = useParams()
  const [proposta, setProposta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) {
      setError(true)
      setLoading(false)
      return
    }
    getProposta(id)
      .then((prop) => {
        setProposta(prop)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    if (!loading && proposta && !error) {
      const timer = setTimeout(() => window.print(), 300)
      return () => clearTimeout(timer)
    }
  }, [loading, proposta, error])

  if (loading) {
    return <div className="print-loading">Carregando proposta...</div>
  }

  if (error || !proposta) {
    return <div className="print-error">Proposta não encontrada.</div>
  }

  const c = proposta.expand?.cliente
  const rep = proposta.expand?.representante
  const v = proposta.expand?.versao
  const modelo = v?.expand?.modelo
  const gerente = proposta.expand?.gerente
  const user = proposta.expand?.user
  const tipo = proposta.expand?.tipo_proposta

  let dataEmissao = new Date()
  if (proposta.dt_cad) {
    const d = new Date(proposta.dt_cad)
    if (!isNaN(d.getTime())) dataEmissao = d
  }
  const dataFmt = format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const mes = format(dataEmissao, 'MM')
  const ano = format(dataEmissao, 'yyyy')
  const numRev = proposta.revisao
    ? `${proposta.numero_proposta}-${proposta.revisao}`
    : proposta.numero_proposta

  const endereco = c
    ? [
        c.logradouro || '',
        c.numero ? `, ${c.numero}` : '',
        c.bairro ? ` - ${c.bairro}` : '',
        c.cidade ? ` - ${c.cidade}` : '',
        c.estado ? `/${c.estado}` : '',
        c.cep ? ` - CEP: ${c.cep}` : '',
      ]
        .join('')
        .replace(/^[,\s-]+/, '')
    : ''

  const accs = proposta.acessorios_proposta || []
  const included = accs.filter((a: any) => a.estado === 'incluir')
  const optional = accs.filter((a: any) => a.estado === 'exibir')

  const specsJson = modelo?.expand?.produto?.especificacoes
  const hasSpecsJson = Array.isArray(specsJson) && specsJson.length > 0

  const garantia = proposta.cobertura_garantia || tipo?.garantia || ''
  const assist = proposta.assistencia_tecnica_detalhada || tipo?.assistencia_tecnica || ''
  const treinamento = proposta.treinamento_tecnico || tipo?.treinamento_tecnico || ''
  const transporte = proposta.transporte_seguro || tipo?.transporte_seguro || ''
  const validade = proposta.validade_oferta || tipo?.validade_oferta || ''

  const condicoes = [
    {
      num: '7.1',
      titulo: 'Prazo de Entrega',
      valor: proposta.prazo_entrega || tipo?.prazo_entrega,
    },
    {
      num: '7.2',
      titulo: 'Condições de Pagamento',
      valor: proposta.condicoes_pagamento || tipo?.condicoes_pagamento,
    },
    { num: '7.3', titulo: 'Garantia', valor: garantia },
    { num: '7.4', titulo: 'Assistência Técnica', valor: assist },
    { num: '7.5', titulo: 'Treinamento Técnico', valor: treinamento },
    { num: '7.6', titulo: 'Transporte / Seguro', valor: transporte },
    { num: '7.7', titulo: 'Validade desta Oferta', valor: validade },
  ].filter((cond) => cond.valor)

  const sigRep = proposta.assinatura_representante
    ? pb.files.getURL(proposta, proposta.assinatura_representante)
    : user?.assinatura
      ? pb.files.getURL(user, user.assinatura)
      : null
  const gUser = gerente?.expand?.usuario
  const sigGer = gUser?.assinatura ? pb.files.getURL(gUser, gUser.assinatura) : null
  const sigCliente = proposta.assinatura_cliente
    ? pb.files.getURL(proposta, proposta.assinatura_cliente)
    : null
  const imgPreview = v?.imagem_preview ? pb.files.getURL(v, v.imagem_preview) : null

  return (
    <div className="proposta-print">
      <div className="proposta-header">
        <div className="header-left">
          <img src={benerLogoUrl} alt="Bener" className="header-logo" />
          <p className="header-company">Bener Comercial Importadora Exportadora Ltda.</p>
        </div>
        <div className="header-right">
          <p>Vinhedo, {dataFmt}</p>
          <table className="header-table">
            <tbody>
              <tr>
                <td>Sigla</td>
                <td>Nº Oferta</td>
                <td>Mês</td>
                <td>Ano</td>
              </tr>
              <tr>
                <td>{rep?.sigla || '-'}</td>
                <td>{numRev || '-'}</td>
                <td>{mes}</td>
                <td>{ano}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="destinatario">
        <p>À</p>
        <p className="dest-nome">
          {c?.fantasia || c?.razao_social || proposta.cliente_original || '-'}
        </p>
        <p>{endereco || '-'}</p>
        {c?.documento && <p>CNPJ: {c.documento}</p>}
        <p>Telefone: {c?.telefone || c?.celular || proposta.telefone || '-'}</p>
        <p>E-mail: {c?.email || '-'}</p>
        <p className="dest-ac">A/C. Sr. {proposta.contato || '-'}</p>
      </div>

      <div className="saudacao">
        <p>Prezados Senhores,</p>
        <p className="saudacao-text">
          Atendendo a sua prezada consulta, temos o prazer de submeter a vossa devida apreciação
          nossa proposta acima citada, para o fornecimento de:
        </p>
      </div>

      <h2 className="equipamento-titulo">
        {modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'} MARCA{' '}
        {modelo?.expand?.marca?.nome || '-'} - {v?.nome || proposta.versao_original || '-'}
      </h2>

      {imgPreview && (
        <div className="equipamento-imagem">
          <img src={imgPreview} alt={v?.nome} />
          <p className="imagem-ilustrativa">Imagem meramente ilustrativa</p>
        </div>
      )}

      {v?.acessorios_standards?.trim() && (
        <section className="secao">
          <h3>1. EQUIPADA COM SEUS ACESSÓRIOS STANDARD ABAIXO DESCRITOS</h3>
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.acessorios_standards || '') }}
          />
        </section>
      )}

      {v?.caracteristicas_construtivas?.trim() && (
        <section className="secao">
          <h3>2. CARACTERÍSTICAS CONSTRUTIVAS PRINCIPAIS</h3>
          <div
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.caracteristicas_construtivas || '') }}
          />
        </section>
      )}

      {(hasSpecsJson || v?.especificacoes_tecnicas?.trim()) && (
        <section className="secao">
          <h3>3. ESPECIFICAÇÕES TÉCNICAS PRINCIPAIS</h3>
          {hasSpecsJson ? (
            <table className="tabela-especificacoes">
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th>Unidade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {specsJson.map((s: any, i: number) => (
                  <tr key={i}>
                    <td className="col-label">{s.parametro || s.nome || '-'}</td>
                    <td className="col-unit">{s.unidade || ''}</td>
                    <td className="col-value">{s.valor ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className="rich-text-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.especificacoes_tecnicas || '') }}
            />
          )}
        </section>
      )}

      {included.length > 0 && (
        <section className="secao">
          <h3>4. ACESSÓRIOS OPCIONAIS INCLUSOS NO PREÇO</h3>
          <ul className="lista-bullets">
            {included.map((a: any, i: number) => (
              <li key={i}>{a.nome}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="secao">
        <h3>5. PREÇOS</h3>
        <p>
          {tipo?.frase_preco ||
            `Ex Works Vinhedo / Importação direta pelo cliente — ${formatCurrency(proposta.valor_final, proposta.moeda)}`}
        </p>
        <p>
          Pagamento Brasil: Serviços e Comissão Bener —{' '}
          {formatCurrency(proposta.valor_final, proposta.moeda)}
        </p>
      </section>

      {optional.length > 0 && (
        <section className="secao">
          <h3>6. ACESSÓRIOS OPCIONAIS NÃO INCLUSOS NO PREÇO ACIMA</h3>
          <ul className="lista-opcionais">
            {optional.map((a: any, i: number) => (
              <li key={i}>
                <span className="item-nome">{a.nome}</span> —{' '}
                <span className="item-valor">{formatCurrency(a.valor, a.moeda)}</span> —{' '}
                <span className="item-status">NÃO INCLUSO</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="secao">
        <h3>7. CONDIÇÕES GERAIS DE FORNECIMENTO</h3>
        <div className="condicoes">
          {condicoes.map((cond) => (
            <div key={cond.num} className="condicao-item">
              <h4>
                {cond.num} {cond.titulo}
              </h4>
              <p>{cond.valor}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="secao-assinaturas">
        <p className="closing-text">
          Antecipadamente agradecemos vossa honrosa preferência, permanecendo ao vosso inteiro
          dispor, para dirimir e atender quaisquer eventuais esclarecimentos adicionais que se
          fizerem necessários.
        </p>
        <p>Atenciosamente,</p>
        <div className="assinaturas-grid">
          <div className="assinatura-block">
            <div className="assinatura-img-wrapper">
              {sigRep && <img src={sigRep} alt="Assinatura" className="assinatura-img" />}
            </div>
            <div className="assinatura-linha" />
            <p className="assinatura-nome">{user?.name || rep?.fantasia || '-'}</p>
            <p className="assinatura-cargo">{user?.setor || 'Comercial'}</p>
          </div>
          {(sigGer || gerente?.nome || proposta.gerente_original) && (
            <div className="assinatura-block">
              <div className="assinatura-img-wrapper">
                {sigGer && <img src={sigGer} alt="Assinatura" className="assinatura-img" />}
              </div>
              <div className="assinatura-linha" />
              <p className="assinatura-nome">{gerente?.nome || proposta.gerente_original || '-'}</p>
              <p className="assinatura-cargo">Gerente</p>
            </div>
          )}
          {(sigCliente || c?.fantasia || c?.razao_social || proposta.cliente_original) && (
            <div className="assinatura-block">
              <div className="assinatura-img-wrapper">
                {sigCliente && (
                  <img src={sigCliente} alt="Assinatura Cliente" className="assinatura-img" />
                )}
              </div>
              <div className="assinatura-linha" />
              <p className="assinatura-nome">
                {c?.fantasia || c?.razao_social || proposta.cliente_original || '-'}
              </p>
              <p className="assinatura-cargo">Cliente</p>
            </div>
          )}
        </div>
        {rep && (
          <div className="rep-info">
            <p>{rep.fantasia}</p>
            <p>{rep.telefone_principal || rep.telefone || '-'}</p>
          </div>
        )}
      </div>

      <div className="proposta-footer">
        <p>Rua Iracema Lucas, 450 (Antiga Rua Parsch) – Distrito Industrial</p>
        <p>Vinhedo - SP - Brasil - CEP: 13280-172 - Fone / Fax: (0**19) 3826-7373</p>
        <p>E-mail: vendas@bener.com.br - Site: www.bener.com.br</p>
      </div>
    </div>
  )
}
