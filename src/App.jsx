import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { InstallPrompt } from './components/common/InstallPrompt'
import { RootRoute } from './components/common/RootRoute'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Layout } from './components/layout/Layout'

const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })))
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })))
const FarmerMap = lazy(() => import('./pages/farmer/FarmerMap').then((m) => ({ default: m.FarmerMap })))
const Monitoring = lazy(() => import('./pages/farmer/Monitoring').then((m) => ({ default: m.Monitoring })))
const MyFields = lazy(() => import('./pages/farmer/MyFields').then((m) => ({ default: m.MyFields })))
const CropMonitoring = lazy(() => import('./pages/lgu/CropMonitoring').then((m) => ({ default: m.CropMonitoring })))
const LGUMap = lazy(() => import('./pages/lgu/LGUMap').then((m) => ({ default: m.LGUMap })))
const RiceFields = lazy(() => import('./pages/lgu/RiceFields').then((m) => ({ default: m.RiceFields })))
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })))
const FieldDetail = lazy(() => import('./pages/farmer/FieldDetail').then((m) => ({ default: m.FieldDetail })))
const AgriculturalReports = lazy(() => import('./pages/lgu/AgriculturalReports').then((m) => ({ default: m.AgriculturalReports })))
const ActivityLogs = lazy(() => import('./pages/lgu/ActivityLogs').then((m) => ({ default: m.ActivityLogs })))
const AdminUsers = lazy(() => import('./pages/lgu/AdminUsers').then((m) => ({ default: m.AdminUsers })))
const Announcements = lazy(() => import('./pages/lgu/Announcements').then((m) => ({ default: m.Announcements })))
const LGUFieldView = lazy(() => import('./pages/lgu/LGUFieldView').then((m) => ({ default: m.LGUFieldView })))
const Reports = lazy(() => import('./pages/lgu/Reports').then((m) => ({ default: m.Reports })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const VerifyFields = lazy(() => import('./pages/lgu/VerifyFields').then((m) => ({ default: m.VerifyFields })))
const Notifications = lazy(() => import('./pages/Notifications').then((m) => ({ default: m.Notifications })))
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers').then((m) => ({ default: m.ManageUsers })))
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })))
const CropStatusPage = lazy(() => import('./pages/public/CropStatusPage').then((m) => ({ default: m.CropStatusPage })))
const PublicMapPage = lazy(() => import('./pages/public/PublicMapPage').then((m) => ({ default: m.PublicMapPage })))
const StatisticsPage = lazy(() => import('./pages/public/StatisticsPage').then((m) => ({ default: m.StatisticsPage })))

function App() {
  return (
    <>
      <InstallPrompt />
      <Suspense fallback={null}>
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
              <MyFields />
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
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/lgu/settings" element={<Navigate to="/settings" replace />} />
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
        <Route path="/reports" element={<Navigate to="/monitoring" replace />} />
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
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
      </Suspense>
    </>
  )
}

export default App
