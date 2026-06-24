import React, { useState } from 'react'
import EmitirPropostaOriginal from './EmitirProposta'
import { ImportadorInteligente, type ImportConfig } from '@/components/ImportadorInteligente'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet } from 'lucide-react'

const propostaImportConfig: ImportConfig = {
  collection: 'propostas',
  title: 'Importar Propostas',
  fields: [
    { key: 'numero_proposta', label: 'Número da Proposta', type: 'text', required: true },
    {
      key: 'cliente',
      label: 'Cliente',
      type: 'relation',
      required: true,
      relation: {
        collection: 'clientes',
        searchFields: ['documento', 'fantasia', 'razao_social'],
        displayField: 'fantasia',
      },
    },
    { key: 'contato', label: 'Contato', type: 'text' },
    { key: 'telefone', label: 'Telefone', type: 'text' },
    {
      key: 'versao',
      label: 'Versão/Máquina',
      type: 'relation',
      required: true,
      relation: { collection: 'versoes', searchFields: ['cod_erp', 'nome'], displayField: 'nome' },
    },
    {
      key: 'representante',
      label: 'Representante',
      type: 'relation',
      required: true,
      relation: {
        collection: 'representantes',
        searchFields: ['documento', 'fantasia'],
        displayField: 'fantasia',
      },
    },
    {
      key: 'gerente',
      label: 'Gerente',
      type: 'relation',
      relation: {
        collection: 'gerentes',
        searchFields: ['documento', 'nome'],
        displayField: 'nome',
      },
    },
    {
      key: 'user',
      label: 'Usuário',
      type: 'relation',
      required: true,
      relation: { collection: 'users', searchFields: ['email', 'name'], displayField: 'email' },
    },
    { key: 'nota_rep', label: 'Nota Rep', type: 'number' },
    { key: 'dt_cad', label: 'Data de Cadastro', type: 'date' },
    { key: 'moeda', label: 'Moeda', type: 'text' },
    { key: 'valor_sem_desconto', label: 'Valor sem Desconto', type: 'number' },
    { key: 'valor_atual', label: 'Valor Atual', type: 'number' },
    { key: 'valor_final', label: 'Valor Final', type: 'number' },
    { key: 'prazo_entrega', label: 'Prazo de Entrega', type: 'text' },
    { key: 'condicoes_pagamento', label: 'Condições de Pagamento', type: 'text' },
  ],
}

export default function EmitirPropostaWrapper() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative h-full w-full">
      <EmitirPropostaOriginal />

      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 shadow-2xl rounded-full px-6 h-12 z-50 bg-primary hover:bg-primary/90 transition-all hover:scale-105 group"
      >
        <FileSpreadsheet className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold tracking-wide">Importar Lote</span>
      </Button>

      <ImportadorInteligente open={open} onOpenChange={setOpen} config={propostaImportConfig} />
    </div>
  )
}
