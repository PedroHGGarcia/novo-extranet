import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Cadastros from './pages/Cadastros'
import Regioes from './pages/Regioes'
import Gerentes from './pages/Gerentes'
import Clientes from './pages/Clientes'
import Eventos from './pages/Eventos'
import EmitirProposta from './pages/controle-propostas/EmitirProposta'
import Produtos from './pages/Produtos'
import Categorias from './pages/produtos/Categorias'
import Marcas from './pages/produtos/Marcas'
import Modelos from './pages/produtos/Modelos'
import Versoes from './pages/produtos/Versoes'
import VersaoImagens from './pages/produtos/VersaoImagens'
import DashboardProdutos from './pages/produtos/Dashboard'
import Acessorios from './pages/produtos/Acessorios'
import Relatorios from './pages/Relatorios'
import Perfil from './pages/Perfil'
import AreaAtuacao from './pages/AreaAtuacao'
import Usuarios from './pages/Usuarios'
import AuditoriaPage from './pages/Auditoria'
import Configuracoes from './pages/Configuracoes'
import NotFound from './pages/NotFound'
import Representantes from './pages/Representantes'
import Prepostos from './pages/Prepostos'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GlobalAutoFormatter } from './components/GlobalAutoFormatter'

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <TooltipProvider>
        <GlobalAutoFormatter />
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/area-atuacao" element={<AreaAtuacao />} />
              <Route path="/cadastros" element={<Cadastros />} />
              <Route path="/cadastros/regioes" element={<Regioes />} />
              <Route path="/cadastros/gerentes" element={<Gerentes />} />
              <Route path="/cadastros/clientes" element={<Clientes />} />
              <Route path="/cadastros/representantes" element={<Representantes />} />
              <Route path="/cadastros/prepostos" element={<Prepostos />} />
              <Route path="/eventos" element={<Eventos />} />
              <Route path="/controle-propostas/emitir-proposta" element={<EmitirProposta />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/produtos/categorias" element={<Categorias />} />
              <Route path="/produtos/marcas" element={<Marcas />} />
              <Route path="/produtos/modelos" element={<Modelos />} />
              <Route path="/produtos/versoes" element={<Versoes />} />
              <Route path="/produtos/versao-imagens" element={<VersaoImagens />} />
              <Route path="/produtos/acessorios" element={<Acessorios />} />
              <Route path="/produtos/dashboard" element={<DashboardProdutos />} />
              <Route path="/relatorios" element={<Relatorios />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/auditoria" element={<AuditoriaPage />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AuthProvider>
)

export default App
