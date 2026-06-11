import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Eventos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <CalendarDays className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Controle de Eventos</h1>
      </div>

      <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">Agenda da Semana</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 text-center text-muted-foreground py-12">
          Nenhum evento agendado para esta semana.
        </CardContent>
      </Card>
    </div>
  )
}
