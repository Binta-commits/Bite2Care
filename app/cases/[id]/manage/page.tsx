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
  const [callingDriver, setCallingDriver] = useState(false);

  // Dynamic Patient Demo Data State
  const [demoData, setDemoData] = useState<{
    location: string;
    country: string;
    age: string;
    patientAge?: string | number;
    ageUnit?: string;
    sex: string;
    patientSex?: string;
    snake: string;
    suspectedSnake?: string;
    pregnancy?: string;
    pregnancyStatus?: string;
    hasRedFlags?: boolean;
    hasAirwayIssue?: boolean;
    initiator?: string;
    healer?: string | null;
    clinicalOutcome?: string;
    outcomeNotes?: string;
  }>({
    location: "Yam farm 2km north of Keffi market",
    country: "Nigeria",
    age: "28",
    ageUnit: "Years",
    sex: "male",
    snake: "West African Carpet Viper (Echis ocellatus)",
    pregnancy: "N/A (Male)",
    pregnancyStatus: "N/A (Male)",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bite2care_demo_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.age && typeof parsed.age === "string" && parsed.age.includes("mo")) {
          parsed.age = parsed.age.replace(/\s*mo/gi, "").trim();
          if (!parsed.ageUnit) parsed.ageUnit = "Months";
        }
        setDemoData(parsed);
      }
    } catch (e) {}
  }, []);

  // Derived High-Level Safety Bypass checks
  const isPediatric = Boolean(
    demoData?.ageUnit?.toLowerCase() === "months" ||
      (demoData?.age && parseFloat(demoData.age) <= 16) ||
      (demoData?.patientAge && Number(demoData.patientAge) <= 16) ||
      (caseRec?.patientAge && Number(caseRec.patientAge) <= 16)
  );
  const pregStr = String(
    demoData?.pregnancyStatus ||
      demoData?.pregnancy ||
      caseRec?.pregnancyStatus ||
      ""
  ).trim();
  const isPregnant = pregStr === "Yes" || pregStr === "Pregnant";
  const hasAirwayIssue = Boolean(
    demoData?.hasAirwayIssue === true ||
      demoData?.hasRedFlags === true ||
      caseRec?.hasAirwayIssue === true ||
      caseRec?.hasRedFlags === true
  );

  const additionalVictims = (demoData as any)?.additionalVictims || [];
  const hasAdditionalVictimBypass = additionalVictims.some((v: any) => {
    const isVPed =
      v.age !== "" &&
      !isNaN(Number(v.age)) &&
      (v.ageUnit?.toLowerCase() === "months" ||
        (v.ageUnit?.toLowerCase() === "years" && Number(v.age) <= 16));
    const isVPreg = v.pregnancy === "Yes" || v.pregnancy === "Pregnant";
    return isVPed || isVPreg || Boolean(v.hasAirwayIssue);
  }) || Boolean((demoData as any)?.victim2AirwayIssue);

  const isHighLevelBypass = isPediatric || isPregnant || hasAirwayIssue || hasAdditionalVictimBypass;

  // Inter-Facility Clinical Escalation State
  const [interFacilityEscalated, setInterFacilityEscalated] = useState(false);

  // Dynamic Selected Facility Info
  const selectedFacility = (demoData as any)?.selectedFacility;
  const facilityLevel: number =
    interFacilityEscalated
      ? 3
      : selectedFacility?.capabilityLevel ||
        (isHighLevelBypass ? 3 : 1);
  const facilityName: string =
    interFacilityEscalated
      ? "Federal Medical Centre (Central Specialist Hospital) [Escalated Tertiary]"
      : (demoData as any)?.facilityName ||
        selectedFacility?.facilityName ||
        selectedFacility?.destinationFacilityName ||
        (isHighLevelBypass
          ? "Federal Medical Centre (Central Specialist Hospital)"
          : "Facility B (Primary Healthcare Centre)");

  // Dynamic Multi-Tier Transport Resource Allocation
  const isMultiVictim = Boolean((demoData as any)?.victimCount > 1);
  const isAlsAmbulance = isHighLevelBypass || facilityLevel >= 2 || interFacilityEscalated;

  const transportConfig = isMultiVictim
    ? {
        type: "DUAL_FLEET",
        name: "Dual Emergency Fleet (#02 ALS Ambulance + #04 Keke)",
        leadDriver: "Tunde Bakare & Musa Ibrahim",
        paramedic: "Sister Grace Ogwuche (Lead Paramedic)",
        phone: "+234 803 555 7890",
        plate: "NAS-442-AMB / KFF-123-XY",
        vehicleType: "4WD ALS Ambulance + Secondary Carrier",
        equipment: "Continuous O2, 2x Pulse Oximeters, Suction Unit & 12 Antivenom Vials Capacity",
        costModel: "Project-Supported (Emergency Free to Patient)",
      }
    : isAlsAmbulance
    ? {
        type: "ALS_AMBULANCE",
        name: "District Emergency Ambulance #02 (ALS 4WD)",
        leadDriver: "Tunde Bakare",
        paramedic: "Sister Grace Ogwuche (Emergency Nurse/Paramedic)",
        phone: "+234 803 555 7890",
        plate: "NAS-442-AMB (4WD LandCruiser)",
        vehicleType: "District ALS 4WD Ambulance (Oxygen & Monitor Equipped)",
        equipment: "Continuous O2, Pulse Oximeter, Suction Unit & Bag-Valve-Mask Kit",
        costModel: "Project-Supported (Emergency Free to Patient)",
      }
    : {
        type: "KEKE_RENDEZVOUS",
        name: "Musa Ibrahim (Keke Ambulance #04) + Courier Aliyu (#09)",
        leadDriver: "Musa Ibrahim",
        paramedic: "CHEW Community First Responder",
        phone: "+234 801 234 5678",
        plate: "KFF-123-XY (Retrofitted Tricycle)",
        vehicleType: "Retrofitted Keke Ambulance + Hub C Motorcycle Stock Courier",
        equipment: "First Aid Kit, Stretcher, Splints + Cold-Chain Vaccine Carrier via Courier",
        costModel: "Project-Supported (Emergency Free to Patient)",
      };

  // Outcome Form State (used when ARRIVED)
  const [vialsAdministered, setVialsAdministered] = useState<number>(2);
  const [clinicalOutcome, setClinicalOutcome] = useState<string>("DISCHARGED_STABLE");
  const [outcomeNotes, setOutcomeNotes] = useState<string>(
    "Patient received definitive care. 20WBCT normalized at 6h. Vitals stabilized."
  );

  const fetchCase = async () => {
    if (!caseId) return;
    try {
      const isClosedParam =
        typeof window !== "undefined" &&
        window.location.search.includes("closed=true");
      const isInpatientParam =
        typeof window !== "undefined" &&
        (window.location.search.includes("inpatient=true") ||
          (demoData as any)?.clinicalOutcome === "Admitted Inpatient");

      const res = await fetch(`/api/cases/${caseId}`);
      const json = await res.json();
      if (json.success && json.case) {
        setCaseRec(
          isClosedParam
            ? {
                ...json.case,
                state: "CLOSED",
                vialsAdministered: 6,
                clinicalOutcome: "DISCHARGED_STABLE",
              }
            : isInpatientParam
            ? {
                ...json.case,
                state: "ADMITTED_INPATIENT",
                vialsAdministered: 10,
                clinicalOutcome: "ADMITTED_INPATIENT",
              }
            : json.case
        );
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
          state: isClosedParam
            ? "CLOSED"
            : isInpatientParam
            ? "ADMITTED_INPATIENT"
            : "ACCEPTED",
          vialsAdministered: isClosedParam ? 6 : isInpatientParam ? 10 : null,
          clinicalOutcome: isClosedParam
            ? "DISCHARGED_STABLE"
            : isInpatientParam
            ? "ADMITTED_INPATIENT"
            : null,
          channel: "WEB",
        });
      }
    } catch (err) {
      // Fallback presentation case record
      const isClosedParam =
        typeof window !== "undefined" &&
        window.location.search.includes("closed=true");
      const isInpatientParam =
        typeof window !== "undefined" &&
        (window.location.search.includes("inpatient=true") ||
          (demoData as any)?.clinicalOutcome === "Admitted Inpatient");

      setCaseRec({
        id: caseId,
        location: "Yam farm 2km north of Keffi market, Nasarawa (GPS: 8.8471, 7.8932)",
        biteTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        suspectedSnake: "West African Carpet Viper (Echis ocellatus)",
        patientAge: 28,
        patientSex: "male",
        pregnancyStatus: "N/A",
        facilityId: "fac-b",
        state: isClosedParam
          ? "CLOSED"
          : isInpatientParam
          ? "ADMITTED_INPATIENT"
          : "ACCEPTED",
        vialsAdministered: isClosedParam ? 6 : isInpatientParam ? 10 : null,
        clinicalOutcome: isClosedParam
          ? "DISCHARGED_STABLE"
          : isInpatientParam
          ? "ADMITTED_INPATIENT"
          : null,
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
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                Emergency Step 3
              </span>
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
              &larr; View Matches
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

        {/* Multi-Day Inpatient Ward Monitoring Banner */}
        {effectiveState === "ADMITTED_INPATIENT" && (
          <div className="mb-6 p-6 bg-purple-900 text-white border border-purple-800 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-purple-800 border border-purple-400 text-purple-200 flex items-center justify-center font-bold text-sm mr-3 flex-shrink-0">
                🏥
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Inpatient Ward Monitoring &bull; Day 2 of 3
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-400 text-purple-950">
                    WARD CARE ACTIVE
                  </span>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Patient admitted to the acute ward following initial antivenom titration. Serial 20WBCT clotting tests and vital signs tracked across 72 hours.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-mono">
                  <div className="p-2.5 bg-purple-950/80 rounded border border-purple-800">
                    <span className="text-purple-300 block font-bold">Total Vials Administered:</span>
                    <span className="text-white text-xs font-bold">10 Vials (6 initial + 4 at 6h)</span>
                  </div>
                  <div className="p-2.5 bg-purple-950/80 rounded border border-purple-800">
                    <span className="text-purple-300 block font-bold">Serial 20WBCT Clotting:</span>
                    <span className="text-emerald-300 text-xs font-bold">Normalized (12 Mins)</span>
                  </div>
                  <div className="p-2.5 bg-purple-950/80 rounded border border-purple-800">
                    <span className="text-purple-300 block font-bold">Next Ward Evaluation:</span>
                    <span className="text-amber-300 text-xs font-bold">Day 3 Discharge Clearance</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/triage/${caseId}`}
                    className="px-3.5 py-1.5 bg-purple-400 hover:bg-purple-300 text-purple-950 text-xs font-bold rounded-md transition-colors"
                  >
                    🩺 Update Doctor Notes &amp; Discharge
                  </Link>
                </div>
              </div>
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
                    &quot;[Bite2Care] Update for Case #{caseRec.id.slice(0, 8)}: Patient received definitive care. Outcome: <strong className="text-white">{(demoData as any).clinicalOutcome || caseRec.clinicalOutcome || "Discharged Stable"}</strong> (6 vials administered). Thank you for activating rapid emergency care!&quot;
                  </div>
                  {(demoData as any).outcomeNotes && (
                    <div className="text-[10px] text-slate-300 italic pt-1 border-t border-brand-teal-700/60 mt-1">
                      Attending Clinician Notes: &ldquo;{(demoData as any).outcomeNotes}&rdquo;
                    </div>
                  )}
                </div>

                {(demoData as any).healer && (
                  <div className="mt-2.5 p-2.5 bg-emerald-950/80 border border-emerald-500/80 rounded-md text-[11px] text-emerald-100 flex items-center gap-2 font-medium">
                    <span>✅</span>
                    <span>
                      <strong>Traditional Healer Incentive:</strong> $10 referral stipend logged for{" "}
                      <strong className="text-white">{(demoData as any).healer}</strong>
                    </span>
                  </div>
                )}
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
                <span className="font-semibold text-slate-900">{demoData.location}, {demoData.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Sex:</span>
                <span className="font-semibold text-slate-900">
                  {demoData?.age || 'Unknown'} / {demoData?.sex || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Snake:</span>
                <span className="font-semibold text-slate-900">{demoData.snake}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pregnancy:</span>
                <span className="font-semibold text-slate-900">{demoData?.pregnancyStatus || demoData?.pregnancy || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Safety Protocol:</span>
                <span className={`font-bold ${isHighLevelBypass ? "text-red-700" : "text-emerald-700"}`}>
                  {isHighLevelBypass
                    ? "Level 2/3 High-Risk Bypass"
                    : "Standard Care Protocol"}
                </span>
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
                  {facilityName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Level:</span>
                <span className="font-semibold text-slate-900">
                  {facilityLevel === 3
                    ? "Level 3 Specialist Centre (ICU & Dialysis Ready)"
                    : facilityLevel === 2
                    ? "Level 2 General Hospital (Doctor & Blood Bank Ready)"
                    : "Level 1 PHC (Basic Emergency Ready)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transport:</span>
                <span className={`font-semibold ${dispatchSuccess ? "text-emerald-700 font-bold" : "text-slate-900"}`}>
                  {dispatchSuccess
                    ? transportConfig.name
                    : caseRec?.transportProviderId
                    ? transportConfig.name
                    : "Pending Dispatch"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock Convergence:</span>
                <span className="font-semibold text-brand-teal-800">
                  {facilityLevel === 3
                    ? "On-site Verified Stock (14 Vials in Central Pharmacy)"
                    : facilityLevel === 2
                    ? "On-site Stock (8 Vials in Emergency Reserve)"
                    : "Hub C Priority Motorcycle in Transit (ETA 38m)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Inter-Facility Escalation Banner */}
        {interFacilityEscalated && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-3 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🚨</span>
              <div>
                <span className="font-bold block uppercase tracking-wide text-amber-900">
                  Inter-Facility Clinical Escalation Active
                </span>
                <span>
                  Patient escalated from Level {facilityLevel === 3 ? "2" : "1"} to <strong>Federal Medical Centre (Level 3 Specialist Centre)</strong>. Advanced 4WD ALS Ambulance with continuous oxygen dispatched for secondary transfer.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-600 text-white font-bold rounded text-[10px] uppercase whitespace-nowrap">
              Tertiary Transfer
            </span>
          </div>
        )}

        {/* Dynamic Action Panel Based on State */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Operational Next Step:
          </h3>

          {/* STATE: ACCEPTED / AWAITING TRANSPORT */}
          {(!dispatchSuccess && (effectiveState === "ACCEPTED" || effectiveState === "ACTIVATED" || effectiveState === "MATCHING")) && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                {facilityName} has acknowledged the pre-arrival alert. Activate nearest mapped emergency transport provider to pick up the victim.
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
                      <span>🛰️ Pinging {transportConfig.name}...</span>
                    </>
                  ) : (
                    <span>🚑 Coordinate &amp; Assign Transport ({transportConfig.name.split("(")[0].trim()})</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 italic mt-1.5 leading-relaxed">
                *Logistics routing is provided for operational support. Final patient admission and inter-facility transfer remain at the discretion of the attending clinician.*
              </p>
            </div>
          )}

          {/* SUCCESS DISPATCH STATE (Shows Expanded Transport Detail Card & Transition Button to Doctor's Portal) */}
          {dispatchSuccess && (
            <div className="space-y-4 animate-fadeIn">
              {/* Expanded Transport Detail Card (Point 7) */}
              <div className="p-5 bg-emerald-50/90 border-2 border-emerald-500/80 rounded-xl shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></span>
                    <h4 className="text-sm font-bold text-emerald-950">
                      🚑 {transportConfig.name} &bull; Assigned &amp; En Route
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold bg-emerald-700 text-white uppercase shadow-sm">
                    EN_ROUTE &bull; ETA {isAlsAmbulance ? "12 MINS" : "8 MINS"}
                  </span>
                </div>

                {/* 4-Field Driver & Vehicle Grid + Cost Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-800 bg-white p-3.5 rounded-lg border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-slate-500 font-semibold">Lead Crew:</span>
                    <span className="font-bold text-slate-900">{transportConfig.leadDriver} ({transportConfig.paramedic})</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-slate-500 font-semibold">Emergency Phone:</span>
                    <span className="font-mono font-bold text-emerald-800">{transportConfig.phone}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-slate-500 font-semibold">Vehicle Type:</span>
                    <span className="font-bold text-slate-900">{transportConfig.vehicleType}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-slate-500 font-semibold">Plate Number:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                      {transportConfig.plate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2 sm:col-span-2 pt-2 border-t border-emerald-100">
                    <span className="text-slate-500 font-semibold">Equipment / Capacity:</span>
                    <span className="font-medium text-slate-800">
                      {transportConfig.equipment}
                    </span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2 sm:col-span-2 pt-1">
                    <span className="text-slate-500 font-semibold">Cost Model:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded text-[11px]">
                      ✓ {transportConfig.costModel}
                    </span>
                  </div>
                </div>

                {/* Interactive Mock Call Driver Action Button */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCallingDriver(true);
                      setTimeout(() => setCallingDriver(false), 2500);
                    }}
                    disabled={callingDriver}
                    className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {callingDriver ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connecting to {transportConfig.leadDriver} ({transportConfig.phone})...</span>
                      </>
                    ) : (
                      <>
                        <span>📞</span>
                        <span>Call Ambulance Driver ({transportConfig.phone})</span>
                      </>
                    )}
                  </button>
                  {callingDriver && (
                    <span className="text-xs text-emerald-800 font-semibold animate-pulse">
                      Simulating encrypted emergency dispatch call...
                    </span>
                  )}
                </div>
              </div>

              {/* Primary button to switch to Doctor's Portal on Triage */}
              <div className="space-y-2">
                <Link
                  href={`/triage/${caseId}`}
                  className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold py-4 px-6 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-brand-teal-700"
                >
                  <span>🏥 Switch to Doctor&apos;s Portal &rarr;</span>
                </Link>

                {/* Inter-Facility Referral / Escalation Button */}
                <button
                  type="button"
                  onClick={() => {
                    setInterFacilityEscalated(true);
                  }}
                  className="w-full bg-white hover:bg-red-50 text-red-700 border border-red-300 hover:border-red-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>⚠️ Inter-Facility Escalation (Escalate to Level 3 FMC)</span>
                </button>
              </div>
            </div>
          )}

          {/* STATE: EN_ROUTE (if navigated back) */}
          {effectiveState === "EN_ROUTE" && !dispatchSuccess && (
            <div className="space-y-3">
              <div className="p-3 bg-brand-teal-50 border border-brand-teal-200 rounded-md text-xs text-brand-teal-900 font-medium">
                Patient is accompanied en route to receiving facility. Pre-arrival readiness is active.
              </div>
              <Link
                href={`/triage/${caseId}`}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                🏥 Switch to Doctor&apos;s Portal &rarr;
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

          {/* STATE: CLOSED - IMMUTABLE AUDIT LOG & LOCKED INTERFACE */}
          {effectiveState === "CLOSED" && (
            <div className="p-6 bg-slate-900 text-white rounded-2xl border-2 border-emerald-500 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔒</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-brand-gold-400 uppercase tracking-wider">
                      IMMUTABLE MEDICAL RECORD &bull; CASE OFFICIALLY CLOSED
                    </h4>
                    <span className="text-xs text-slate-300">
                      This emergency episode is closed. All entries, clinical scores, and antivenom authorizations are permanently locked for audit.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-700 text-white rounded font-mono text-[10px] font-bold uppercase tracking-wider">
                  LOCKED_AUDIT
                </span>
              </div>

              {/* Plain-text Read-Only Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Antivenom Administered:</span>
                  <span className="font-bold text-brand-gold-400 text-sm">
                    {caseRec?.vialsAdministered || vialsAdministered || 6} Vials Infused
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Final Clinical Outcome:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {caseRec?.clinicalOutcome || clinicalOutcome || "DISCHARGED_STABLE"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Record Retention:</span>
                  <span className="font-bold text-blue-300 text-sm">
                    24-Hour Showcase Archive
                  </span>
                </div>
                <div className="sm:col-span-3 pt-2 border-t border-slate-700">
                  <span className="text-slate-400 block text-[11px]">Attending Physician Handover Summary:</span>
                  <p className="text-slate-200 italic mt-0.5">
                    &quot;{caseRec?.outcomeNotes || outcomeNotes || "Patient completed full clinical course. Vital signs stabilized, 20WBCT normalized at 18h. Day 7 CSC wound follow-up scheduled."}&quot;
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Link
                  href="/cases"
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-semibold"
                >
                  &larr; Return to Case Registry Archive
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/triage/${caseId}?closed=true`}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-600 transition-colors"
                  >
                    🩺 View Read-Only Clinical Triage
                  </Link>
                  <Link
                    href="/activate"
                    className="px-4 py-2 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 rounded-lg text-xs font-bold transition-all shadow-md"
                  >
                    ➕ Activate New Case
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
