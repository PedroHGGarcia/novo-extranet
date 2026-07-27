import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/lib/pocketbase/client', () => ({
  default: { collection: vi.fn(() => ({ getFullList: vi.fn().mockResolvedValue([]) })) },
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div>{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}))

import { ImportadorInteligente, parseCSV } from '@/components/ImportadorInteligente'

const mockConfig = {
  collection: 'clientes',
  title: 'Clientes',
  fields: [
    { key: 'nome', label: 'Nome', type: 'text' as const, required: true },
    { key: 'documento', label: 'Documento', type: 'text' as const },
  ],
}

describe('ImportadorInteligente Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render upload area when open', () => {
    render(<ImportadorInteligente open={true} onOpenChange={vi.fn()} config={mockConfig} />)
    expect(screen.getByText(/Arraste um arquivo CSV/i)).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<ImportadorInteligente open={false} onOpenChange={vi.fn()} config={mockConfig} />)
    expect(screen.queryByText(/Arraste um arquivo CSV/i)).not.toBeInTheDocument()
  })

  it('should parse CSV correctly', () => {
    const csv = 'Nome,Documento\n"João","123"\n"Maria","456"'
    const result = parseCSV(csv)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual(['Nome', 'Documento'])
    expect(result[1]).toEqual(['João', '123'])
    expect(result[2]).toEqual(['Maria', '456'])
  })

  it('should detect semicolon separator', () => {
    const csv = 'Nome;Documento\nJoão;123'
    const result = parseCSV(csv)
    expect(result[0]).toEqual(['Nome', 'Documento'])
  })
})
