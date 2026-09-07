import { Navigate, Route, Routes } from 'react-router-dom'
import { HomeRoute } from './components/common/HomeRoute'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { AddField } from './pages/farmer/AddField'
import { FieldDetail } from './pages/farmer/FieldDetail'
import { ActivityLogs } from './pages/lgu/ActivityLogs'
import { AdminUsers } from './pages/lgu/AdminUsers'
import { LGUFieldView } from './pages/lgu/LGUFieldView'
import { SystemSettings } from './pages/lgu/SystemSettings'
import { PublicMap } from './pages/public/PublicMap'

function App() {
  return (
    <Routes>
      <Route path="/public" element={<PublicMap />} />

      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fields/new"
          element={
            <ProtectedRoute>
              <AddField />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fields/:fieldId"
          element={
            <ProtectedRoute>
              <FieldDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/fields/:fieldId"
          element={
            <ProtectedRoute>
              <LGUFieldView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/activity"
          element={
            <ProtectedRoute>
              <ActivityLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/settings"
          element={
            <ProtectedRoute>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
