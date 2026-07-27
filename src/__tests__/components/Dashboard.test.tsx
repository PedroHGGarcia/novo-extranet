import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'Admin', role: 'admin' } }),
}))

vi.mock('@/hooks/use-realtime', () => ({
  useRealtime: vi.fn(),
}))

vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: vi.fn(() => ({
      getFullList: vi.fn().mockResolvedValue([]),
      getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0, totalPages: 0, page: 1 }),
    })),
  },
}))

vi.mock('@/components/CurrencyWidget', () => ({
  CurrencyWidget: () => <div data-testid="currency-widget" />,
}))

vi.mock('@/components/ProjectsWidget', () => ({
  ProjectsWidget: () => <div data-testid="projects-widget" />,
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div data-testid="pie-chart" />,
  Cell: () => null,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div data-testid="bar-chart" />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Legend: () => null,
  Tooltip: () => null,
}))

vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => <div>{children}</div>,
  ChartTooltipContent: () => null,
}))

import Dashboard from '@/pages/Dashboard'

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard with welcome message', async () => {
    render(<Dashboard />)
    expect(screen.getByText(/Olá/i)).toBeInTheDocument()
  })

  it('should render summary cards', async () => {
    render(<Dashboard />)
    expect(screen.getByText('Propostas Criadas')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Aprovação')).toBeInTheDocument()
    expect(screen.getByText('Valor Aprovado')).toBeInTheDocument()
  })

  it('should render widgets', async () => {
    render(<Dashboard />)
    expect(screen.getByTestId('currency-widget')).toBeInTheDocument()
    expect(screen.getByTestId('projects-widget')).toBeInTheDocument()
  })
})
