import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Outlet,
  Navigate,
} from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Cadastros from './pages/Cadastros'
import Regioes from './pages/Regioes'
import Gerentes from './pages/Gerentes'
import Clientes from './pages/ClientesWrapper'
import Eventos from './pages/Eventos'
import EmitirProposta from './pages/controle-propostas/EmitirProposta'
import ControlePropostas from './pages/controle-propostas/ControlePropostas'
import PropostasAvancadas from './pages/controle-propostas/PropostasAvancadas'
import TiposPropostas from './pages/controle-propostas/TiposPropostas'
import PropostaPDF from './pages/controle-propostas/PropostaPDF'
import DashboardPropostas from './pages/controle-propostas/DashboardPropostas'
import Produtos from './pages/Produtos'
import Categorias from './pages/produtos/Categorias'
import Marcas from './pages/produtos/Marcas'
import Modelos from './pages/produtos/Modelos'
import Versoes from './pages/produtos/Versoes'
import DashboardProdutos from './pages/produtos/Dashboard'
import Acessorios from './pages/produtos/Acessorios'
import AlterarPrecos from './pages/produtos/AlterarPrecos'
import Perfil from './pages/Perfil'
import AreaAtuacao from './pages/AreaAtuacao'
import Usuarios from './pages/Usuarios'
import AuditoriaPage from './pages/Auditoria'
import Configuracoes from './pages/Configuracoes'
import NotFound from './pages/NotFound'
import Representantes from './pages/Representantes'
import RepresentanteEdit from './pages/RepresentanteEdit'
import Projetos from './pages/Projetos'
import ProjectDetailPage from './pages/ProjectDetailPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ValidarProposta from './pages/ValidarProposta'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute, BiddingPermissionRoute } from './components/ProtectedRoute'
import { GlobalAutoFormatter } from './components/GlobalAutoFormatter'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './components/theme-provider'
import { RouteError } from './components/RouteError'
import './styles/editor.css'

const RootLayout = () => (
  <TooltipProvider>
    <GlobalAutoFormatter />
    <Toaster />
    <Sonner />
    <Outlet />
  </TooltipProvider>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<RouteError />}>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/validar-proposta/:id" element={<ValidarProposta />} />
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
          <Route path="/cadastros/representantes/editar/:id" element={<RepresentanteEdit />} />
          <Route path="/projetos" element={<Projetos />} errorElement={<RouteError />} />
          <Route
            path="/projetos/:id"
            element={<ProjectDetailPage />}
            errorElement={<RouteError />}
          />
          <Route path="/cadastros/prepostos" element={<Navigate to="/dashboard" replace />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route element={<BiddingPermissionRoute />}>
            <Route path="/controle-propostas" element={<ControlePropostas />}>
              <Route index element={<Navigate to="/controle-propostas/emitir" replace />} />
              <Route path="emitir" />
              <Route path="dashboard" />
            </Route>
          </Route>
          <Route path="/controle-propostas/dashboard-geral" element={<DashboardPropostas />} />
          <Route
            path="/controle-propostas/emitir-licitacao"
            element={<Navigate to="/controle-propostas/emitir" replace />}
          />
          <Route
            path="/controle-propostas/dashboard-licitacoes"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route path="/controle-propostas/emitir-proposta" element={<EmitirProposta />} />
          <Route path="/controle-propostas/propostas-avancadas" element={<PropostasAvancadas />} />
          <Route path="/controle-propostas/tipos-propostas" element={<TiposPropostas />} />
          <Route path="/controle-propostas/proposta-pdf/:id" element={<PropostaPDF />} />
          <Route
            path="/controle-propostas/propostas-excluidas"
            element={<Navigate to="/controle-propostas/dashboard-geral" replace />}
          />
          <Route
            path="/controle-propostas/assinaturas"
            element={<Navigate to="/controle-propostas/dashboard-geral" replace />}
          />
          <Route
            path="/controle-propostas/cotacoes"
            element={<Navigate to="/controle-propostas/dashboard-geral" replace />}
          />
          <Route
            path="/controle-propostas/tipo-documentos"
            element={<Navigate to="/controle-propostas/dashboard-geral" replace />}
          />
          <Route
            path="/controle-propostas/formas-pagamento"
            element={<Navigate to="/controle-propostas/dashboard-geral" replace />}
          />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produtos/categorias" element={<Categorias />} />
          <Route path="/produtos/marcas" element={<Marcas />} />
          <Route path="/produtos/modelos" element={<Modelos />} />
          <Route path="/produtos/versoes" element={<Versoes />} />
          <Route path="/produtos/versao-imagens" element={<Navigate to="/dashboard" replace />} />
          <Route path="/produtos/acessorios" element={<Acessorios />} />
          <Route path="/produtos/alterar-precos" element={<AlterarPrecos />} />
          <Route
            path="/produtos/hierarquia-versoes"
            element={<Navigate to="/produtos" replace />}
          />
          <Route path="/produtos/dashboard" element={<DashboardProdutos />} />
          <Route path="/relatorios" element={<Navigate to="/dashboard" replace />} />
          <Route path="/vendas" element={<Navigate to="/dashboard" replace />} />
          <Route path="/assinaturas" element={<Navigate to="/dashboard" replace />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
          <Route path="/permissoes" element={<Navigate to="/usuarios" replace />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
)

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </ErrorBoundary>
)

export default App
