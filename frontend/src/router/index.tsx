import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { ComingSoonGuard } from '@/router/ComingSoonGuard'
import { ProtectedRoute } from '@/router/ProtectedRoute'
import { Cabinet } from '@/pages/Cabinet'
import { Home } from '@/pages/Home'
import { MyRecipes } from '@/pages/MyRecipes'
import { CreateRecipe } from '@/pages/MyRecipes/CreateRecipe'
import { Favorites } from '@/pages/Favorites'
import { Wishlist } from '@/pages/Wishlist'
import { OriginStories } from '@/pages/OriginStories'
import { Recipes } from '@/pages/Recipes'
import { RecipeDetail } from '@/pages/RecipeDetail'
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
          { path: 'recipes', element: <Recipes /> },
          { path: 'recipes/:slug', element: <RecipeDetail /> },
          { path: 'cocktails', element: <Navigate to="/recipes" replace /> },
          { path: 'origin-stories', element: <OriginStories /> },
          {
            path: 'favorites',
            element: (
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            ),
          },
          {
            path: 'wishlist',
            element: (
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            ),
          },
          {
            path: 'my-recipes',
            element: (
              <ProtectedRoute>
                <MyRecipes />
              </ProtectedRoute>
            ),
          },
          {
            path: 'my-recipes/new',
            element: (
              <ProtectedRoute>
                <CreateRecipe />
              </ProtectedRoute>
            ),
          },
          {
            path: 'cabinet',
            element: (
              <ProtectedRoute>
                <Cabinet />
              </ProtectedRoute>
            ),
          },
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
