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
          className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm h-9 px-4 font-normal tracking-wide"
        >
          PESQUISAR
        </Button>
        <Button
          onClick={onNewClick}
          className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm h-9 px-4 font-normal tracking-wide"
        >
          NOVO
        </Button>
        <Button
          onClick={onDeleteClick}
          className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm h-9 px-4 font-normal tracking-wide"
        >
          EXCLUIR
        </Button>
      </div>
      {showSearch && (
        <Input
          placeholder="Digite para pesquisar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md bg-white border-slate-300"
        />
      )}
    </div>
  )
}
