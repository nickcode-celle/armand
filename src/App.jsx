import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import ScrollToTop from './components/ScrollToTop';
import Entity from './pages/Entity';
import EmaeaGraphicTest from './pages/EmaeaGraphicTest';

function AppRoutes(){
  return <Routes>
    <Route path="/" element={<Entity />} />
    <Route path="/entity" element={<Entity />} />
    <Route path="/entity-graphics-test" element={<EmaeaGraphicTest />} />
    <Route path="/conversation" element={<Navigate to="/" replace />} />
    <Route path="*" element={<PageNotFound />} />
  </Routes>;
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <ScrollToTop />
        <AppRoutes />
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App
