"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ManagePageProps {
  params: Promise<{ id: string }>;
}

export default function ManagePage({ params }: ManagePageProps) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  const [caseRec, setCaseRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Transport Dispatch Simulation State
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Outcome Form State (used when ARRIVED)
  const [vialsAdministered, setVialsAdministered] = useState<number>(2);
  const [clinicalOutcome, setClinicalOutcome] = useState<string>("DISCHARGED_STABLE");
  const [outcomeNotes, setOutcomeNotes] = useState<string>(
    "Patient received definitive care. 20WBCT normalized at 6h. Vitals stabilized."
  );

  const fetchCase = async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.success && json.case) {
        setCaseRec(json.case);
      } else {
        // Fallback presentation case record
        setCaseRec({
          id: caseId,
          location: "Yam farm 2km north of Keffi market, Nasarawa (GPS: 8.8471, 7.8932)",
          biteTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
          suspectedSnake: "West African Carpet Viper (Echis ocellatus)",
          patientAge: 28,
          patientSex: "male",
          pregnancyStatus: "N/A",
          facilityId: "fac-b",
          state: "ACCEPTED",
          channel: "WEB",
        });
      }
    } catch (err) {
      // Fallback presentation case record
      setCaseRec({
        id: caseId,
        location: "Yam farm 2km north of Keffi market, Nasarawa (GPS: 8.8471, 7.8932)",
        biteTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        suspectedSnake: "West African Carpet Viper (Echis ocellatus)",
        patientAge: 28,
        patientSex: "male",
        pregnancyStatus: "N/A",
        facilityId: "fac-b",
        state: "ACCEPTED",
        channel: "WEB",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  // Coordinate & Assign Mapped Transport Handler
  const handleAssignTransport = () => {
    setIsDispatching(true);
    setErrorMessage(null);

    // 1.5-second timeout to simulate network ping to local drivers
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchSuccess(true);

      // Update case record state locally to EN_ROUTE
      setCaseRec((prev: any) => ({
        ...prev,
        state: "EN_ROUTE",
        transportProviderId: "trans-musa-04",
      }));
    }, 1500);
  };

  const handleStateAction = async (action: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      let bodyPayload: any = { action };
      if (action === "close") {
        bodyPayload = {
          action: "close",
          vialsAdministered,
          clinicalOutcome,
          outcomeNotes,
        };
      }

      const res = await fetch(`/api/cases/${caseId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchCase();
      } else {
        setErrorMessage(json.error || `Failed to transition state with action: ${action}`);
      }
    } catch (err) {
      setErrorMessage("Network error updating case state.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-4 border-brand-teal-800 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading case management dashboard...</p>
      </div>
    );
  }

  if (!caseRec) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-xl shadow border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Case Not Found</h2>
          <p className="text-slate-600 mb-4">{errorMessage || "Invalid case identifier."}</p>
          <Link
            href="/activate"
            className="px-4 py-2 bg-brand-teal-800 text-white font-medium rounded-md hover:bg-brand-teal-700"
          >
            Activate New Case
          </Link>
        </div>
      </div>
    );
  }

  const effectiveState = dispatchSuccess ? "EN_ROUTE" : (caseRec.state || "ACCEPTED");
  const isEscalated = effectiveState === "ESCALATION_REQUIRED";

  const timelineSteps = [
    { key: "ACTIVATED", label: "Activated" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "TRANSPORT_COORDINATION", label: "Transport" },
    { key: "EN_ROUTE", label: "En Route" },
    { key: "ARRIVED", label: "Arrived" },
    { key: "CLOSED", label: "Closed" },
  ];

  const stateOrder = [
    "ACTIVATED",
    "TRIAGING",
    "MATCHING",
    "AWAITING_ACCEPTANCE",
    "ACCEPTED",
    "TRANSPORT_COORDINATION",
    "EN_ROUTE",
    "ARRIVED",
    "CLOSED",
  ];

  const currentIdx = stateOrder.indexOf(effectiveState);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 mt-4">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isEscalated
                    ? "bg-brand-gold-500 text-slate-900 animate-pulse border border-brand-gold-600"
                    : effectiveState === "CLOSED"
                    ? "bg-slate-100 text-slate-800"
                    : dispatchSuccess
                    ? "bg-emerald-600 text-white border border-emerald-700 shadow-sm"
                    : "bg-brand-teal-900 text-brand-gold-500 border border-brand-gold-500/40"
                }`}
              >
                ● State: {effectiveState}
              </span>
              {caseRec.channel && (
                <span className="text-[10px] uppercase font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  Channel: {caseRec.channel}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Case Coordination &amp; Lifecycle
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Ref ID: <span className="text-slate-800 font-bold">{caseRec.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/cases/${caseId}/match`}
              className="px-3 py-1.5 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-900 rounded text-xs font-semibold transition-colors border border-brand-teal-200"
            >
              View Matches
            </Link>
            <Link
              href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
              className="px-3 py-1.5 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-900 rounded text-xs font-semibold transition-colors border border-brand-teal-200"
            >
              Facility Readiness
            </Link>
          </div>
        </div>

        {/* Visual Lifecycle Stepper (Updated on dispatchSuccess: Transport & En Route active) */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            <span>Emergency Response Timeline</span>
            {dispatchSuccess && (
              <span className="text-emerald-700 font-bold normal-case text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Rider Dispatched &bull; En Route
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {timelineSteps.map((step) => {
              const stepIdx = stateOrder.indexOf(step.key);
              const isPast = currentIdx > stepIdx;
              const isCurrent = effectiveState === step.key;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center p-2.5 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? "bg-brand-teal-800 border-brand-teal-800 text-white font-bold shadow-md scale-105"
                      : isPast
                      ? "bg-brand-teal-50 border-brand-teal-200 text-brand-teal-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="text-[11px] font-bold">
                    {isPast ? "✓" : isCurrent ? "▶" : "○"}
                  </span>
                  <span className="text-[11px] truncate w-full mt-0.5">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Escalation Alert */}
        {isEscalated && (
          <div className="mb-6 p-5 bg-brand-gold-500 text-slate-900 border-2 border-brand-gold-600 rounded-xl shadow-md">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1 text-sm">
              <span>⚠️ Emergency Escalation Active</span>
            </div>
            <p className="text-xs font-medium">
              {caseRec.escalationReason ||
                "Patient requires immediate manual operator intervention or district ambulance dispatch."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleStateAction("start_matching")}
                className="px-3 py-1.5 bg-brand-teal-900 hover:bg-brand-teal-800 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Re-attempt Facility Matching
              </button>
            </div>
          </div>
        )}

        {/* Closed-Loop Feedback Dispatch Banner (When Closed) */}
        {effectiveState === "CLOSED" && (
          <div className="mb-6 p-6 bg-brand-teal-900 text-white border border-brand-teal-800 rounded-xl shadow-lg">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-brand-teal-800 border border-brand-gold-500 text-brand-gold-500 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                ✓
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Closed-Loop Feedback Dispatched
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold-500 text-slate-900">
                    CSC NOTIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1">
                  The clinical loop is closed. Automated confirmation sent to the Community Snakebite Champion (CSC) who activated this case.
                </p>
                <div className="mt-3 p-3.5 bg-brand-teal-800/80 rounded-md border border-brand-teal-700 font-mono text-[11px] text-slate-100 space-y-1">
                  <div className="text-brand-gold-500 text-[10px] uppercase font-bold">
                    Dispatched SMS Payload:
                  </div>
                  <div className="leading-relaxed">
                    &quot;[Bite2Care] Update for Case #{caseRec.id.slice(0, 8)}: Patient received definitive care. Outcome: <strong className="text-white">{caseRec.clinicalOutcome || "DISCHARGED_STABLE"}</strong> ({caseRec.vialsAdministered ?? 0} vials administered). Thank you for activating rapid emergency care!&quot;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* Patient & Incident Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Patient &amp; Incident Information
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900">{caseRec.location || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Sex:</span>
                <span className="font-semibold text-slate-900">
                  {caseRec.patientAge ? `${caseRec.patientAge} yrs` : "28 yrs"} / {caseRec.patientSex || "male"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Snake:</span>
                <span className="font-semibold text-slate-900">{caseRec.suspectedSnake || "Carpet Viper"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pregnancy:</span>
                <span className="font-semibold text-slate-900">{caseRec.pregnancyStatus || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Assigned Resources &amp; Logistics
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Receiving Facility:</span>
                <span className="font-bold text-brand-teal-900">
                  Facility B (Primary Healthcare Centre)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transport:</span>
                <span className={`font-semibold ${dispatchSuccess ? "text-emerald-700 font-bold" : "text-slate-900"}`}>
                  {dispatchSuccess
                    ? "Musa Ibrahim (Keke Ambulance #04)"
                    : caseRec.transportProviderId
                    ? "Mapped Vehicle"
                    : "Pending Dispatch"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Convergence:</span>
                <span className="font-semibold text-brand-teal-800">
                  Hub C Priority Motorcycle in Transit (ETA 38m)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action Panel Based on State */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Operational Next Step:
          </h3>

          {/* STATE: ACCEPTED / AWAITING TRANSPORT */}
          {(!dispatchSuccess && (effectiveState === "ACCEPTED" || effectiveState === "ACTIVATED" || effectiveState === "MATCHING")) && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Facility B has acknowledged the pre-arrival alert. Activate nearest mapped emergency transport provider to pick up the victim.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleAssignTransport}
                  disabled={isDispatching}
                  className="flex-1 bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/60 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDispatching ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>🛰️ Pinging Local Transport Network...</span>
                    </>
                  ) : (
                    <span>🚑 Coordinate &amp; Assign Mapped Transport</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SUCCESS DISPATCH STATE (Shows Primary Transition Button to Facility Dashboard) */}
          {dispatchSuccess && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Transport Assigned: Community Rider (Musa Ibrahim &bull; Keke Ambulance #04) is En Route &bull; ETA 8 mins
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white uppercase">
                  EN_ROUTE
                </span>
              </div>

              {/* Primary button to switch to hospital view */}
              <Link
                href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold py-4 px-6 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-brand-teal-700"
              >
                <span>🏥 Switch to Facility Dashboard (Doctor View) &rarr;</span>
              </Link>
            </div>
          )}

          {/* STATE: EN_ROUTE (if navigated back) */}
          {effectiveState === "EN_ROUTE" && !dispatchSuccess && (
            <div className="space-y-3">
              <div className="p-3 bg-brand-teal-50 border border-brand-teal-200 rounded-md text-xs text-brand-teal-900 font-medium">
                Patient is accompanied en route to receiving facility. Pre-arrival readiness is active.
              </div>
              <Link
                href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                🏥 Switch to Facility Dashboard (Doctor View) &rarr;
              </Link>
            </div>
          )}

          {/* STATE: ARRIVED & HANDOVER (FORM TO CLOSE CASE) */}
          {effectiveState === "ARRIVED" && (
            <div className="space-y-4 p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Clinical Handover &amp; Outcome Confirmation
                </h4>
                <p className="text-xs text-slate-500">
                  Record antivenom administered, final patient outcome, and close the feedback loop.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Antivenom Vials Administered:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={vialsAdministered}
                    onChange={(e) => setVialsAdministered(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Clinical Outcome:
                  </label>
                  <select
                    value={clinicalOutcome}
                    onChange={(e) => setClinicalOutcome(e.target.value)}
                    className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700"
                  >
                    <option value="DISCHARGED_STABLE">Discharged Stable (Recovered)</option>
                    <option value="ADMITTED_ICU">Admitted to ICU / HDU</option>
                    <option value="REFERRED_TERTIARY">Referred to Tertiary Care</option>
                    <option value="DECEASED">Deceased</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Handover Summary Notes:
                </label>
                <textarea
                  rows={2}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-md p-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700"
                />
              </div>

              <button
                type="button"
                onClick={() => handleStateAction("close")}
                disabled={actionLoading}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-bold py-3 px-4 rounded-md text-xs transition-colors shadow-sm cursor-pointer"
              >
                {actionLoading ? "Recording..." : "✓ Confirm Clinical Outcome & Close Feedback Loop"}
              </button>
            </div>
          )}

          {/* STATE: CLOSED */}
          {effectiveState === "CLOSED" && (
            <div className="flex items-center justify-between p-4 bg-brand-teal-50 rounded-lg border border-brand-teal-200">
              <span className="text-xs text-brand-teal-900 font-medium">
                This emergency episode is closed and archived for audit.
              </span>
              <Link
                href="/activate"
                className="px-4 py-2 bg-brand-teal-800 text-white rounded text-xs font-semibold hover:bg-brand-teal-700 transition-colors shadow-sm"
              >
                Activate New Case
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
