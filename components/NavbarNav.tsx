"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole, getClientRole } from "@/app/lib/rbac";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function NavbarNav() {
  const pathname = usePathname();
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
    return (
      <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-medium text-slate-200">
        <Link href="/activate" className="hover:text-brand-gold-500 transition-colors">
          🚨 Activate Case
        </Link>
        <Link href="/cases" className="hover:text-brand-gold-500 transition-colors">
          📋 Case Archive
        </Link>
        <Link href="/facilities" className="hover:text-brand-gold-500 transition-colors">
          🏥 Facility Grid
        </Link>
        <div className="pl-1 border-l border-brand-teal-700">
          <RoleSwitcher />
        </div>
      </nav>
    );
  }

  const isPhysician = currentRole === "PHYSICIAN";
  const isAdmin = currentRole === "ADMIN";
  const isDispatcher = currentRole === "DISPATCHER";

  return (
    <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium text-slate-200">
      {/* 1. Pre-Hospital Emergency Dispatch Intake Link (Hidden for Attending Physician) */}
      {!isPhysician && (
        <Link
          href="/activate"
          className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
            pathname === "/activate"
              ? "bg-brand-teal-800 text-brand-gold-400 font-bold shadow-sm"
              : "hover:text-brand-gold-500 text-slate-200"
          }`}
        >
          <span>🚨</span>
          <span>Activate Case</span>
        </Link>
      )}

      {/* 2. Cases Registry & Coordination Link (Role-specific label) */}
      <Link
        href={isPhysician ? "/cases?tab=inpatient" : "/cases"}
        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
          pathname === "/cases" || pathname.startsWith("/cases/")
            ? "bg-brand-teal-800 text-brand-gold-400 font-bold shadow-sm"
            : "hover:text-brand-gold-500 text-slate-200"
        }`}
      >
        <span>{isPhysician ? "🏥" : "📋"}</span>
        <span>{isPhysician ? "Inpatient Ward & Cases" : "Case Coordination"}</span>
      </Link>

      {/* 3. Facility Network & Inventory Grid Link */}
      <Link
        href="/facilities"
        className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
          pathname === "/facilities" || pathname.startsWith("/facility/")
            ? "bg-brand-teal-800 text-brand-gold-400 font-bold shadow-sm"
            : "hover:text-brand-gold-500 text-slate-200"
        }`}
      >
        <span>🏥</span>
        <span>{isAdmin ? "Facility Inventory & Grid" : "Facility Grid"}</span>
      </Link>

      {/* 4. Active Role Switcher Control */}
      <div className="pl-1.5 border-l border-brand-teal-700">
        <RoleSwitcher />
      </div>
    </nav>
  );
}
