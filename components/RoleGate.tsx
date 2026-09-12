"use client";

import React, { useState, useEffect } from "react";
import { UserRole, ROLES, getClientRole, setClientRole, validateRolePermission } from "@/app/lib/rbac";

interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  title?: string;
  description?: string;
}

export default function RoleGate({
  allowedRoles,
  children,
  fallback,
  title,
  description,
}: RoleGateProps) {
  const [currentRole, setCurrentRole] = useState<UserRole>("DISPATCHER");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentRole(getClientRole());

    const handleRoleChange = () => {
      setCurrentRole(getClientRole());
    };

    window.addEventListener("bite2care_role_changed", handleRoleChange);
    return () => {
      window.removeEventListener("bite2care_role_changed", handleRoleChange);
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const auth = validateRolePermission(currentRole, allowedRoles);

  if (auth.authorized) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const roleDetails = ROLES[currentRole] || ROLES.DISPATCHER;
  const primaryAllowedRole = allowedRoles[0] || "DISPATCHER";
  const primaryAllowedRoleInfo = ROLES[primaryAllowedRole] || ROLES.DISPATCHER;

  const defaultTitle = allowedRoles.includes("PHYSICIAN")
    ? "Clinical Authorization Barrier: Physician Access Required"
    : "Dispatch Operation Barrier: Dispatcher / Admin Access Required";

  const defaultDescription = allowedRoles.includes("PHYSICIAN")
    ? "Non-clinical emergency dispatchers are restricted from authorizing antivenom dosage and finalizing clinical inpatient dispositions. This boundary guarantees clinical autonomy and legal medical governance."
    : "Attending clinicians and unassigned roles are protected from direct intake dispatch operations. Emergency case intake is restricted to Central Dispatchers and System Administrators.";

  return (
    <div className="p-6 sm:p-8 bg-slate-900 text-white rounded-2xl border-2 border-red-500/80 shadow-2xl space-y-5 animate-fadeIn my-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500 flex items-center justify-center text-2xl flex-shrink-0">
          🛡️
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white">
              Role-Based Access Control (RBAC) Gated
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Active Role: <strong className="text-white">{roleDetails.title}</strong>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            {title || defaultTitle}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            {description || defaultDescription}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-2">
        <div className="font-bold text-brand-gold-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚖️</span>
          <span>Permitted Roles for this Module:</span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {allowedRoles.map((role) => (
            <span
              key={role}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1"
            >
              <span>✓</span>
              <span>{ROLES[role]?.title || role}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Showcase Interactive Role Escalation Helper */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-400">
          Testing or Evaluating? Switch your simulated session role:
        </span>
        <button
          type="button"
          onClick={() => setClientRole(primaryAllowedRole)}
          className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{primaryAllowedRole === "PHYSICIAN" ? "👨‍⚕️" : "📡"} Switch to {primaryAllowedRoleInfo.title}</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  );
}
