import { createBrowserRouter } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import AppLayout from '@/layouts/AppLayout';
import ChatLayout from '@/layouts/ChatLayout';
import SettingsLayout from '@/layouts/SettingsLayout';
import ProfileLayout from '@/layouts/ProfileLayout';

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
            element: <ProfileLayout />,
            children: [
              {
                path: 'profile',
                lazy: () => import('@/pages/ProfileView').then((m) => ({ Component: m.default })),
              },
              {
                path: 'profile/edit',
                lazy: () => import('@/pages/profile/EditProfile').then((m) => ({ Component: m.default })),
              },
            ],
          },
          {
            element: <SettingsLayout />,
            children: [
              {
                path: 'settings',
                lazy: () => import('@/pages/settings/General').then((m) => ({ Component: m.default })),
              },
              {
                path: 'settings/notifications',
                lazy: () => import('@/pages/settings/Notifications').then((m) => ({ Component: m.default })),
              },
              {
                path: 'settings/privacy',
                lazy: () => import('@/pages/settings/Privacy').then((m) => ({ Component: m.default })),
              },
              {
                path: 'settings/appearance',
                lazy: () => import('@/pages/settings/Appearance').then((m) => ({ Component: m.default })),
              },
              {
                path: 'settings/account',
                lazy: () => import('@/pages/settings/Account').then((m) => ({ Component: m.default })),
              },
            ],
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
