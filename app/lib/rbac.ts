export type UserRole = 'DISPATCHER' | 'PHYSICIAN' | 'ADMIN';

export interface RoleConfig {
  role: UserRole;
  title: string;
  badgeColor: string;
  description: string;
  allowedActions: string[];
}

export const ROLES: Record<UserRole, RoleConfig> = {
  DISPATCHER: {
    role: 'DISPATCHER',
    title: 'Emergency Dispatcher',
    badgeColor: 'bg-blue-600 text-white',
    description: 'Central Emergency Ops & Logistics Coordinator: Activates cases, dispatches transport, initiates facility matching.',
    allowedActions: ['ACTIVATE_CASE', 'DISPATCH_TRANSPORT', 'SELECT_FACILITY', 'VIEW_REGISTRY'],
  },
  PHYSICIAN: {
    role: 'PHYSICIAN',
    title: 'Attending Physician',
    badgeColor: 'bg-emerald-600 text-white',
    description: 'Receiving Medical Doctor / Clinician: Clinical triage, in-hospital deterioration assessment, NEWS2 scoring, WHO antivenom authorization, inpatient ward admission, and case discharge.',
    allowedActions: ['PERFORM_TRIAGE', 'AUTHORIZE_ANTIVENOM', 'ADMIT_INPATIENT', 'DISCHARGE_CASE', 'VIEW_REGISTRY'],
  },
  ADMIN: {
    role: 'ADMIN',
    title: 'System Administrator',
    badgeColor: 'bg-purple-600 text-white',
    description: 'Full Regional System Access: Facility onboarding, network inventory management, case audit locks, and 24-hour archive maintenance.',
    allowedActions: ['ALL_PERMISSIONS', 'MANAGE_FACILITIES', 'CLEANUP_CASES', 'OVERRIDE_LOCKS'],
  },
};

/**
 * Server-side & Client-side Role Permission Validator
 */
export function validateRolePermission(
  currentRole: string | undefined | null,
  allowedRoles: UserRole[]
): { authorized: boolean; reason?: string } {
  if (!currentRole) {
    return {
      authorized: false,
      reason: 'No authenticated user role detected in session.',
    };
  }

  const normalized = currentRole.toUpperCase().trim() as UserRole;
  if (normalized === 'ADMIN') {
    return { authorized: true };
  }

  if (allowedRoles.includes(normalized)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `Access restricted. Your active role (${normalized}) does not have permission for this clinical operation. Required: ${allowedRoles.join(', ')}`,
  };
}

/**
 * Client Storage Key for Active Showcase Role
 */
export const SHOWCASE_ROLE_KEY = 'bite2care_showcase_role';

export function getClientRole(): UserRole {
  if (typeof window === 'undefined') return 'DISPATCHER';
  try {
    const saved = localStorage.getItem(SHOWCASE_ROLE_KEY);
    if (saved && (saved === 'DISPATCHER' || saved === 'PHYSICIAN' || saved === 'ADMIN')) {
      return saved as UserRole;
    }
  } catch (e) {}
  return 'DISPATCHER';
}

export function setClientRole(role: UserRole): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHOWCASE_ROLE_KEY, role);
    document.cookie = `bite2care_role=${role}; path=/; max-age=86400`;
    window.dispatchEvent(new Event('bite2care_role_changed'));
  } catch (e) {}
}
