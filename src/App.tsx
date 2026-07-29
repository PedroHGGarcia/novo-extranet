import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Outlet,
  Navigate,
} from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PageLoading } from '@/components/PageLoading'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute, BiddingPermissionRoute } from '@/components/ProtectedRoute'
import { GlobalAutoFormatter } from '@/components/GlobalAutoFormatter'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/components/theme-provider'
import { RouteError } from '@/components/RouteError'
import './styles/editor.css'
import './styles/print.css'

const Layout = lazy(() => import('@/components/Layout').then((m) => ({ default: m.default })))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Cadastros = lazy(() => import('@/pages/Cadastros'))
const Regioes = lazy(() => import('@/pages/Regioes'))
const Gerentes = lazy(() => import('@/pages/Gerentes'))
const Clientes = lazy(() => import('@/pages/ClientesWrapper'))
const Eventos = lazy(() => import('@/pages/Eventos'))
const ControlePropostas = lazy(() => import('@/pages/controle-propostas/ControlePropostas'))
const PropostasCriadasPage = lazy(() => import('@/pages/controle-propostas/PropostasCriadasPage'))
const DashboardPropostas = lazy(() => import('@/pages/controle-propostas/DashboardPropostas'))
const EmitirPropostaPage = lazy(() => import('@/pages/controle-propostas/EmitirPropostaPage'))
const PropostasAvancadas = lazy(() => import('@/pages/controle-propostas/PropostasAvancadas'))
const TiposPropostas = lazy(() => import('@/pages/controle-propostas/TiposPropostas'))
const PropostaPDF = lazy(() => import('@/pages/controle-propostas/PropostaPDF'))
const PrintProposta = lazy(() => import('@/pages/PrintProposta'))
const ImprimirProposta = lazy(() => import('@/pages/ImprimirProposta'))

