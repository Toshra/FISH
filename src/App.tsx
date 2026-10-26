import { Route, Routes } from 'react-router'
import { PublicLayout } from './components/PublicLayout'
import { AuthPage } from './pages/AuthPage'
import { DashboardPreview } from './pages/DashboardPreview'
import { LandingPage } from './pages/LandingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { TeacherLayout } from './components/TeacherLayout'
import { TeacherDashboard } from './pages/TeacherDashboard'
import { ClassWorkspace } from './pages/ClassWorkspace'
import { GroupActivitiesPage } from './pages/GroupActivitiesPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { ClassroomDisplay } from './pages/ClassroomDisplay'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="forgot-password" element={<AuthPage mode="recovery" />} />
      </Route>
      <Route path="preview" element={<DashboardPreview />} />
      <Route element={<ProtectedRoute />}>
        <Route path="app" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes/:classId" element={<ClassWorkspace />} />
          <Route path="classes/:classId/activities" element={<GroupActivitiesPage />} />
          <Route path="classes/:classId/challenges" element={<ChallengesPage />} />
          <Route path="classes/:classId/display/:mode" element={<ClassroomDisplay />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
