import { Search, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLocation } from 'react-router-dom'

interface Props {
  onSearchToggle: () => void
  onNewClick: () => void
  onDeleteClick: () => void
  showSearch: boolean
  searchQuery: string
  onSearchChange: (val: string) => void
}

export function RegistrationActionBar({
  onSearchToggle,
  onNewClick,
  onDeleteClick,
  showSearch,
  searchQuery,
  onSearchChange,
}: Props) {
  const location = useLocation()
  if (location.pathname === '/cadastros/clientes') return null

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex gap-2">
        <Button
          onClick={onSearchToggle}
          className="bg-[#337ab7] hover:bg-[#286090] dark:bg-primary dark:hover:bg-primary/80 text-white rounded-md h-9 px-4 text-sm font-medium tracking-wide transition-colors duration-200"
        >
          <Search className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          PESQUISAR
        </Button>
        <Button
          onClick={onNewClick}
          className="bg-[#337ab7] hover:bg-[#286090] dark:bg-primary dark:hover:bg-primary/80 text-white rounded-md h-9 px-4 text-sm font-medium tracking-wide transition-colors duration-200"
        >
          <Plus className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          NOVO
        </Button>
        <Button
          onClick={onDeleteClick}
          className="bg-[#337ab7] hover:bg-[#286090] dark:bg-primary dark:hover:bg-primary/80 text-white rounded-md h-9 px-4 text-sm font-medium tracking-wide transition-colors duration-200"
        >
          <Trash2 className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          EXCLUIR
        </Button>
      </div>
      {showSearch && (
        <Input
          placeholder="Digite para pesquisar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md bg-white dark:bg-input border-slate-300 dark:border-border text-sm"
        />
      )}
    </div>
  )
}
