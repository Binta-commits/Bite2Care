"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { cleanupExpiredCasesAction } from "@/app/actions/cases";
import { getClientRole } from "@/app/lib/rbac";
import PhysicianFacilityDashboard from "@/components/PhysicianFacilityDashboard";

interface CaseRecord {
  id: string;
  location?: string;
  biteTime?: string;
  suspectedSnake?: string;
  patientAge?: number | string;
  patientSex?: string;
  pregnancyStatus?: string;
  facilityId?: string;
  facilityName?: string;
  state?: string;
  channel?: string;
  vialsAdministered?: number | null;
  clinicalOutcome?: string | null;
  outcomeNotes?: string | null;
  initiatorRole?: string;
  healerName?: string | null;
  healerVoucherPaid?: boolean;
  hasRedFlags?: boolean;
  createdAt?: string;
  clinicalAssessments?: any[];
}

export default function CaseRegistryPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cleanupRunning, setCleanupRunning] = useState(false);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("DISPATCHER");

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cases");
      const json = await res.json();
      if (json.success && json.cases) {
        setCases(json.cases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCleanup = async () => {
    setCleanupRunning(true);
    setCleanupMessage(null);
    try {
      const role = getClientRole();
      const res = await cleanupExpiredCasesAction(role);
      if (res.success) {
        setCleanupMessage(
          `✓ Cleaned up ${res.deletedCount} expired showcase records (>24h old).`
        );
        await fetchCases();
      } else {
        setCleanupMessage(`Cleanup notice: ${res.error}`);
      }
    } catch (err: any) {
      setCleanupMessage("Failed to execute cleanup query.");
    } finally {
      setCleanupRunning(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const activeRole = getClientRole();
    setCurrentRole(activeRole);

    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search.includes("tab=inpatient") || search.includes("role=physician") || activeRole === "PHYSICIAN") {
        setStatusFilter("INPATIENT");
      }
    }

    const handleRoleChange = () => {
      const updatedRole = getClientRole();
      setCurrentRole(updatedRole);
      if (updatedRole === "PHYSICIAN") {
        setStatusFilter("INPATIENT");
      }
    };

    window.addEventListener("bite2care_role_changed", handleRoleChange);
    return () => {
      window.removeEventListener("bite2care_role_changed", handleRoleChange);
    };
  }, []);

  const filteredCases = cases.filter((c) => {
    const currentState = (c.state || "ACTIVATED").toUpperCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && (currentState === "ACTIVATED" || currentState === "MATCHED" || currentState === "IN_TRANSIT" || currentState === "ACCEPTED")) ||
      (statusFilter === "INPATIENT" && currentState === "ADMITTED_INPATIENT") ||
      (statusFilter === "CLOSED" && currentState === "CLOSED") ||
      (statusFilter === "ESCALATED" && currentState === "ESCALATED");

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (c.id || "").toLowerCase().includes(query) ||
      (c.location || "").toLowerCase().includes(query) ||
      (c.suspectedSnake || "").toLowerCase().includes(query) ||
      (c.healerName || "").toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalActivations = cases.length;
  const activeCases = cases.filter(
    (c) => (c.state || "ACTIVATED") !== "CLOSED" && (c.state || "ACTIVATED") !== "ESCALATED"
  ).length;
  const inpatientCount = cases.filter((c) => c.state === "ADMITTED_INPATIENT").length;
  const closedCount = cases.filter((c) => c.state === "CLOSED").length;
  const healerReferralsCount = cases.filter((c) => Boolean(c.healerName)).length;

  const isPhysician = currentRole === "PHYSICIAN";
  const isAdmin = currentRole === "ADMIN";

  // If role is Attending Physician, conditionally render the localized Facility Clinical Dashboard
  if (isPhysician) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PhysicianFacilityDashboard cases={cases} onRefresh={fetchCases} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                {isPhysician ? "Inpatient Clinical Portal" : "Central Registry"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {isPhysician ? "Ward Monitoring & Triage Review" : "Emergency Incident Audit & Clinical Archive"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isPhysician ? "Inpatient Ward & Clinical Registry" : "Case History & Dispatch Registry"}
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {isPhysician
                ? "Manage admitted snakebite inpatients, track serial 20WBCT clotting timelines, and evaluate in-hospital clinical progress."
                : "Longitudinal tracking of all snakebite emergency calls, clinical assessments, hospital admissions, and closed-loop community follow-up."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!isPhysician && (
              <Link
                href="/activate"
                className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>➕ Activate New Case</span>
              </Link>
            )}
            <Link
              href="/facilities"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>🏥 Facility Grid</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mt-6">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Total Incidents
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{totalActivations}</div>
            <span className="text-[10px] text-slate-500">All channels (Web/USSD)</span>
          </div>

          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
              Active En Route
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-900">{activeCases}</div>
            <span className="text-[10px] text-blue-700">In triage / transit</span>
          </div>

          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">
              Admitted Inpatient
            </span>
            <div className="text-xl sm:text-2xl font-black text-purple-900">{inpatientCount}</div>
            <span className="text-[10px] text-purple-700">Day 1-3 Ward care</span>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Closed &amp; Stable
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-900">{closedCount}</div>
            <span className="text-[10px] text-emerald-700">CSC loop completed</span>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
              Healer Referrals
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900">{healerReferralsCount}</div>
            <span className="text-[10px] text-amber-700">$10 vouchers paid</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Showcase Environment Archive Lifecycle Banner */}
      <div className="mb-6 p-4 bg-slate-900 text-white border-2 border-brand-teal-600/80 rounded-2xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 flex-shrink-0">⏱️</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-extrabold text-brand-gold-400 uppercase tracking-wider">
                24-Hour Showcase Environment &bull; Automated pg_cron / Vercel Cron Lifecycle
              </h3>
              <span className="px-2 py-0.5 bg-brand-teal-800 text-teal-200 rounded text-[10px] font-mono font-bold">
                DELETE FROM &quot;Case&quot; WHERE &quot;createdAt&quot; &lt; NOW() - INTERVAL &apos;1 day&apos;
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Active showcase emergency cases persist directly to the database for live demonstration and judging, then automatically clear after 24 hours to maintain a pristine test environment.
            </p>
            {cleanupMessage && (
              <p className="text-xs font-bold text-emerald-400 mt-1.5 animate-fadeIn">
                {cleanupMessage}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleManualCleanup}
          disabled={cleanupRunning}
          className="px-4 py-2.5 bg-brand-gold-500 hover:bg-brand-gold-600 disabled:opacity-50 text-slate-900 font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center cursor-pointer"
        >
          {cleanupRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              <span>Running Cleanup...</span>
            </>
          ) : (
            <>
              <span>🧹</span>
              <span>Run 24h Cleanup Now</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {[
            { id: "ALL", label: "All Cases" },
            { id: "ACTIVE", label: "Active Dispatch" },
            { id: "INPATIENT", label: "Inpatient Ward" },
            { id: "CLOSED", label: "Discharged / Closed" },
            { id: "ESCALATED", label: "Escalated" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-brand-teal-800 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div>
          <input
            type="text"
            placeholder="Search by Case ID, location, or snake..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
          />
        </div>
      </div>

      {/* Case List */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-brand-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading emergency registry archive...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">No emergency cases match your search or filter.</p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("ALL");
              setSearchQuery("");
            }}
            className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((c) => {
            const isPediatric = Number(c.patientAge) <= 16;
            const isPregnant = c.pregnancyStatus === "Pregnant";
            const isHighRisk = isPediatric || isPregnant || Boolean(c.hasRedFlags);
            const state = (c.state || "ACTIVATED").toUpperCase();
            const isClosed = state === "CLOSED";

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  {/* Top Line: ID, Date, Channel, State */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-brand-gold-500 px-2.5 py-0.5 rounded">
                      #{c.id}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        state === "CLOSED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : state === "ADMITTED_INPATIENT"
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : state === "ACCEPTED" || state === "IN_TRANSIT"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : state === "ESCALATED"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      ● {state.replace("_", " ")}
                    </span>

                    {isClosed && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <span>🔒</span>
                        <span>Locked Audit Record</span>
                      </span>
                    )}

                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Channel: {c.channel || "WEB"}
                    </span>

                    {isHighRisk && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-900">
                        ⚠️ High-Risk Protocol
                      </span>
                    )}

                    {c.healerName && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ $10 Healer Voucher
                      </span>
                    )}
                  </div>

                  {/* Incident Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      📍 {c.location || "Yam farm 2km north of Keffi market, Nasarawa"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      <span>
                        <strong>Patient:</strong> {c.patientAge || "28"} yrs / {c.patientSex || "male"}
                      </span>
                      <span>
                        <strong>Pregnancy:</strong>{" "}
                        <span className={isPregnant ? "font-bold text-red-600" : ""}>
                          {c.pregnancyStatus || "N/A (Male Patient)"}
                        </span>
                      </span>
                      <span>
                        <strong>Snake:</strong> {c.suspectedSnake || "West African Carpet Viper"}
                      </span>
                      {c.facilityName && (
                        <span>
                          <strong>Facility:</strong> {c.facilityName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clinical Outcome / Notes (if closed or inpatient) */}
                  {c.outcomeNotes && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 italic">
                      &quot;{c.outcomeNotes}&quot;
                    </div>
                  )}
                </div>

                {/* Quick Action Navigation Links */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <Link
                    href={`/cases/${c.id}/manage${isClosed ? "?closed=true" : ""}`}
                    className="px-3 py-2 bg-brand-teal-800 hover:bg-brand-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm text-center"
                  >
                    📊 Transport &amp; Flow
                  </Link>
                  <Link
                    href={`/triage/${c.id}${isClosed ? "?closed=true" : ""}`}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors text-center ${
                      isClosed
                        ? "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-600"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {isClosed ? "🔒 Audit Triage" : "🩺 Doctor Triage"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
