import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './routes/index.tsx';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <AppRouter />
    <Toaster
      richColors
      position="top-right"
      theme="dark"
      toastOptions={{
        style: {
          background: '#1D1E25',
          border: '1px solid #2A2B35',
          color: '#F3F4F6',
        }
      }}
    />
  </QueryClientProvider>
);
