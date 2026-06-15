import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Package, Clock, LayoutDashboard } from 'lucide-react'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getModelos,
  getVersoes,
  getCategorias,
  getMarcas,
  getProdutos,
  Modelo,
  Versao,
  CategoriaProduto,
  Marca,
  Produto,
} from '@/services/produtos'

export default function DashboardProdutos() {
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])

  const loadData = async () => {
    const [m, v, c, mr, p] = await Promise.all([
      getModelos(),
      getVersoes(),
      getCategorias(),
      getMarcas(),
      getProdutos(),
    ])
    setModelos(m)
    setVersoes(v)
    setCategorias(c)
    setMarcas(mr)
    setProdutos(p)
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('modelos', loadData)
  useRealtime('versoes', loadData)

  const modelosPorCategoriaData = Object.entries(
    modelos.reduce(
      (acc, m) => {
        const p = produtos.find((prod) => prod.id === m.produto)
        const cId = p?.categoria
        const c = categorias.find((cat) => cat.id === cId)
        const catNome = c?.nome || 'Sem Categoria'
        acc[catNome] = (acc[catNome] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, count]) => ({ name, count }))

  const versoesPorMarcaData = Object.entries(
    versoes.reduce(
      (acc, v) => {
        const mId = v.expand?.modelo?.marca
        const m = marcas.find((mr) => mr.id === mId)
        const mNome = m?.nome || 'Sem Marca'
        acc[mNome] = (acc[mNome] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, count]) => ({ name, count }))

  const trintaDiasAtras = new Date()
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

  const outdatedItems = [
    ...modelos
      .filter((m) => new Date(m.updated) < trintaDiasAtras)
      .map((m) => ({ ...m, type: 'Modelo' })),
    ...versoes
      .filter((v) => new Date(v.updated) < trintaDiasAtras)
      .map((v) => ({ ...v, type: 'Versão' })),
  ]
    .sort((a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime())
    .slice(0, 10)

  const statusOverviewData = Object.entries(
    [...modelos, ...versoes].reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
  ).map(([name, value]) => ({ name, value }))

  const COLORS = ['hsl(var(--primary))', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#60a5fa']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 text-gray-800">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="text-2xl font-normal">Dashboard de Produtos</h1>
        </div>
        <Link to="/produtos">
          <Button variant="outline" className="rounded-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Package className="w-4 h-4 mr-2" /> Total de Modelos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{modelos.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
              <Package className="w-4 h-4 mr-2" /> Total de Versões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800">{versoes.length}</div>
            <div className="text-xs text-amber-500 mt-1">
              {versoes.filter((v) => v.status === 'Em Revisão').length} em revisão
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700">
              Modelos por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}}>
                <BarChart data={modelosPorCategoriaData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700">Versões por Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={{}}>
                <BarChart data={versoesPorMarcaData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700">
              Status Geral (Modelos e Versões)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusOverviewData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusOverviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-sm shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-700 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-500" />
              Itens Desatualizados ({'>'} 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {outdatedItems.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">Tudo atualizado!</div>
              ) : (
                outdatedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50/50 rounded border"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-800">{item.nome}</span>
                      <span className="text-xs text-gray-500">
                        {item.type} • Última alt:{' '}
                        {new Date(item.updated).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-amber-600 border-amber-200 bg-amber-50"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" /> Revisar
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
