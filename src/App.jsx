import { Navigate, Route, Routes } from 'react-router-dom'
import { InstallPrompt } from './components/common/InstallPrompt'
import { RootRoute } from './components/common/RootRoute'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'
import { FarmerMap } from './pages/farmer/FarmerMap'
import { FarmerReports } from './pages/farmer/FarmerReports'
import { Monitoring } from './pages/farmer/Monitoring'
import { MyFields } from './pages/farmer/MyFields'
import { CropMonitoring } from './pages/lgu/CropMonitoring'
import { LGUMap } from './pages/lgu/LGUMap'
import { RiceFields } from './pages/lgu/RiceFields'
import { Profile } from './pages/Profile'
import { AddField } from './pages/farmer/AddField'
import { FieldDetail } from './pages/farmer/FieldDetail'
import { AgriculturalReports } from './pages/lgu/AgriculturalReports'
import { ActivityLogs } from './pages/lgu/ActivityLogs'
import { AdminUsers } from './pages/lgu/AdminUsers'
import { Announcements } from './pages/lgu/Announcements'
import { LGUFieldView } from './pages/lgu/LGUFieldView'
import { Reports } from './pages/lgu/Reports'
import { SystemSettings } from './pages/lgu/SystemSettings'
import { VerifyFields } from './pages/lgu/VerifyFields'
import { Notifications } from './pages/Notifications'
import { AboutPage } from './pages/public/AboutPage'
import { CropStatusPage } from './pages/public/CropStatusPage'
import { PublicMapPage } from './pages/public/PublicMapPage'
import { StatisticsPage } from './pages/public/StatisticsPage'

function App() {
  return (
    <>
      <InstallPrompt />
      <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<RootRoute />} />
        <Route path="/map" element={<PublicMapPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/crop-status" element={<CropStatusPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/public" element={<Navigate to="/statistics" replace />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
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
          path="/lgu/verify"
          element={
            <ProtectedRoute>
              <VerifyFields />
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
        <Route
          path="/lgu/agricultural-reports"
          element={
            <ProtectedRoute>
              <AgriculturalReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/announcements"
          element={
            <ProtectedRoute>
              <Announcements />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fields"
          element={
            <ProtectedRoute>
              <MyFields />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-map"
          element={
            <ProtectedRoute>
              <FarmerMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <FarmerReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/fields"
          element={
            <ProtectedRoute>
              <RiceFields />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/map"
          element={
            <ProtectedRoute>
              <LGUMap />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lgu/crop-monitoring"
          element={
            <ProtectedRoute>
              <CropMonitoring />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </>
  )
}

export default App
