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
          <Toaster
            position="top-right"
            theme="dark"
            closeButton
            duration={3000}
            gap={8}
            offset={16}
            toastOptions={{
              unstyled: true,
              classNames: {
                toast:
                  'bg-card/80 backdrop-blur-xl border border-border/50 shadow-lg rounded-xl px-4 py-3 flex items-start gap-3 min-w-[280px] max-w-[380px]',
                title: 'text-sm font-medium text-foreground',
                description: 'text-xs text-muted-foreground mt-0.5',
                actionButton:
                  'bg-primary text-primary-foreground text-xs px-2.5 py-1 rounded-lg ml-auto',
                cancelButton:
                  'bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-lg ml-auto',
                closeButton:
                  'text-muted-foreground hover:text-foreground absolute top-2 right-2',
                success: 'text-primary',
                error: 'text-destructive',
                warning: 'text-yellow-500',
                info: 'text-accent',
              },
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