const Produtos = lazy(() => import('@/pages/Produtos'))
const Categorias = lazy(() => import('@/pages/produtos/Categorias'))
const Marcas = lazy(() => import('@/pages/produtos/Marcas'))
const Modelos = lazy(() => import('@/pages/produtos/Modelos'))
const Versoes = lazy(() => import('@/pages/produtos/Versoes'))
const DashboardProdutos = lazy(() => import('@/pages/produtos/Dashboard'))
const Acessorios = lazy(() => import('@/pages/produtos/Acessorios'))
const AlterarPrecos = lazy(() => import('@/pages/produtos/AlterarPrecos'))
const Perfil = lazy(() => import('@/pages/Perfil'))
const AreaAtuacao = lazy(() => import('@/pages/AreaAtuacao'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))
const AuditoriaPage = lazy(() => import('@/pages/Auditoria'))
const Configuracoes = lazy(() => import('@/pages/Configuracoes'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Representantes = lazy(() => import('@/pages/Representantes'))
const RepresentanteEdit = lazy(() => import('@/pages/RepresentanteEdit'))
const Projetos = lazy(() => import('@/pages/Projetos'))
const ProjetosForm = lazy(() => import('@/pages/ProjetosForm'))
const Login = lazy(() => import('@/pages/Login'))

const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ValidarProposta = lazy(() => import('@/pages/ValidarProposta'))
const Notificacoes = lazy(() => import('@/pages/Notificacoes'))
const HistoricoImportacoes = lazy(() => import('@/pages/HistoricoImportacoes'))

const RootLayout = () => (
  <TooltipProvider>
    <GlobalAutoFormatter />
    <Toaster />
    <Sonner />
    <Outlet />
  </TooltipProvider>
)

const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoading />}>{children}</Suspense>
)

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<RouteError />}>
      <Route
        path="/login"
        element={
          <LazyRoute>
            <Login />
          </LazyRoute>
        }
      />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route
        path="/forgot-password"
        element={
          <LazyRoute>
            <ForgotPassword />
          </LazyRoute>
        }
      />
      <Route
        path="/validar-proposta/:id"
        element={
          <LazyRoute>
            <ValidarProposta />
          </LazyRoute>
        }
      />
      <Route
        path="/proposta/:id/imprimir"
        element={
          <LazyRoute>
            <PrintProposta />
          </LazyRoute>
        }
      />
      <Route
        path="/propostas/:id/imprimir"
        element={
          <LazyRoute>
            <ImprimirProposta />
          </LazyRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <LazyRoute>
              <Layout />
            </LazyRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <LazyRoute>
                <Dashboard />
              </LazyRoute>
            }
          />
          <Route
            path="/area-atuacao"
            element={
              <LazyRoute>
                <AreaAtuacao />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros"
            element={
              <LazyRoute>
                <Cadastros />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros/regioes"
            element={
              <LazyRoute>
                <Regioes />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros/gerentes"
            element={
              <LazyRoute>
                <Gerentes />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros/clientes"
            element={
              <LazyRoute>
                <Clientes />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros/representantes"
            element={
              <LazyRoute>
                <Representantes />
              </LazyRoute>
            }
          />
          <Route
            path="/cadastros/representantes/editar/:id"
            element={
              <LazyRoute>
                <RepresentanteEdit />
              </LazyRoute>
            }
          />
          <Route
            path="/projetos"
            element={
              <LazyRoute>
                <Projetos />
              </LazyRoute>
            }
            errorElement={<RouteError />}
          />
          <Route
            path="/projetos/novo"
            element={
              <LazyRoute>
                <ProjetosForm />
              </LazyRoute>
            }
            errorElement={<RouteError />}
          />
          <Route
            path="/projetos/:id"
            element={
              <LazyRoute>
                <ProjetosForm />
              </LazyRoute>
            }
            errorElement={<RouteError />}
          />
          <Route path="/cadastros/prepostos" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/eventos"
            element={
              <LazyRoute>
                <Eventos />
              </LazyRoute>
            }
          />
          <Route
            path="/notificacoes"
            element={
              <LazyRoute>
                <Notificacoes />
              </LazyRoute>
            }
          />
          <Route
            path="/historico-importacoes"
            element={
              <LazyRoute>
                <HistoricoImportacoes />
              </LazyRoute>
            }
          />
          <Route
            path="/controle-propostas/emitir"
            element={<Navigate to="/controle-propostas/emitir-proposta" replace />}
          />
          <Route element={<BiddingPermissionRoute />}>
            <Route
              path="/controle-propostas"
              element={<Navigate to="/controle-propostas/propostas-criadas" replace />}
            />
            <Route
              path="/controle-propostas/propostas-criadas"
              element={
                <LazyRoute>
                  <PropostasCriadasPage />
                </LazyRoute>
              }
            />
            <Route
              path="/controle-propostas/emitir-proposta"
              element={
                <LazyRoute>
                  <EmitirPropostaPage />
                </LazyRoute>
              }
            />
            <Route
              path="/controle-propostas/dashboard"
              element={
                <LazyRoute>
                  <DashboardPropostas />
                </LazyRoute>
              }
            />
          </Route>
          <Route
            path="/controle-propostas/emitir-licitacao"
            element={<Navigate to="/controle-propostas/emitir-proposta" replace />}
          />
          <Route
            path="/controle-propostas/dashboard-licitacoes"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/propostas-avancadas"
            element={
              <LazyRoute>
                <PropostasAvancadas />
              </LazyRoute>
            }
          />
          <Route
            path="/controle-propostas/tipos-propostas"
            element={
              <LazyRoute>
                <TiposPropostas />
              </LazyRoute>
            }
          />
          <Route
            path="/controle-propostas/proposta-pdf/:id"
            element={
              <LazyRoute>
                <PropostaPDF />
              </LazyRoute>
            }
          />
          <Route
            path="/controle-propostas/propostas-excluidas"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/assinaturas"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/cotacoes"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/tipo-documentos"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/formas-pagamento"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/controle-propostas/dashboard-geral"
            element={<Navigate to="/controle-propostas/dashboard" replace />}
          />
          <Route
            path="/produtos"
            element={
              <LazyRoute>
                <Produtos />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/categorias"
            element={
              <LazyRoute>
                <Categorias />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/marcas"
            element={
              <LazyRoute>
                <Marcas />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/modelos"
            element={
              <LazyRoute>
                <Modelos />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/versoes"
            element={
              <LazyRoute>
                <Versoes />
              </LazyRoute>
            }
          />
          <Route path="/produtos/versao-imagens" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/produtos/acessorios"
            element={
              <LazyRoute>
                <Acessorios />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/alterar-precos"
            element={
              <LazyRoute>
                <AlterarPrecos />
              </LazyRoute>
            }
          />
          <Route
            path="/produtos/hierarquia-versoes"
            element={<Navigate to="/produtos" replace />}
          />
          <Route
            path="/produtos/dashboard"
            element={
              <LazyRoute>
                <DashboardProdutos />
              </LazyRoute>
            }
          />
          <Route path="/relatorios" element={<Navigate to="/dashboard" replace />} />
          <Route path="/vendas" element={<Navigate to="/dashboard" replace />} />
          <Route path="/assinaturas" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/perfil"
            element={
              <LazyRoute>
                <Perfil />
              </LazyRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <LazyRoute>
                <Usuarios />
              </LazyRoute>
            }
          />
          <Route
            path="/auditoria"
            element={
              <LazyRoute>
                <AuditoriaPage />
              </LazyRoute>
            }
          />
          <Route path="/permissoes" element={<Navigate to="/usuarios" replace />} />
          <Route
            path="/configuracoes"
            element={
              <LazyRoute>
                <Configuracoes />
              </LazyRoute>
            }
          />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <LazyRoute>
            <NotFound />
          </LazyRoute>
        }
      />
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
