import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/** Authentication-only gate. Role enforcement is handled by <RoleRoute>. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation()

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
