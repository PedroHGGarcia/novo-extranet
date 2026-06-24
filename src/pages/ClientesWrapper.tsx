import React, { useState } from 'react'
import ClientesOriginal from './Clientes'
import { ImportadorInteligente, type ImportConfig } from '@/components/ImportadorInteligente'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet } from 'lucide-react'

const clientesImportConfig: ImportConfig = {
  collection: 'clientes',
  title: 'Importar Clientes',
  fields: [
    { key: 'fantasia', label: 'Nome Fantasia', type: 'text', required: true },
    { key: 'razao_social', label: 'Razão Social', type: 'text' },
    { key: 'documento', label: 'Documento (CNPJ/CPF)', type: 'text', required: true },
    { key: 'contato', label: 'Contato', type: 'text' },
    { key: 'telefone', label: 'Telefone Principal', type: 'text' },
    { key: 'celular', label: 'Celular', type: 'text' },
    { key: 'email', label: 'E-mail Principal', type: 'text' },
    { key: 'status', label: 'Status (Ativo/Inativo)', type: 'text', required: true },
    { key: 'cep', label: 'CEP', type: 'text' },
    { key: 'estado', label: 'Estado (UF)', type: 'text' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
    { key: 'bairro', label: 'Bairro', type: 'text' },
    { key: 'logradouro', label: 'Logradouro', type: 'text' },
    { key: 'numero', label: 'Número', type: 'text' },
  ],
}

export default function ClientesWrapper() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative h-full w-full">
      <ClientesOriginal />

      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 shadow-2xl rounded-full px-6 h-12 z-50 bg-primary hover:bg-primary/90 transition-all hover:scale-105 group"
      >
        <FileSpreadsheet className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold tracking-wide">Importar Lote</span>
      </Button>

      <ImportadorInteligente open={open} onOpenChange={setOpen} config={clientesImportConfig} />
    </div>
  )
}
