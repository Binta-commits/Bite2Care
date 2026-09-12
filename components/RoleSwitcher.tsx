"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UserRole, ROLES, getClientRole, setClientRole } from "@/app/lib/rbac";

export default function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<UserRole>("DISPATCHER");
  const [isOpen, setIsOpen] = useState(false);
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

  if (!mounted) return null;

  const currentRoleInfo = ROLES[currentRole] || ROLES.DISPATCHER;

  const handleSelectRole = (role: UserRole) => {
    setClientRole(role);
    setIsOpen(false);

    if (role === "PHYSICIAN" && pathname === "/activate") {
      router.push("/cases?tab=inpatient");
    } else if (role === "DISPATCHER" && pathname.startsWith("/triage/")) {
      router.push("/cases");
    }
  };

  const roleIcons: Record<UserRole, string> = {
    DISPATCHER: "📡",
    PHYSICIAN: "👨‍⚕️",
    ADMIN: "⚙️",
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-teal-800 hover:bg-brand-teal-700 border border-brand-gold-500/50 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
        title="Switch simulated user role for showcase evaluation"
      >
        <span>{roleIcons[currentRole]}</span>
        <span className="hidden md:inline text-brand-gold-400 font-semibold">Role:</span>
        <span className="font-extrabold text-white">{currentRoleInfo.title.split(" ")[0]}</span>
        <span className="text-[10px] text-brand-gold-400">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-slate-900 border border-slate-700 p-2 shadow-2xl z-50 animate-fadeIn text-xs text-white">
            <div className="px-3 py-2 border-b border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-gold-400 block">
                Showcase Role-Based Access Control
              </span>
              <span className="text-slate-400 text-[11px] block mt-0.5">
                Toggle simulated session identity to test RBAC boundaries:
              </span>
            </div>

            <div className="space-y-1 py-1">
              {(Object.keys(ROLES) as UserRole[]).map((roleKey) => {
                const info = ROLES[roleKey];
                const isSelected = currentRole === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleSelectRole(roleKey)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand-teal-800 text-white font-bold ring-1 ring-brand-gold-500"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <span className="text-base mt-0.5">{roleIcons[roleKey]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{info.title}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-brand-gold-500 text-slate-900 px-1.5 py-0.2 rounded font-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {info.description.split(":")[0]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
