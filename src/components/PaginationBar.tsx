import { ChevronRight } from 'lucide-react'

export function PaginationBar({ total, displayTotal }: { total: number; displayTotal?: number }) {
  const visibleTotal = displayTotal || total
  const countTo = Math.min(50, total)
  return (
    <div className="flex items-center justify-end p-2 border-b text-sm text-[#337ab7]">
      <div className="flex items-center space-x-1">
        <button className="bg-[#337ab7] text-white px-2.5 py-1.5 rounded-sm hover:bg-[#286090]">
          1
        </button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">2</button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">3</button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">4</button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">5</button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">6</button>
        <button className="px-2.5 py-1.5 hover:bg-slate-100 rounded-sm">7</button>
        <button className="px-2 py-1.5 hover:bg-slate-100 rounded-sm">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <span className="text-slate-500 mx-4">
        {total > 0 ? `1-${countTo} de ${visibleTotal.toLocaleString('pt-BR')}` : '0 registros'}
      </span>
      <select className="border border-slate-300 rounded-sm px-2 py-1 text-slate-700 bg-white outline-none">
        <option>50</option>
        <option>100</option>
      </select>
    </div>
  )
}
