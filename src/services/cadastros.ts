import pb from '@/lib/pocketbase/client'

// Clientes
export const getByDocumento = async (collection: string, documento: string) => {
  if (!documento) return null
  try {
    return await pb.collection(collection).getFirstListItem(`documento="${documento}"`)
  } catch {
    return null
  }
}

export const getClientes = () => pb.collection('clientes').getFullList({ sort: '-created' })
export const createCliente = (data: any) => pb.collection('clientes').create(data)
export const updateCliente = (id: string, data: any) => pb.collection('clientes').update(id, data)
export const deleteCliente = (id: string) => pb.collection('clientes').delete(id)

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
