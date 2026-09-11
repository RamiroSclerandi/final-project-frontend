import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const queryClient = new QueryClient()

function ScaffoldPlaceholder() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <p className="text-lg">Telemetry dashboard scaffold is ready.</p>
    </main>
  )
}

/**
 * Composition root: wires the query client and router. Feature routes are
 * assembled here by later phases; this scaffold exposes a single placeholder
 * route so the app boots and renders end to end.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ScaffoldPlaceholder />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
