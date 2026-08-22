import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import Protectedroute from './Protectedroute';
import Loading from '@/components/Loading';
import AuthLayout from '@/layouts/AuthLayout';
import PublicLayout from '@/layouts/PublicLayout';

// Lazy loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyCode = lazy(() => import('@/pages/VerifyCode'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const League = lazy(() => import('@/pages/League'));
const AllLeagues = lazy(() => import('@/pages/AllLeagues'));
const MyTeam = lazy(() => import('@/pages/MyTeam'));
const LeaderBoardPage = lazy(() => import('@/pages/LeaderBoardPage'));
const SelectClub = lazy(() => import('@/pages/SelectClub'));
const ClubMembers = lazy(() => import('@/pages/ClubMembers'));
const ClubSettings = lazy(() => import('@/pages/ClubSettings'));

const router = createBrowserRouter([
  // Landing page
  {
    element: <PublicLayout />,
    children: [
      { path: "/", element: <LandingPage /> }
    ]
  },

  // Auth routes
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify", element: <VerifyCode /> }
    ]
  },

  // Protected Routes
  {
    element: <Protectedroute />,
    children: [
      // Club Selection Screen
      { path: "/select-club", element: <SelectClub /> },
      { path: "/clubs", element: <Navigate to="/select-club" replace /> },

      // Protected Dashboard workspace layout
      {
        element: <DashboardLayout />,
        children: [
          { path: "/Dashboard", element: <Dashboard /> },
          { path: "/Dashboard/AllLeagues", element: <AllLeagues /> },
          { path: "/Dashboard/League", element: <League /> },
          { path: "/Dashboard/League/:leagueId", element: <League /> },
          { path: "/Dashboard/MyTeam", element: <MyTeam /> },
          { path: "/Dashboard/LeaderBoard", element: <LeaderBoardPage /> },
          { path: "/Dashboard/Members", element: <ClubMembers /> },
          { path: "/Dashboard/Settings", element: <ClubSettings /> }
        ]
      }
    ]
  },

  { path: "*", element: <NotFound /> }
]);

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}