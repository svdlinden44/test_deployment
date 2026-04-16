import { createBrowserRouter, Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ComingSoonGuard } from '@/router/ComingSoonGuard'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { Home } from '@/pages/Home'
import { Cocktails } from '@/pages/Cocktails'
import { Bars } from '@/pages/Bars'
import { Profile } from '@/pages/Profile'
import { Login } from '@/pages/Login'
import { Signup } from '@/pages/Signup'
import { ComingSoon } from '@/pages/ComingSoon'

function RootLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export const router = createBrowserRouter([
  {
    element: <ComingSoonGuard />,
    children: [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'cocktails', element: <Cocktails /> },
          { path: 'bars', element: <Bars /> },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
        ],
      },
      { path: '/login', element: <Login /> },
      { path: '/signup', element: <Signup /> },
      { path: '/coming-soon', element: <ComingSoon /> },
    ],
  },
])
