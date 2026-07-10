import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
  {
    path: '/login',
    lazy: () => import('@/pages/Login').then((m) => ({ Component: m.default })),
  },
  {
    path: '/register',
    lazy: () => import('@/pages/Register').then((m) => ({ Component: m.default })),
  },
  {
    path: '/auth/callback',
    lazy: () => import('@/pages/OAuthCallback').then((m) => ({ Component: m.default })),
  },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/Home').then((m) => ({ Component: m.default })),
      },
      {
        path: 'groups',
        lazy: () => import('@/pages/Groups').then((m) => ({ Component: m.default })),
      },
      {
        path: 'chat/:groupId',
        lazy: () => import('@/pages/ChatRoom').then((m) => ({ Component: m.default })),
      },
      {
        path: 'profile',
        lazy: () => import('@/pages/Profile').then((m) => ({ Component: m.default })),
      },
      {
        path: 'settings',
        lazy: () => import('@/pages/Settings').then((m) => ({ Component: m.default })),
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/pages/NotFound').then((m) => ({ Component: m.default })),
  },
]);
