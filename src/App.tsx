import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Layout from './components/Layout'
import Index from './pages/Index'
import Cadastros from './pages/Cadastros'
import Regioes from './pages/Regioes'
import Gerentes from './pages/Gerentes'
import Eventos from './pages/Eventos'
import Propostas from './pages/Propostas'
import Produtos from './pages/Produtos'
import Relatorios from './pages/Relatorios'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/cadastros" element={<Cadastros />} />
          <Route path="/cadastros/regioes" element={<Regioes />} />
          <Route path="/cadastros/gerentes" element={<Gerentes />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/propostas" element={<Propostas />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/perfil" element={<Perfil />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
