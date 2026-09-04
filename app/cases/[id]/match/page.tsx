"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export interface MatchFacilityOption {
  type: string;
  mode: string;
  facilityId?: string;
  facilityName?: string;
  destinationFacilityId?: string;
  destinationFacilityName?: string;
  capabilityLevel: number;
  hasIcuHdu: boolean;
  antivenomStatus: string;
  quantity: number;
  distanceKm: number;
  patientEtaMinutes?: number;
  rendezvousEtaMinutes?: number;
  donorFacilityId?: string;
  donorFacilityName?: string;
  donorQuantity?: number;
  donorEtaMinutes?: number;
  courierStatus?: string;
  etaMinutes?: number;
  staleness?: { isStale: boolean };
}

export interface RankedMatchItem {
  score: number;
  isPediatricRecommended?: boolean;
  option: MatchFacilityOption;
}

// Helper function to evaluate the 16-Year Pediatric Clinical Safety Threshold
function isPediatricAge(ageStr?: string | number, ageUnit?: string): boolean {
  if (typeof ageStr === "number") {
    return ageUnit?.toLowerCase() === "months" ? ageStr / 12 <= 16 : ageStr <= 16;
  }
  if (!ageStr) return false;
  const s = String(ageStr).toLowerCase().trim();
  if (s.includes("month") || s.includes("mo") || ageUnit?.toLowerCase() === "months") {
    const m = s.match(/(\d+(\.\d+)?)/);
    const months = m ? parseFloat(m[1]) : 1;
    return months / 12 <= 16;
  }
  const m = s.match(/(\d+(\.\d+)?)/);
  if (m) {
    const num = parseFloat(m[1]);
    return num <= 16;
  }
  return false;
}

const ADULT_RANKED_OPTIONS: RankedMatchItem[] = [
  {
    score: 95,
    option: {
      type: "Option B",
      mode: "Dynamic Treatment Rendezvous (Recommended)",
      destinationFacilityId: "fac-b",
      destinationFacilityName: "Facility B (Primary Healthcare Centre)",
      capabilityLevel: 1,
      hasIcuHdu: false,
      antivenomStatus: "IN_TRANSIT (6 Vials arriving in 38m)",
      quantity: 6,
      distanceKm: 19,
      patientEtaMinutes: 35,
      rendezvousEtaMinutes: 41,
      donorFacilityId: "fac-c",
      donorFacilityName: "Regional Antivenom Depository (Hub C)",
      donorQuantity: 6,
      donorEtaMinutes: 38,
      courierStatus: "Courier Dispatched - ETA to Facility B: 38m",
      staleness: { isStale: false },
    },
  },
  {
    score: 72,
    option: {
      type: "Option A",
      mode: "Direct Transit to Stocked Hospital",
      facilityId: "fac-a",
      facilityName: "Federal Medical Centre (Central Specialist Hospital)",
      capabilityLevel: 3,
      hasIcuHdu: true,
      antivenomStatus: "IN_STOCK",
      quantity: 14,
      distanceKm: 68,
      etaMinutes: 78,
      staleness: { isStale: false },
    },
  },
];

const PEDIATRIC_RANKED_OPTIONS: RankedMatchItem[] = [
  {
    score: 98,
    isPediatricRecommended: true,
    option: {
      type: "Option A",
      mode: "Direct Referral to Level 3 Specialist Centre (Pediatric Protocol)",
      facilityId: "fac-a",
      facilityName: "Federal Medical Centre (Central Specialist Hospital)",
      capabilityLevel: 3,
      hasIcuHdu: true,
      antivenomStatus: "IN_STOCK",
      quantity: 14,
      distanceKm: 68,
      etaMinutes: 78,
      staleness: { isStale: false },
    },
  },
  {
    score: 82,
    isPediatricRecommended: false,
    option: {
      type: "Option B",
      mode: "Secondary Referral to Level 2 Regional Hospital",
      facilityId: "fac-d",
      facilityName: "State General Hospital & Emergency Centre",
      capabilityLevel: 2,
      hasIcuHdu: true,
      antivenomStatus: "IN_STOCK",
      quantity: 8,
      distanceKm: 42,
      etaMinutes: 49,
      staleness: { isStale: false },
    },
  },
];

