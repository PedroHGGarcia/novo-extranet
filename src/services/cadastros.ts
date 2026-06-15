import pb from '@/lib/pocketbase/client'

// Clientes
export const getClientes = () => pb.collection('clientes').getFullList({ sort: '-created' })
export const createCliente = (data: any) => pb.collection('clientes').create(data)
export const deleteCliente = (id: string) => pb.collection('clientes').delete(id)

// Representantes
export const getRepresentantes = () =>
  pb.collection('representantes').getFullList({ sort: '-created' })
export const createRepresentante = (data: any) => pb.collection('representantes').create(data)
export const deleteRepresentante = (id: string) => pb.collection('representantes').delete(id)

// Prepostos
export const getPrepostos = () => pb.collection('prepostos').getFullList({ sort: '-created' })
export const createPreposto = (data: any) => pb.collection('prepostos').create(data)
export const deletePreposto = (id: string) => pb.collection('prepostos').delete(id)

// Regiões
export const getRegioes = () => pb.collection('regioes').getFullList({ sort: '-created' })
export const createRegiao = (data: any) => pb.collection('regioes').create(data)
export const deleteRegiao = (id: string) => pb.collection('regioes').delete(id)

// Gerentes
export const getGerentes = () => pb.collection('gerentes').getFullList({ sort: '-created' })
export const createGerente = (data: any) => pb.collection('gerentes').create(data)
export const deleteGerente = (id: string) => pb.collection('gerentes').delete(id)
