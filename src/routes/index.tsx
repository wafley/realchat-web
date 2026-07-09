import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import ChatLayout from '@/layouts/ChatLayout';

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
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <ChatLayout />,
            children: [
              {
                index: true,
                lazy: () => import('@/pages/Home').then((m) => ({ Component: m.default })),
              },
              {
                path: 'chat/:groupId',
                lazy: () => import('@/pages/ChatRoom').then((m) => ({ Component: m.default })),
              },
              {
                path: 'dm/:userId',
                lazy: () => import('@/pages/ChatRoom').then((m) => ({ Component: m.default })),
              },
            ],
          },
          {
            path: 'groups',
            lazy: () => import('@/pages/Groups').then((m) => ({ Component: m.default })),
          },
          {
            path: 'friends',
            lazy: () => import('@/pages/Friends').then((m) => ({ Component: m.default })),
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
    ],
  },
  {
    path: '*',
    lazy: () => import('@/pages/NotFound').then((m) => ({ Component: m.default })),
  },
]);
