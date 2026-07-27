import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    user: null,
    isAuthenticated: false,
    loading: false,
  }),
}))

vi.mock('@/components/ReCaptcha', () => ({
  ReCaptcha: ({ onVerify }: { onVerify: (t: string) => void }) => (
    <button data-testid="recaptcha" onClick={() => onVerify('fake-token')}>
      Verify
    </button>
  ),
}))

vi.mock('@/services/recaptcha', () => ({
  verifyReCaptchaToken: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

import Login from '@/pages/Login'

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with email, password and submit button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('should show validation error on empty email', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    const emailInput = screen.getByPlaceholderText('seu@email.com')
    await user.click(emailInput)
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    })
  })

  it('should show validation error on short password', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )

    const passwordInput = screen.getByPlaceholderText('••••••••')
    await user.type(passwordInput, '123')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres')).toBeInTheDocument()
    })
  })
})
