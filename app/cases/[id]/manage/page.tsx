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
      if (json.success) {
        setCaseRec(json.case);
      } else {
        setErrorMessage(json.error || "Case not found.");
      }
    } catch (err) {
      setErrorMessage("Network error fetching case details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCase();
  }, [caseId]);

  const assignTransport = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transport`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.success) {
        await fetchCase();
      } else {
        setErrorMessage(json.error || "Failed to assign transport provider.");
      }
    } catch (err) {
      setErrorMessage("Network error assigning transport.");
    } finally {
      setActionLoading(false);
    }
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Loading case management dashboard...</p>
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
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          >
            Activate New Case
          </Link>
        </div>
      </div>
    );
  }

  const currentState = caseRec.state || "ACTIVATED";
  const isEscalated = currentState === "ESCALATION_REQUIRED";

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

  const currentIdx = stateOrder.indexOf(currentState);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-slate-200 mt-10">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isEscalated
                    ? "bg-brand-gold-500 text-slate-900 animate-pulse border border-brand-gold-600"
                    : currentState === "CLOSED"
                    ? "bg-slate-100 text-slate-800"
                    : "bg-brand-teal-900 text-brand-gold-500 border border-brand-gold-500/40"
                }`}
              >
                ● State: {currentState}
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
              Ref ID: {caseRec.id}
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
              href={`/triage/${caseId}`}
              className="px-3 py-1.5 bg-brand-teal-50 hover:bg-brand-teal-100 text-brand-teal-900 rounded text-xs font-semibold transition-colors border border-brand-teal-200"
            >
              View Triage
            </Link>
          </div>
        </div>

        {/* Escalation Alert (Gold Emergency Alert) */}
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
        {currentState === "CLOSED" && (
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

        {/* Visual Lifecycle Stepper */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Emergency Response Timeline
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {timelineSteps.map((step) => {
              const stepIdx = stateOrder.indexOf(step.key);
              const isPast = currentIdx > stepIdx;
              const isCurrent = currentState === step.key;

              return (
                <div
                  key={step.key}
                  className={`flex flex-col items-center p-2 rounded-md border text-center transition-all ${
                    isCurrent
                      ? "bg-brand-teal-800 border-brand-teal-800 text-white font-bold shadow-sm"
                      : isPast
                      ? "bg-brand-teal-50 border-brand-teal-200 text-brand-teal-900 font-semibold"
                      : "bg-white border-slate-200 text-slate-400"
                  }`}
                >
                  <span className="text-[10px] font-bold">
                    {isPast ? "✓" : isCurrent ? "▶" : "○"}
                  </span>
                  <span className="text-[11px] truncate w-full">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* Patient & Incident Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Patient &amp; Incident Information
            </h3>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900">{caseRec.location || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Sex:</span>
                <span className="font-semibold text-slate-900">
                  {caseRec.patientAge ? `${caseRec.patientAge} yrs` : "N/A"} / {caseRec.patientSex || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Snake:</span>
                <span className="font-semibold text-slate-900">{caseRec.suspectedSnake || "Unspecified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pregnancy:</span>
                <span className="font-semibold text-slate-900">{caseRec.pregnancyStatus || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Assigned Resources &amp; Logistics
            </h3>
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Receiving Facility:</span>
                <span className="font-semibold text-slate-900">
                  {caseRec.facilityId ? "Verified Treatment Center" : "Pending Selection"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transport:</span>
                <span className="font-semibold text-slate-900">
                  {caseRec.transportProviderId ? "Dispatched Mapped Vehicle" : "Not Assigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pre-Alert Status:</span>
                <span className="font-semibold text-brand-teal-800">
                  {caseRec.facilityId ? "✓ Pre-Arrival Alert Maintained" : "Awaiting Destination"}
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

          {/* STATE: ACTIVATED / TRIAGING */}
          {(currentState === "ACTIVATED" || currentState === "TRIAGING") && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/triage/${caseId}`}
                className="flex-1 bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-semibold py-3 px-4 rounded-md text-center text-xs transition-colors shadow-sm"
              >
                Proceed to Clinical Triage &rarr;
              </Link>
            </div>
          )}

          {/* STATE: ACCEPTED */}
          {currentState === "ACCEPTED" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Facility has acknowledged the pre-arrival alert. Activate nearest mapped transport provider (e.g. Keke / Facility Vehicle / Volunteer Ambulance).
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={assignTransport}
                  disabled={actionLoading}
                  className="flex-1 bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-semibold py-3 px-4 rounded-md text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {actionLoading ? "Activating..." : "🚑 Coordinate & Assign Mapped Transport"}
                </button>
              </div>
            </div>
          )}

          {/* STATE: TRANSPORT_COORDINATION */}
          {currentState === "TRANSPORT_COORDINATION" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Transport provider mapped and briefed. Confirm when patient is loaded and moving.
              </p>
              <button
                type="button"
                onClick={() => handleStateAction("dispatch")}
                disabled={actionLoading}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-semibold py-3 px-4 rounded-md text-xs transition-colors shadow-sm cursor-pointer"
              >
                {actionLoading ? "Updating..." : "🚀 Confirm Patient En Route (Departed)"}
              </button>
            </div>
          )}

          {/* STATE: EN_ROUTE */}
          {currentState === "EN_ROUTE" && (
            <div className="space-y-3">
              <div className="p-3 bg-brand-teal-50 border border-brand-teal-200 rounded-md text-xs text-brand-teal-900 font-medium">
                Patient is accompanied en route to receiving facility. Pre-arrival readiness is active.
              </div>
              <button
                type="button"
                onClick={() => handleStateAction("arrived")}
                disabled={actionLoading}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-semibold py-3 px-4 rounded-md text-xs transition-colors shadow-sm cursor-pointer"
              >
                {actionLoading ? "Updating..." : "🏥 Confirm Patient Physical Arrival at Hospital"}
              </button>
            </div>
          )}

          {/* STATE: ARRIVED & HANDOVER (FORM TO CLOSE CASE) */}
          {currentState === "ARRIVED" && (
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
          {currentState === "CLOSED" && (
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
