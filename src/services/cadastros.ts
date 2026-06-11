import pb from '@/lib/pocketbase/client'

export const getClientes = () => pb.collection('clientes').getFullList()
export const getRepresentantes = () => pb.collection('representantes').getFullList()
export const getPrepostos = () => pb.collection('prepostos').getFullList()