export default function MatchPage({ params }: MatchPageProps) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  const [demoData, setDemoData] = useState<{
    location: string;
    country: string;
    age: string;
    ageUnit?: string;
    sex: string;
    snake: string;
    pregnancy?: string;
  }>({
    location: "Yam farm 2km north of Keffi market",
    country: "Nigeria",
    age: "28",
    ageUnit: "Years",
    sex: "male",
    snake: "West African Carpet Viper (Echis ocellatus)",
    pregnancy: "N/A (Male)",
  });

  const [loading, setLoading] = useState(false);
  const [alertingId, setAlertingId] = useState<string | null>(null);
  const [awaitingOption, setAwaitingOption] = useState<any | null>(null);
  const [acceptedFacility, setAcceptedFacility] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

  // Load persisted demo data from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bite2care_demo_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDemoData(parsed);
      }
    } catch (e) {}
  }, []);

  // Strict 16-Year Pediatric Clinical Safety Gate Evaluation
  const isPediatric = isPediatricAge(demoData?.age, demoData?.ageUnit);

  // Matching algorithm strictly filters Level 1 facilities if isPediatric is true
  const ranked = isPediatric ? PEDIATRIC_RANKED_OPTIONS : ADULT_RANKED_OPTIONS;

  // Step 1: Send Pre-Arrival Alert & Request Acceptance (Pure Simulation)
  const requestAcceptance = (optionItem: any) => {
    const facilityId =
      optionItem.option.facilityId || optionItem.option.destinationFacilityId;
    setAlertingId(facilityId);
    setError(null);

    // 600ms simulated telco broadcast
    setTimeout(() => {
      setAwaitingOption(optionItem);
      setAlertingId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 600);
  };

  // Step 2: Receiving Facility Confirms Acceptance (Zero Prisma DB locks)
  const confirmAcceptance = () => {
    if (!awaitingOption) return;
    const facilityId =
      awaitingOption.option.facilityId || awaitingOption.option.destinationFacilityId;
    const facilityName =
      awaitingOption.option.facilityName ||
      awaitingOption.option.destinationFacilityName ||
      "Federal Medical Centre (Central Specialist Hospital)";

    setAlertingId(facilityId);

    // 1000ms simulated confirmation timeout
    setTimeout(() => {
      setAlertingId(null);
      setAcceptedFacility(facilityName);

      // Seamlessly redirect to Case Management & Transport Dashboard
      setTimeout(() => {
        router.push(`/cases/${caseId}/manage`);
      }, 1000);
    }, 1000);
  };

  // Emergency Escalation Handler
  const triggerEscalation = () => {
    setEscalating(true);
    setTimeout(() => {
      setEscalating(false);
      router.push(`/cases/${caseId}/manage`);
    }, 800);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 mt-4">
        {/* Header */}
        <div className="mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                Emergency Step 2
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Case ID: <span className="font-mono font-bold text-slate-800">{caseId}</span>
              </span>
            </div>
            <Link
              href="/activate"
              className="text-xs text-brand-teal-800 hover:text-brand-teal-700 font-semibold"
            >
              &larr; Back to Activation
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dynamic Treatment Rendezvous &amp; Facility Matching
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluating verified capability level, real-time antivenom stock, travel safety, and dynamic stock convergence.
          </p>
        </div>

        {/* Patient Incident Context Bar */}
        <div className="mb-5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-700 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900">📍 Incident Site:</span>
            <span className="font-medium text-slate-800">{demoData.location}, {demoData.country}</span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 flex-wrap">
            <span><strong>Victim:</strong> {demoData?.age || 'Unknown'} / {demoData?.sex || 'Unknown'}</span>
            <span><strong>Pregnancy:</strong> {demoData?.pregnancy || 'Unknown'}</span>
            <span><strong>Snake:</strong> {demoData.snake}</span>
          </div>
        </div>

        {/* Success / Accepted Banner */}
        {acceptedFacility && (
          <div className="mb-6 p-5 bg-brand-teal-900 text-white border border-brand-teal-800 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-brand-gold-500 text-slate-900 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                ✓
              </div>
              <div>
                <div className="text-xs font-bold text-brand-gold-500 uppercase tracking-wider">
                  Readiness Confirmed &bull; Resources Mobilized
                </div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Destination Confirmed: <span className="text-brand-gold-500">{acceptedFacility}</span>. Redirecting to Transport Coordination...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal / Banner: Awaiting Facility Acceptance (Gold Emergency Alert) */}
        {awaitingOption && !acceptedFacility && (
          <div className="mb-6 p-5 bg-brand-gold-500 text-slate-900 border-2 border-brand-gold-600 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-brand-gold-500 flex items-center justify-center font-bold text-base mr-3.5 flex-shrink-0">
                🔔
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Pre-Arrival Alert Broadcasted
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">
                    AWAITING_ACCEPTANCE
                  </span>
                </div>
                <p className="text-xs text-slate-900 font-medium mt-1 leading-relaxed">
                  Priority alert ping transmitted to the clinical focal point at{" "}
                  <strong className="underline">
                    {awaitingOption.option.facilityName ||
                      awaitingOption.option.destinationFacilityName}
                  </strong>
                  {isPediatric
                    ? ". Pediatric ICU & antivenom emergency resuscitation team notified."
                    : ". Stock transfer from Hub C synchronized."}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={confirmAcceptance}
                    disabled={!!alertingId}
                    className="px-5 py-2.5 bg-brand-teal-900 hover:bg-brand-teal-800 disabled:bg-brand-teal-900/70 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {alertingId ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirming Clinical Readiness...</span>
                      </>
                    ) : (
                      <span>✓ Facility Confirms Readiness (Accept)</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwaitingOption(null)}
                    disabled={!!alertingId}
                    className="px-3.5 py-2.5 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel / Choose Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-4 border-brand-teal-800 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium">Computing optimal facility matches and reverse logistics...</p>
          </div>
        )}

        {/* Ranked Options List */}
        {!loading && ranked.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-medium">Stratified by Clinical Capability, Stock &amp; Travel Feasibility</span>
              <button
                type="button"
                onClick={triggerEscalation}
                disabled={escalating}
                className="px-3 py-1 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded-md text-xs transition-colors shadow-sm cursor-pointer"
              >
                {escalating ? "Escalating..." : "⚠️ Escalate Case"}
              </button>
            </div>

            {/* Pediatric Safety Override Alert Banner */}
            {isPediatric && (
              <div className="p-4 bg-amber-500/15 border-2 border-amber-500 rounded-xl flex items-center justify-between gap-3 text-amber-950 shadow-md animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">⚠️</span>
                  <div>
                    <div className="text-sm font-extrabold tracking-wide uppercase text-amber-950">
                      ⚠️ PEDIATRIC OVERRIDE (≤16): Immediate high-level care required.
                    </div>
                    <p className="text-xs text-amber-900 font-medium mt-0.5">
                      Patient age (<strong className="font-bold">{demoData?.age || 'Pediatric'}</strong>) is within the high-risk pediatric cohort (&le; 16 years). Level 1 Primary Healthcare Centres are strictly bypassed. Destination forced to a Level 3 Specialist Centre with verified ICU capability and on-site antivenom.
                    </p>
                  </div>
                </div>
                <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-600 text-white uppercase tracking-wider whitespace-nowrap shadow-sm">
                  Level 1 PHC Bypassed
                </span>
              </div>
            )}

            {ranked.map((r, idx) => {
              const opt = r.option;
              const isTop = idx === 0;
              const isOptionA = opt.type === "Option A";
              const isOptionB = opt.type === "Option B";

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-2xl border transition-all ${
                    isTop
                      ? "bg-brand-teal-50/50 border-2 border-brand-teal-800 ring-2 ring-brand-teal-700/20 shadow-md"
                      : "bg-white border-slate-300 shadow-sm hover:border-slate-400"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Badge Ribbon */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                            isTop
                              ? "bg-brand-teal-900 text-brand-gold-500"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {opt.type}: {opt.mode}
                        </span>

                        {isTop && !isPediatric && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900 shadow-sm">
                            ⭐ Fastest Safe Pathway (-37 Mins Saved)
                          </span>
                        )}

                        {isTop && isPediatric && (
                          <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900 shadow-sm">
                            ⭐ Primary Recommended Pathway (ICU &amp; High-Level Care)
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-mono ml-auto sm:ml-0 font-bold">
                          Match Score: {r.score}
                        </span>
                      </div>

                      {/* Facility Title */}
                      <h3 className="text-xl font-bold text-slate-900">
                        {opt.facilityName || opt.destinationFacilityName}
                      </h3>

                      {/* DYNAMIC RENDEZVOUS DUAL CARD BREAKDOWN (Used when donorFacility is present) */}
                      {opt.destinationFacilityName && opt.donorFacilityName && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Primary Destination Sub-Card (Facility B) */}
                            <div className="p-4 bg-white rounded-xl border border-brand-teal-300 shadow-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-brand-teal-900 uppercase tracking-wide">
                                  🏥 Primary Destination
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-teal-100 text-brand-teal-900">
                                  Level 1 - Basic Ready (Stable Cases)
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {opt.destinationFacilityName}
                              </p>
                              <div className="text-xs text-slate-600 space-y-1">
                                <div>
                                  <span className="text-slate-500">Antivenom Stock: </span>
                                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    {opt.antivenomStatus}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Distance &amp; ETA: </span>
                                  <span className="font-semibold text-slate-800">
                                    {opt.distanceKm} km &bull; Patient ETA: {opt.patientEtaMinutes}m
                                  </span>
                                </div>
                                <div className="text-[11px] text-emerald-700 font-medium">
                                  ✓ Level 1 triage staff &bull; Capable of antivenom infusion
                                </div>
                              </div>
                            </div>

                            {/* Resource Hub Sub-Card (Hub C) */}
                            <div className="p-4 bg-white rounded-xl border border-brand-teal-300 shadow-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-brand-teal-900 uppercase tracking-wide">
                                  📦 Resource Hub Stock Reallocation
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Stocked (30 Vials)
                                </span>
                              </div>
                              <p className="text-sm font-bold text-slate-900">
                                {opt.donorFacilityName}
                              </p>
                              <div className="text-xs text-slate-600 space-y-1">
                                <div>
                                  <span className="text-slate-500">Action Status: </span>
                                  <span className="font-bold text-brand-teal-900 bg-brand-teal-50 px-1.5 py-0.5 rounded border border-brand-teal-200">
                                    {opt.courierStatus}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Logistics Courier: </span>
                                  <span className="font-semibold text-slate-800">
                                    Priority Motorcycle &bull; {opt.donorQuantity} Vials
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Convergence: Patient &amp; Courier meet at Clinic B in ~38m
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Highlight Ribbon */}
                          <div className="p-3 bg-brand-teal-900 text-white rounded-lg flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className="text-brand-gold-500 font-bold">⚡ Total Convergence Time:</span>
                              <span>41 Minutes to first vial</span>
                            </span>
                            <span className="text-brand-gold-500 font-bold">
                              47% Faster than Direct Route
                            </span>
                          </div>
                        </div>
                      )}

                      {/* DIRECT REFERRAL BREAKDOWN */}
                      {(!opt.destinationFacilityName || !opt.donorFacilityName) && (
                        <div className="space-y-3 pt-1">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-slate-500 block text-[11px]">Capability Tier</span>
                              <span className="font-bold text-slate-900">
                                {opt.capabilityLevel === 3
                                  ? "Level 3 - Fully Ready (ICU & 20WBCT)"
                                  : "Level 2 - Comprehensive Ready (ICU & Surgery)"}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Antivenom Stock</span>
                              <span className="font-bold text-emerald-700">
                                {opt.antivenomStatus} ({opt.quantity} Vials on-site)
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[11px]">Transit Distance &amp; ETA</span>
                              <span className="font-bold text-slate-900">
                                {opt.distanceKm} km &bull; {opt.etaMinutes} Minutes
                              </span>
                            </div>
                          </div>

                          {isPediatric && isTop && (
                            <div className="p-3 bg-brand-teal-900 text-white rounded-lg flex items-center justify-between text-xs font-medium">
                              <span className="flex items-center gap-1.5">
                                <span className="text-brand-gold-500 font-bold">🛡️ Clinical Protocol Override:</span>
                                <span>Pediatric patient routed directly to Level 3 ICU facility</span>
                              </span>
                              <span className="text-brand-gold-500 font-bold">
                                Verified Level 3 Ready
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => requestAcceptance(r)}
                        disabled={!!alertingId}
                        className={`w-full sm:w-auto font-bold py-3 px-6 rounded-lg transition-all shadow-md cursor-pointer text-xs flex items-center justify-center gap-2 ${
                          isTop
                            ? "bg-brand-teal-900 hover:bg-brand-teal-800 text-brand-gold-500 border border-brand-gold-500/50"
                            : "bg-slate-800 hover:bg-slate-700 text-white"
                        }`}
                      >
                        {alertingId === (opt.facilityId || opt.destinationFacilityId) ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-brand-gold-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Broadcasting Alert...</span>
                          </>
                        ) : (
                          <>
                            <span>🔔 Send Pre-Alert &amp; Select</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
