import pb from '@/lib/pocketbase/client'
import { logAudit, getCurrentUserId } from '@/services/audit'

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

export const createCliente = async (data: any) => {
  const cleaned = stripMasks(data)
  const record = await pb.collection('clientes').create(cleaned)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'clientes',
    recordId: record.id,
    data: { after: cleaned },
  })
  return record
}

export const updateCliente = async (id: string, data: any) => {
  const cleaned = stripMasks(data)
  const record = await pb.collection('clientes').update(id, cleaned)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'clientes',
    recordId: id,
    data: { after: cleaned },
  })
  return record
}

export const deleteCliente = async (id: string) => {
  const result = await pb.collection('clientes').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'clientes',
    recordId: id,
    data: { deletedAt: new Date().toISOString() },
  })
  return result
}

export const clearAllClientes = () => pb.send('/backend/v1/clientes/clear', { method: 'DELETE' })

export const getTotalClienteCount = async (): Promise<number> => {
  const res = await pb.collection('clientes').getList(1, 1, { fields: 'id' })
  return res.totalItems
}

export const getAllFilteredClienteIds = async (filter: string = ''): Promise<string[]> => {
  const allIds: string[] = []
  let currentPage = 1
  const perPage = 500
  while (true) {
    const res = await pb.collection('clientes').getList(currentPage, perPage, {
      filter,
      fields: 'id',
      sort: '-created',
    })
    allIds.push(...res.items.map((r: any) => r.id))
    if (res.page >= res.totalPages) break
    currentPage++
  }
  return allIds
}

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
export const getRepresentante = (id: string) =>
  pb.collection('representantes').getOne(id, { expand: 'categorias_rel,regioes_rel' })
export const createRepresentante = async (data: any) => {
  const record = await pb.collection('representantes').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'representantes',
    recordId: record.id,
    data: { after: data },
  })
  return record
}
export const updateRepresentante = async (id: string, data: any) => {
  const record = await pb.collection('representantes').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'representantes',
    recordId: id,
    data: { after: data },
  })
  return record
}
export const deleteRepresentante = async (id: string) => {
  const result = await pb.collection('representantes').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'representantes',
    recordId: id,
    data: { deletedAt: new Date().toISOString() },
  })
  return result
}

// Prepostos
export const getPrepostos = () => pb.collection('prepostos').getFullList({ sort: '-created' })
export const createPreposto = (data: any) => pb.collection('prepostos').create(data)
export const updatePreposto = (id: string, data: any) => pb.collection('prepostos').update(id, data)
export const deletePreposto = (id: string) => pb.collection('prepostos').delete(id)

// Regiões
export const getRegioes = () =>
  pb.collection('regioes').getFullList({ sort: 'nome', expand: 'atualizado_por' })
export const createRegiao = async (data: any) => {
  const record = await pb.collection('regioes').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'regioes',
    recordId: record.id,
    data: { after: data },
  })
  return record
}
export const updateRegiao = async (id: string, data: any) => {
  const record = await pb.collection('regioes').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'regioes',
    recordId: id,
    data: { after: data },
  })
  return record
}
export const deleteRegiao = async (id: string) => {
  const result = await pb.collection('regioes').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'regioes',
    recordId: id,
    data: { deletedAt: new Date().toISOString() },
  })
  return result
}

// Gerentes
export const getGerentes = () => pb.collection('gerentes').getFullList({ sort: '-created' })
export const createGerente = async (data: any) => {
  const record = await pb.collection('gerentes').create(data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'create',
    table: 'gerentes',
    recordId: record.id,
    data: { after: data },
  })
  return record
}
export const updateGerente = async (id: string, data: any) => {
  const record = await pb.collection('gerentes').update(id, data)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'update',
    table: 'gerentes',
    recordId: id,
    data: { after: data },
  })
  return record
}
export const deleteGerente = async (id: string) => {
  const result = await pb.collection('gerentes').delete(id)
  await logAudit({
    userId: getCurrentUserId(),
    action: 'delete',
    table: 'gerentes',
    recordId: id,
    data: { deletedAt: new Date().toISOString() },
  })
  return result
}
