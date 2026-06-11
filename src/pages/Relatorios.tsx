import { LineChart as ChartIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

const chartData = [
  { month: 'Jan', vendas: 186 },
  { month: 'Fev', vendas: 305 },
  { month: 'Mar', vendas: 237 },
  { month: 'Abr', vendas: 73 },
  { month: 'Mai', vendas: 209 },
  { month: 'Jun', vendas: 214 },
]

export default function Relatorios() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <ChartIcon className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Relatórios</h1>
      </div>

      <Card className="border-t-4 border-t-brand-blue shadow-sm rounded-t-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">
            Volume de Vendas (Semestre)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pl-0">
          <ChartContainer
            config={{ vendas: { label: 'Vendas', color: 'hsl(var(--brand-blue))' } }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="vendas"
                  stroke="var(--color-vendas)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--color-vendas)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
