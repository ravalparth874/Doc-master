/** Application shell: header, routed page, footer. */

import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { Layout, PageSpinner } from './components/Layout'
import type { AppRoute } from './router/clientRoutes'

interface AppProps {
  routes: AppRoute[]
  fallbackRoute: AppRoute
}

export function App({ routes, fallbackRoute }: AppProps) {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<PageSpinner />}>
                <Component />
              </Suspense>
            }
          />
        ))}
        <Route path={fallbackRoute.path} element={<fallbackRoute.Component />} />
      </Route>
    </Routes>
  )
}

export default App
