export interface Representante {
  nome: string
  descricao?: string
  coordenadas: [number, number][]
  corBorda: string
  corPreenchimento: string
}

export const representantesVeker: Representante[] = [
  {
    nome: 'WLADIMIR',
    descricao: 'Região Metropolitana de São Paulo - Zona Oeste',
    coordenadas: [
      [-23.5551004, -46.6355442],
      [-23.5736674, -46.6994025],
      [-23.6015253, -46.7816094],
      [-23.62, -46.75],
      [-23.58, -46.68],
      [-23.54, -46.63],
    ],
    corBorda: '#000000',
    corPreenchimento: 'rgba(0,0,0,0.3)',
  },
  {
    nome: 'ALMEIDA',
    descricao: 'Região Metropolitana de São Paulo - Centro',
    coordenadas: [
      [-23.5566751, -46.6303943],
      [-23.5744539, -46.628335],
      [-23.5922327, -46.6221546],
      [-23.61, -46.63],
      [-23.59, -46.64],
      [-23.56, -46.64],
    ],
    corBorda: '#FF5252',
    corPreenchimento: 'rgba(255,82,82,0.3)',
  },
  {
    nome: 'SANTANA',
    descricao: 'Campinas e Vale do Paraíba',
    coordenadas: [
      [-23.1573114, -46.7518842],
      [-22.9742172, -46.5336257],
      [-22.7396949, -46.4654448],
      [-22.7, -46.55],
      [-22.9, -46.7],
      [-23.1, -46.78],
    ],
    corBorda: '#0097A7',
    corPreenchimento: 'rgba(0,151,167,0.3)',
  },
  {
    nome: 'JOSUÉ',
    descricao: 'Interior de São Paulo - Região Oeste',
    coordenadas: [
      [-23.2579637, -46.8507788],
      [-23.068643, -47.758306],
      [-23.2091805, -48.1649963],
      [-23.35, -48.1],
      [-23.4, -47.5],
      [-23.35, -46.9],
    ],
    corBorda: '#9C27B0',
    corPreenchimento: 'rgba(156,39,176,0.3)',
  },
  {
    nome: 'VICTOR HUGO',
    descricao: 'Região Sul - Paraná e Santa Catarina',
    coordenadas: [
      [-23.6809308, -49.5602335],
      [-23.2706107, -49.5141798],
      [-22.3264849, -48.898576],
      [-22.2, -48.7],
      [-22.8, -49.3],
      [-23.5, -49.6],
    ],
    corBorda: '#BDBDBD',
    corPreenchimento: 'rgba(189,189,189,0.3)',
  },
  {
    nome: 'AURÉLIO',
    descricao: 'Região Oeste de São Paulo',
    coordenadas: [
      [-23.3269587, -46.9145991],
      [-23.4415011, -47.0397072],
      [-23.6648065, -46.972622],
      [-23.7, -46.9],
      [-23.55, -46.8],
      [-23.4, -46.85],
    ],
    corBorda: '#0F9D58',
    corPreenchimento: 'rgba(15,157,88,0.3)',
  },
  {
    nome: 'RAMON - MARCOS SANCHES',
    descricao: 'Região Leste de São Paulo',
    coordenadas: [
      [-23.4876194, -46.4097886],
      [-23.5452142, -46.3301466],
      [-23.617914, -46.374083],
      [-23.65, -46.45],
      [-23.6, -46.5],
      [-23.52, -46.48],
    ],
    corBorda: '#006064',
    corPreenchimento: 'rgba(0,96,100,0.3)',
  },
  {
    nome: 'FLÁVIO MARTINS',
    descricao: 'Região Sul de Minas Gerais',
    coordenadas: [
      [-22.7590037, -45.2752531],
      [-22.7855948, -45.3494108],
      [-22.900763, -45.4263152],
      [-23.0, -45.4],
      [-22.9, -45.3],
      [-22.8, -45.25],
    ],
    corBorda: '#000000',
    corPreenchimento: 'rgba(0,0,0,0.3)',
  },
  {
    nome: 'RENATO',
    descricao: 'Região ABC - São Paulo',
    coordenadas: [
      [-23.7541416, -46.598236],
      [-23.7623046, -46.4623953],
      [-23.7300965, -46.4535592],
      [-23.7, -46.5],
      [-23.71, -46.58],
      [-23.74, -46.61],
    ],
    corBorda: '#FFEA00',
    corPreenchimento: 'rgba(255,234,0,0.3)',
  },
]

export const poligonosEspeciais: Representante[] = [
  {
    nome: 'POLÍGONO 11',
    descricao: 'Região Nordeste - Sergipe e Alagoas',
    coordenadas: [
      [-10.5005751, -36.3450172],
      [-9.3968385, -35.2683571],
      [-7.6803056, -34.8289039],
      [-8.2, -35.1],
      [-9.5, -35.8],
      [-10.3, -36.3],
    ],
    corBorda: '#000000',
    corPreenchimento: 'rgba(0,0,0,0.3)',
  },
]
