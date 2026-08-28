"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MatchPageProps {
  params: Promise<{ id: string }>;
}

export default function MatchPage({ params }: MatchPageProps) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  const [ranked, setRanked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertingId, setAlertingId] = useState<string | null>(null);
  const [awaitingOption, setAwaitingOption] = useState<any | null>(null);
  const [acceptedFacility, setAcceptedFacility] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [escalating, setEscalating] = useState(false);

  const fetchMatches = () => {
    if (!caseId) return;
    setLoading(true);
    fetch(`/api/cases/${caseId}/match`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.ranked) {
          setRanked(json.ranked);
        } else {
          setError(json.error || "Failed to load matching facilities.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Network error fetching match results.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMatches();
  }, [caseId]);

  // Step 1: Send Pre-Arrival Alert & Request Acceptance
  const requestAcceptance = async (optionItem: any) => {
    const facilityId =
      optionItem.option.facilityId || optionItem.option.destinationFacilityId;
    setAlertingId(facilityId);
    setError(null);

    try {
      // Update state to AWAITING_ACCEPTANCE
      await fetch(`/api/cases/${caseId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "alert_facility", facilityId }),
      });
      setAwaitingOption(optionItem);
    } catch (err) {
      setError("Network error sending pre-arrival alert.");
    } finally {
      setAlertingId(null);
    }
  };

  // Step 2: Receiving Facility Confirms Acceptance
  const confirmAcceptance = async () => {
    if (!awaitingOption) return;
    const facilityId =
      awaitingOption.option.facilityId || awaitingOption.option.destinationFacilityId;
    const facilityName =
      awaitingOption.option.facilityName ||
      awaitingOption.option.destinationFacilityName ||
      "Selected Facility";

    setAlertingId(facilityId);
    try {
      const res = await fetch(`/api/cases/${caseId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityId }),
      });
      const json = await res.json();
      if (json.success) {
        setAcceptedFacility(facilityName);
        setTimeout(() => {
          router.push(`/cases/${caseId}/manage`);
        }, 1200);
      } else {
        setError(json.error || "Failed to accept destination.");
      }
    } catch (err) {
      setError("Network error confirming acceptance.");
    } finally {
      setAlertingId(null);
    }
  };

  // Emergency Escalation Handler
  const triggerEscalation = async () => {
    setEscalating(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "escalate",
          escalationReason: "No suitable facility accepted in time. Manual district health escalation triggered.",
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/cases/${caseId}/manage`);
      } else {
        setError(json.error || "Escalation failed.");
      }
    } catch (err) {
      setError("Network error triggering escalation.");
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-slate-200 mt-10">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold-500 text-slate-900">
                Emergency Step 3
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Case ID: <span className="font-mono font-bold text-slate-800">{caseId}</span>
              </span>
            </div>
            <Link
              href={`/triage/${caseId}`}
              className="text-xs text-brand-teal-800 hover:text-brand-teal-700 font-semibold"
            >
              &larr; Back to Triage
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Dynamic Treatment Rendezvous &amp; Facility Matching
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluating verified capability level, real-time antivenom stock, travel safety, and reverse logistics options.
          </p>
        </div>

        {/* Success / Accepted Banner */}
        {acceptedFacility && (
          <div className="mb-6 p-5 bg-brand-teal-900 text-white border border-brand-teal-800 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-brand-teal-800 border border-brand-gold-500 flex items-center justify-center text-brand-gold-500 font-bold text-xs mr-3 flex-shrink-0">
                ✓
              </div>
              <div className="text-sm font-bold text-white">
                Destination Confirmed: <span className="text-brand-gold-500">{acceptedFacility}</span>. Redirecting to transport coordination...
              </div>
            </div>
          </div>
        )}

        {/* Modal / Banner: Awaiting Facility Acceptance (Gold Emergency Alert) */}
        {awaitingOption && !acceptedFacility && (
          <div className="mb-6 p-5 bg-brand-gold-500 text-slate-900 border-2 border-brand-gold-600 rounded-xl shadow-md">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-brand-gold-500 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                🔔
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Pre-Arrival Alert Broadcasted
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white">
                    AWAITING_ACCEPTANCE
                  </span>
                </div>
                <p className="text-xs text-slate-900 font-medium mt-1">
                  Alert ping transmitted to emergency focal person at{" "}
                  <strong>
                    {awaitingOption.option.facilityName ||
                      awaitingOption.option.destinationFacilityName}
                  </strong>
                  . Awaiting confirmation of clinical readiness.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={confirmAcceptance}
                    disabled={!!alertingId}
                    className="px-4 py-2 bg-brand-teal-900 hover:bg-brand-teal-800 text-white text-xs font-bold rounded-md shadow-sm transition-colors cursor-pointer"
                  >
                    {alertingId
                      ? "Confirming..."
                      : "✓ Facility Confirms Readiness (Accept)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAwaitingOption(null)}
                    className="px-3 py-2 bg-white border border-slate-300 text-slate-900 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
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

        {/* No Options */}
        {!loading && ranked.length === 0 && (
          <div className="py-12 text-center text-slate-500">
            <p className="text-base font-medium text-slate-800">No verified facilities currently match criteria.</p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={triggerEscalation}
                disabled={escalating}
                className="px-4 py-2 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 rounded-md text-xs font-bold shadow-sm"
              >
                Trigger Emergency Escalation Protocol
              </button>
            </div>
          </div>
        )}

        {/* Ranked Options List */}
        {!loading && ranked.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100">
              <span className="font-medium">Stratified by Clinical Capability, Stock &amp; Travel Feasibility</span>
              <button
                type="button"
                onClick={triggerEscalation}
                disabled={escalating}
                className="px-2.5 py-1 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-bold rounded text-xs transition-colors shadow-sm"
              >
                ⚠️ Escalate Case
              </button>
            </div>

            {ranked.map((r, idx) => {
              const opt = r.option;
              const isOptionA = opt.type === "Option A";
              const isOptionB = opt.type === "Option B";
              const isTop = idx === 0;
              const isStale = opt.staleness?.isStale;

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-xl border transition-all ${
                    isTop
                      ? "bg-brand-teal-50/40 border-brand-teal-800 ring-1 ring-brand-teal-700/30 shadow-md"
                      : isOptionB
                      ? "bg-slate-50 border-brand-teal-700/40 shadow-sm"
                      : "bg-white border-slate-200 shadow-sm hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Badge Ribbon */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isOptionA
                              ? "bg-brand-teal-100 text-brand-teal-900"
                              : "bg-brand-teal-900 text-brand-gold-500"
                          }`}
                        >
                          {opt.type}: {opt.mode}
                        </span>

                        {isTop && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal-900 text-brand-gold-500 border border-brand-gold-500/40 flex items-center gap-1">
                            ★ Recommended Direct Match
                          </span>
                        )}

                        {isOptionB && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                            🔄 Reverse Logistics Rendezvous
                          </span>
                        )}

                        {isStale && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-brand-gold-500 text-slate-900 border border-brand-gold-600">
                            ⚠️ Stock Data Stale (&gt;48h)
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-mono ml-auto sm:ml-0">
                          Score: {r.score}
                        </span>
                      </div>

                      {/* Facility Title */}
                      <h3 className="text-lg font-bold text-slate-900">
                        {opt.facilityName || opt.destinationFacilityName}
                      </h3>

                      {/* Option A Details */}
                      {isOptionA && (
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-500 block text-[11px]">Capability Tier</span>
                            <span className="font-bold text-slate-900">Level {opt.capabilityLevel} Care</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">ICU / HDU Capability</span>
                            {opt.hasIcuHdu ? (
                              <span className="text-emerald-700 font-bold">✓ Available</span>
                            ) : (
                              <span className="text-slate-500 font-medium">Standard Ward</span>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[11px]">Antivenom Stock</span>
                            <span
                              className={`font-bold ${
                                opt.antivenomStatus === "IN_STOCK"
                                  ? "text-emerald-700"
                                  : opt.antivenomStatus === "LOW"
                                  ? "text-amber-700"
                                  : "text-red-700"
                              }`}
                            >
                              {opt.antivenomStatus} ({opt.quantity ?? 0} vials)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Option B: Reverse Logistics Breakdown */}
                      {isOptionB && (
                        <div className="mt-3 p-4 bg-brand-teal-900 rounded-lg border border-brand-teal-800 text-xs text-white space-y-2">
                          <div className="font-bold text-brand-gold-500 flex items-center gap-1.5 text-sm">
                            <span>Dynamic Treatment Rendezvous Architecture:</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            Destination <strong>{opt.destinationFacilityName}</strong> has clinical personnel ready, but antivenom is currently out of stock. 
                            The system coordinates transfer of <strong>{opt.donorQuantity} vials</strong> from <strong>{opt.donorFacilityName}</strong> to meet the patient upon arrival.
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-900">
                            <div className="p-2 bg-white rounded border border-brand-teal-700">
                              <span className="text-slate-500 block text-[10px]">Patient Destination:</span>
                              <strong>{opt.destinationFacilityName}</strong>
                            </div>
                            <div className="p-2 bg-white rounded border border-brand-teal-700">
                              <span className="text-slate-500 block text-[10px]">Donor Stock Hub:</span>
                              <strong>{opt.donorFacilityName} ({opt.donorQuantity} vials)</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => requestAcceptance(r)}
                        disabled={!!alertingId}
                        className={`w-full sm:w-auto font-bold py-2.5 px-5 rounded-md transition-colors shadow-sm cursor-pointer text-xs ${
                          isOptionB
                            ? "bg-brand-teal-900 hover:bg-brand-teal-800 text-brand-gold-500 border border-brand-gold-500/50"
                            : "bg-brand-teal-800 hover:bg-brand-teal-700 text-white"
                        }`}
                      >
                        {alertingId === (opt.facilityId || opt.destinationFacilityId)
                          ? "Sending Alert..."
                          : "🔔 Send Pre-Alert & Select"}
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


