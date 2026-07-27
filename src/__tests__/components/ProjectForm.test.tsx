import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', role: 'admin' } }),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/hooks/use-realtime', () => ({
  useRealtime: vi.fn(),
}))

vi.mock('@/services/projetos', () => ({
  updateProjeto: vi.fn(),
  updateProjetoWithPropostas: vi.fn(),
  createProjetoWithPropostas: vi.fn(),
}))

vi.mock('@/services/propostas', () => ({
  getUnlinkedPropostasPaginated: vi.fn().mockResolvedValue({ items: [], hasMore: false }),
  getPropostasByProjeto: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/cadastros', () => ({
  searchClientesPaginated: vi.fn().mockResolvedValue({ items: [], hasMore: false }),
}))

vi.mock('@/lib/pocketbase/client', () => ({
  default: { collection: vi.fn(() => ({ getOne: vi.fn() })) },
}))

vi.mock('@/components/SearchableCombobox', () => ({
  SearchableCombobox: () => <div data-testid="combobox" />,
}))

vi.mock('@/components/SearchableMultiSelect', () => ({
  SearchableMultiSelect: () => <div data-testid="multiselect" />,
}))

import { ProjectForm } from '@/components/ProjectForm'

describe('ProjectForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form fields for new project', () => {
    render(<ProjectForm projeto={null} onBack={vi.fn()} />)
    expect(screen.getByText('Novo Projeto')).toBeInTheDocument()
    expect(screen.getByText('Nome do Projeto *')).toBeInTheDocument()
    expect(screen.getByText('Descrição')).toBeInTheDocument()
    expect(screen.getByText('Cliente *')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('should render edit title when projeto provided', () => {
    const mockProjeto = {
      id: '1',
      nome: 'Test',
      descricao: '',
      cliente: 'c1',
      status: 'Em Andamento',
      created: '',
      updated: '',
    }
    render(<ProjectForm projeto={mockProjeto as any} onBack={vi.fn()} />)
    expect(screen.getByText('Editar Projeto')).toBeInTheDocument()
  })

  it('should render save and back buttons', () => {
    render(<ProjectForm projeto={null} onBack={vi.fn()} />)
    expect(screen.getByText('Voltar')).toBeInTheDocument()
    expect(screen.getByText('Salvar')).toBeInTheDocument()
  })
})
