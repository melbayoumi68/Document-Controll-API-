import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Roles, RoleType } from '@/types'

interface RoleRouteProps {
  roles: RoleType[]
  children: React.ReactNode
}

/**
 * Enforces that the authenticated user's role is in the allowed list.
 * The backend remains the final authority — this is UI-level prevention only.
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ roles, children }) => {
  const location = useLocation()

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const user = authService.getCurrentUser()
  const role = user?.role as RoleType | undefined
  if (!role || !roles.includes(role)) {
    return <Navigate to="/access-denied" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default RoleRoute

export const SUPER_ADMIN_ONLY: RoleType[] = [Roles.SuperAdmin]
export const ENGINEER_ONLY: RoleType[] = [Roles.ToEngineer, Roles.SuperAdmin]
export const CONSULTANT_ONLY: RoleType[] = [Roles.Consultant, Roles.SuperAdmin]
/** Who can open Pending Reviews page / submit reviews UI */
export const REVIEWER_ROLES: RoleType[] = [
  Roles.Consultant,
  Roles.ToEngineer,
  Roles.SuperAdmin,
]
