import pb from '@/lib/pocketbase/client'

// Documentos Clientes
export const getDocumentosCliente = (clienteId: string) =>
  pb
    .collection('documentos_clientes')
    .getFullList({ filter: `cliente="${clienteId}"`, sort: '-created' })
export const createDocumentoCliente = (data: any) =>
  pb.collection('documentos_clientes').create(data)
export const deleteDocumentoCliente = (id: string) =>
  pb.collection('documentos_clientes').delete(id)

// Clientes
export const getByDocumento = async (collection: string, documento: string) => {
  if (!documento) return null
  try {
    return await pb.collection(collection).getFirstListItem(`documento="${documento}"`)
  } catch {
    return null
  }
}

export const getClientesPaginated = (page: number = 1, perPage: number = 50, filter: string = '') =>
  pb.collection('clientes').getList(page, perPage, { sort: '-created', filter })
export const getClientes = () => pb.collection('clientes').getFullList({ sort: '-created' })

const stripMasks = (data: any) => {
  if (!data) return data
  const cleanData = { ...data }
  const fieldsToStrip = ['documento', 'cep', 'telefone', 'celular', 'telefone_2', 'telefone_3']
  fieldsToStrip.forEach((field) => {
    if (cleanData[field] && typeof cleanData[field] === 'string') {
      cleanData[field] = cleanData[field].replace(/\D/g, '')
    }
  })
  return cleanData
}

export const createCliente = (data: any) => pb.collection('clientes').create(stripMasks(data))
export const updateCliente = (id: string, data: any) =>
  pb.collection('clientes').update(id, stripMasks(data))
export const deleteCliente = (id: string) => pb.collection('clientes').delete(id)
export const clearAllClientes = () => pb.send('/backend/v1/clientes/clear', { method: 'DELETE' })

export const searchClientesPaginated = async (
  query: string,
  page: number = 1,
): Promise<{ items: any[]; hasMore: boolean }> => {
  const perPage = 20
  const escaped = query.replace(/"/g, '\\"')
  const filter = escaped
    ? `documento ~ "${escaped}" || razao_social ~ "${escaped}" || fantasia ~ "${escaped}"`
    : ''
  const res = await pb.collection('clientes').getList(page, perPage, {
    filter,
    sort: 'fantasia',
  })
  return {
    items: res.items,
    hasMore: res.page < res.totalPages,
  }
}

// Representantes
export const getRepresentantes = () =>
  pb.collection('representantes').getFullList({ sort: '-created' })
export const createRepresentante = (data: any) => pb.collection('representantes').create(data)
export const updateRepresentante = (id: string, data: any) =>
  pb.collection('representantes').update(id, data)
export const deleteRepresentante = (id: string) => pb.collection('representantes').delete(id)

// Prepostos
export const getPrepostos = () => pb.collection('prepostos').getFullList({ sort: '-created' })
export const createPreposto = (data: any) => pb.collection('prepostos').create(data)
export const updatePreposto = (id: string, data: any) => pb.collection('prepostos').update(id, data)
export const deletePreposto = (id: string) => pb.collection('prepostos').delete(id)

// Regiões
export const getRegioes = () =>
  pb.collection('regioes').getFullList({ sort: 'nome', expand: 'atualizado_por' })
export const createRegiao = (data: any) => pb.collection('regioes').create(data)
export const updateRegiao = (id: string, data: any) => pb.collection('regioes').update(id, data)
export const deleteRegiao = (id: string) => pb.collection('regioes').delete(id)

// Gerentes
export const getGerentes = () => pb.collection('gerentes').getFullList({ sort: '-created' })
export const createGerente = (data: any) => pb.collection('gerentes').create(data)
export const updateGerente = (id: string, data: any) => pb.collection('gerentes').update(id, data)
export const deleteGerente = (id: string) => pb.collection('gerentes').delete(id)
