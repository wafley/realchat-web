import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/common/ThemeProvider';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
