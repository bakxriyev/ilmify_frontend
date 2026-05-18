// app/dashboard/page.tsx
import ProtectedRoute from '../../components/protectedRoute'
import DashboardContent from '../dashboard/dashboard/page'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}