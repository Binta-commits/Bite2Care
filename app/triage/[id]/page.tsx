"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGate from "@/components/RoleGate";
import { recordTriageAssessmentAction, updateCaseStateAction } from "@/app/actions/cases";
import { getClientRole } from "@/app/lib/rbac";

interface TriagePageProps {
  params: Promise<{ id: string }>;
}

export default function TriagePage({ params }: TriagePageProps) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  const [caseRec, setCaseRec] = useState<any>(null);
  const [isCaseClosed, setIsCaseClosed] = useState<boolean>(false);

  // Dynamic Patient Demo Data State
  const [demoData, setDemoData] = useState<{
    location: string;
    country: string;
    age: string;
    patientAge?: string | number;
    ageUnit?: string;
    sex: string;
    patientSex?: string;
    pregnancy?: string;
    pregnancyStatus?: string;
    snake: string;
    suspectedSnake?: string;
    initiator?: string;
    healer?: string | null;
    hasRedFlags?: boolean;
    hasAirwayIssue?: boolean;
    victimCount?: number;
    state?: string;
    clinicalOutcome?: string;
    outcomeNotes?: string;
  }>({
    location: "Yam farm 2km north of Keffi market",
    country: "Nigeria",
    age: "28",
    ageUnit: "Years",
    sex: "male",
    pregnancy: "N/A (Male)",
    pregnancyStatus: "N/A (Male)",
    snake: "West African Carpet Viper (Echis ocellatus)",
    initiator: "Remote Dispatcher",
    healer: null,
    hasRedFlags: false,
    hasAirwayIssue: false,
    victimCount: 1,
  });

  // Layer 1: In-Hospital Deterioration & Inter-Facility Escalation Triggers
  const [bypass, setBypass] = useState({
    // Domain 1: Airway, Breathing & Bulbar Compromise
    airwayRespCompromise: false,
    bulbarParesis: false,
    ocularInjury: false,

    // Domain 2: Circulation & Refractory Shock
    shockSBP_lt_90: false,
    cardiovascularCollapse: false,
    malignantArrhythmia: false,

    // Domain 3: Major Bleeding & Coagulopathy
    majorUncontrolledBleeding: false,
    spontaneousSystemicBleeding: false,

    // Domain 4: Acute Neurological Deterioration
    rapidNeuroDeterioration: false,
    progressiveParalysis: false,
    alteredConsciousness: false,
  });

  // Layer 2: NEWS2 Physiological Parameters (PDF Page 3 & 4)
  const [news2, setNews2] = useState({
    rr: "18", // bpm
    spo2: "98", // %
    supplementalO2: false,
    sbp: "120", // mmHg
    pulse: "76", // bpm
    acvpu: "A", // A, C, V, P, U
    temperature: "36.8", // °C
  });

  // Layer 3: WHO Antivenom Indication Criteria (PDF Page 9 & 14)
  const [who, setWho] = useState({
    // Systemic Envenoming
    wbctBleeding: true,
    neurotoxicity: false,
    cardiovascularAbnormality: false,
    acuteRenalFailure: false,

    // Local Envenoming
    swellingHalfLimb: false,
    swellingDigits: false,
    rapidProgression: false,
    childNonMinor: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    assessmentId: string;
    recommendation: string;
    type: "critical" | "authorized" | "observe";
    title: string;
    subtitle: string;
    vialsAuthorized?: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clinical Outcome Section State
  const [outcomeSelection, setOutcomeSelection] = useState("Discharged Stable");
  const [clinicalNotes, setClinicalNotes] = useState(
    "Patient received prompt clinical evaluation. 20WBCT monitored; vital signs stabilized."
  );
  const [submittingOutcome, setSubmittingOutcome] = useState(false);

  // Load persisted demo data from localStorage and DB
  useEffect(() => {
    const isClosedParam =
      typeof window !== "undefined" &&
      window.location.search.includes("closed=true");

    // Check localStorage
    try {
      const saved = localStorage.getItem("bite2care_demo_data");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.age && typeof parsed.age === "string" && parsed.age.includes("mo")) {
          parsed.age = parsed.age.replace(/\s*mo/gi, "").trim();
          if (!parsed.ageUnit) parsed.ageUnit = "Months";
        }
        setDemoData(parsed);

        if (parsed.clinicalOutcome === "Discharged Stable" || parsed.state === "CLOSED" || isClosedParam) {
          setIsCaseClosed(true);
        }

        // Initialize Layer 1 from intake flags if airway compromise was flagged
        const ageNum = Number(parsed.patientAge || parsed.age);
        const isPed =
          (parsed.patientAge !== "" &&
            !isNaN(ageNum) &&
            ((parsed.ageUnit || "").toLowerCase() === "months" ||
              ((parsed.ageUnit || "years").toLowerCase() === "years" && ageNum <= 16))) ||
          (typeof parsed.age === "string" &&
            (parsed.age.includes("month") || parseFloat(parsed.age) <= 16));

        const hasAirway = Boolean(parsed.hasAirwayIssue || parsed.hasRedFlags);

        setBypass((prev) => ({
          ...prev,
          airwayRespCompromise: hasAirway,
        }));

        if (isPed) {
          setWho((prev) => ({ ...prev, childNonMinor: true }));
        }
      }
    } catch (e) {}

    // Also query database directly to ensure freshest state and backend immutability lock status
    if (caseId) {
      fetch(`/api/cases/${caseId}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.case) {
            setCaseRec(json.case);
            if (json.case.state === "CLOSED" || isClosedParam) {
              setIsCaseClosed(true);
            }
          }
        })
        .catch((err) => console.warn("Case fetch note:", err));
    }
  }, [caseId]);

  // Demographics inherited from intake (Read-only badges & NEWS2 eligibility)
  const ageNum = Number(demoData?.patientAge || demoData?.age);
  const isPediatric =
    (demoData?.patientAge !== "" &&
      !isNaN(ageNum) &&
      ((demoData?.ageUnit || "").toLowerCase() === "months" ||
        ((demoData?.ageUnit || "years").toLowerCase() === "years" && ageNum <= 16))) ||
    (typeof demoData?.age === "string" &&
      (demoData.age.includes("month") || parseFloat(demoData.age) <= 16));

  const isPregnant =
    demoData?.pregnancy === "Pregnant" ||
    demoData?.pregnancy === "Yes" ||
    demoData?.pregnancyStatus === "Pregnant" ||
    demoData?.pregnancyStatus === "Yes";

  const isNews2Eligible = !isPediatric && !isPregnant;

  // Layer 1 Active Status
  const isLayer1Active = Object.values(bypass).some(Boolean);

  // NEWS2 Calculation (RCP Standard 0-20)
  const calculateNews2 = () => {
    let score = 0;
    let singleParam3 = false;

    // RR (0-3)
    const rrVal = parseFloat(news2.rr) || 0;
    let rrScore = 0;
    if (rrVal <= 8) rrScore = 3;
    else if (rrVal <= 11) rrScore = 1;
    else if (rrVal <= 20) rrScore = 0;
    else if (rrVal <= 24) rrScore = 2;
    else rrScore = 3;
    score += rrScore;
    if (rrScore === 3) singleParam3 = true;

    // SpO2 (0-3, Scale 1)
    const spo2Val = parseFloat(news2.spo2) || 98;
    let spo2Score = 0;
    if (spo2Val <= 91) spo2Score = 3;
    else if (spo2Val <= 93) spo2Score = 2;
    else if (spo2Val <= 95) spo2Score = 1;
    else spo2Score = 0;
    score += spo2Score;
    if (spo2Score === 3) singleParam3 = true;

    // Supplemental O2 (0 or 2)
    const o2Score = news2.supplementalO2 ? 2 : 0;
    score += o2Score;

    // Systolic BP (0-3)
    const sbpVal = parseFloat(news2.sbp) || 120;
    let sbpScore = 0;
    if (sbpVal <= 90) sbpScore = 3;
    else if (sbpVal <= 100) sbpScore = 2;
    else if (sbpVal <= 110) sbpScore = 1;
    else if (sbpVal <= 219) sbpScore = 0;
    else sbpScore = 3;
    score += sbpScore;
    if (sbpScore === 3) singleParam3 = true;

    // Pulse (0-3)
    const pulseVal = parseFloat(news2.pulse) || 76;
    let pulseScore = 0;
    if (pulseVal <= 40) pulseScore = 3;
    else if (pulseVal <= 50) pulseScore = 1;
    else if (pulseVal <= 90) pulseScore = 0;
    else if (pulseVal <= 110) pulseScore = 1;
    else if (pulseVal <= 130) pulseScore = 2;
    else pulseScore = 3;
    score += pulseScore;
    if (pulseScore === 3) singleParam3 = true;

    // Consciousness / ACVPU (0 or 3)
    const acvpuScore = news2.acvpu === "A" ? 0 : 3;
    score += acvpuScore;
    if (acvpuScore === 3) singleParam3 = true;

    // Temp (0-3)
    const tempVal = parseFloat(news2.temperature) || 36.8;
    let tempScore = 0;
    if (tempVal <= 35.0) tempScore = 3;
    else if (tempVal <= 36.0) tempScore = 1;
    else if (tempVal <= 38.0) tempScore = 0;
    else if (tempVal <= 39.0) tempScore = 1;
    else tempScore = 2;
    score += tempScore;
    if (tempScore === 3) singleParam3 = true;

    return { score, singleParam3 };
  };

  const { score: calculatedNews2Score, singleParam3: hasSingle3 } = calculateNews2();

  // Layer 3 (WHO Antivenom Criteria) Active Status
  const isWhoAntivenomPositive = Object.values(who).some(Boolean);

  // Dynamic Triage Submission Handler
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCaseClosed) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let triageType: "critical" | "authorized" | "observe" = "observe";
      let recTitle = "";
      let recSubtitle = "";
      let recText = "";
      const requiredVials = (demoData?.victimCount || 1) > 1 ? 12 : 6;

      if (isLayer1Active) {
        triageType = "critical";
        recTitle = "🚨 URGENT TERTIARY TRANSFER: In-Hospital Deterioration Active";
        recText = "IN-HOSPITAL CLINICAL DETERIORATION DETECTED — MOBILIZE ALS 4WD AMBULANCE FOR LEVEL 3 TERTIARY ICU TRANSFER";
        recSubtitle = `Immediate airway stabilization, vital organ support, infusion of ${requiredVials} vials IV antivenom, and urgent mobilization of ALS 4WD transport to Level 3 Tertiary Hospital (FMC / ICU).`;
      } else if (isWhoAntivenomPositive || (isNews2Eligible && (calculatedNews2Score >= 5 || hasSingle3))) {
        triageType = "authorized";
        recTitle = "ANTIVENOM AUTHORIZED: WHO Criteria Satisfied.";
        recText = `WHO INDICATION CRITERIA SATISFIED — ${requiredVials} Vials Released for Immediate Intravenous Infusion`;
        recSubtitle = "Pre-medicate with s/c adrenaline 2.5mg if indicated. Administer IV antivenom over 30–60 minutes.";
      } else {
        triageType = "observe";
        recTitle = "OBSERVATION ONLY: Antivenom not currently indicated.";
        recText = "NO SYSTEMIC ENVENOMING DETECTED — Proceed with Structured Inpatient Observation";
        recSubtitle = "No systemic signs or rapid local swelling. Repeat 20WBCT at 30 minutes, 2h, and 6h. Monitor vitals.";
      }

      // Persist Clinical Assessment via Next.js Server Action with Physician RBAC
      const currentRole = getClientRole();
      try {
        await recordTriageAssessmentAction(
          caseId,
          {
            rawInputs: { bypass, news2, who },
            calculatedOutputs: {
              news2Score: calculatedNews2Score,
              isLayer1Active,
              isWhoAntivenomPositive,
              triageType,
            },
            recommendation: recTitle,
            vialsAdministered: triageType === "observe" ? 0 : requiredVials,
          },
          currentRole
        );
      } catch (saErr) {
        console.warn("Server action record triage note:", saErr);
      }

      await new Promise((resolve) => setTimeout(resolve, 600));

      setResult({
        assessmentId: `ASSESS-${Date.now().toString(36).toUpperCase()}`,
        type: triageType,
        title: recTitle,
        recommendation: recText,
        subtitle: recSubtitle,
        vialsAuthorized: triageType === "observe" ? 0 : requiredVials,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErrorMessage("Error computing clinical triage assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Inpatient Ward Disposition & Case Closure
  const handleCloseCaseOutcome = async () => {
    if (isCaseClosed) return;
    setSubmittingOutcome(true);

    const isDischargeOrDeceased =
      outcomeSelection === "Discharged Stable" || outcomeSelection === "Deceased";
    const currentRole = getClientRole();

    try {
      await updateCaseStateAction(
        caseId,
        isDischargeOrDeceased ? "CLOSED" : "ADMITTED_INPATIENT",
        {
          clinicalOutcome: outcomeSelection,
          outcomeNotes: clinicalNotes,
          vialsAdministered: (demoData?.victimCount || 1) > 1 ? 12 : 6,
        },
        currentRole
      );
    } catch (saErr) {
      console.warn("Server action update state note:", saErr);
    }

    try {
      const existing = localStorage.getItem("bite2care_demo_data");
      const cur = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        "bite2care_demo_data",
        JSON.stringify({
          ...cur,
          clinicalOutcome: outcomeSelection,
          outcomeNotes: clinicalNotes,
          state: isDischargeOrDeceased ? "CLOSED" : "ADMITTED_INPATIENT",
        })
      );
    } catch (e) {}

    setTimeout(() => {
      router.push(
        `/cases/${caseId}/manage?${isDischargeOrDeceased ? "closed=true" : "inpatient=true"}`
      );
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                Clinical Portal: Handover &amp; Assessment
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Case Ref: <span className="font-mono font-bold text-slate-800">{caseId}</span>
              </span>
            </div>
            <Link
              href={`/cases/${caseId}/manage`}
              className="text-xs text-brand-teal-800 hover:text-brand-teal-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              &larr; Return to Case Coordination
            </Link>
          </div>

          {/* Attending Physician Portal Banner */}
          <div className="bg-brand-teal-900 text-white font-bold p-3.5 rounded-xl mb-4 border border-brand-teal-800 shadow-md flex items-center justify-between gap-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-base">👨‍⚕️</span>
              <span>
                ATTENDING CLINICIAN PORTAL:{" "}
                {(demoData as any)?.facilityName ||
                  (demoData as any)?.selectedFacility?.facilityName ||
                  (demoData as any)?.selectedFacility?.destinationFacilityName ||
                  "Receiving Healthcare Facility"}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-brand-gold-500 text-slate-900 uppercase">
              Inpatient Handover
            </span>
          </div>

          {/* BACKEND & FRONTEND IMMUTABILITY LOCK: Rendered when case is CLOSED */}
          {isCaseClosed && (
            <div className="mb-4 p-4 bg-emerald-950 border-2 border-emerald-500 rounded-xl text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div>
                  <h3 className="text-sm font-extrabold text-brand-gold-400 uppercase tracking-wider">
                    CASE CLOSED &amp; LOCKED &bull; IMMUTABLE CLINICAL AUDIT RECORD
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5">
                    This medical emergency episode is officially closed and archived. All physiological parameters, scores, and antivenom authorization records are locked against further modification for regulatory audit integrity.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 border border-emerald-400 shadow-sm">
                Audit Read-Only
              </span>
            </div>
          )}

          {/* Patient Demographics Intake Summary Bar */}
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-slate-700">
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Victim Demographics:</span>
              <span className="font-bold text-slate-900">
                {demoData?.age || "28"} {(demoData?.ageUnit || "Years")} &bull;{" "}
                {(demoData?.sex || demoData?.patientSex || "Male").toUpperCase()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Pregnancy Status:</span>
              <span className={`font-bold ${isPregnant ? "text-amber-800" : "text-slate-900"}`}>
                {isPregnant
                  ? "Pregnant (High-Risk Protocol)"
                  : demoData?.pregnancy || demoData?.pregnancyStatus || "Not Pregnant / NA"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Incident Location:</span>
              <span className="font-bold text-slate-900">
                {demoData.location || "Site of Incident"}, {demoData.country || "Nigeria"}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px] font-medium">Suspected Snake:</span>
              <span className="font-bold text-brand-teal-900">
                {demoData.snake || demoData.suspectedSnake || "West African Carpet Viper"}
              </span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Snakebite Clinical Decision &amp; Referral Engine
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluate immediate bypass red flags, physiological deterioration (NEWS2), and WHO antivenom criteria. Keep each established construct visible and transparent.
          </p>
        </div>

        {/* Dynamic Triage Output Banner */}
        {result && (
          <div
            className={`mb-8 p-6 rounded-2xl shadow-xl border-2 animate-fadeIn ${
              result.type === "critical"
                ? "bg-red-950 border-red-600 text-white"
                : result.type === "authorized"
                ? "bg-brand-teal-950 border-brand-teal-600 text-white"
                : "bg-amber-950 border-amber-600 text-white"
            }`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${
                    result.type === "critical"
                      ? "bg-red-600 text-white"
                      : result.type === "authorized"
                      ? "bg-brand-gold-500 text-slate-900"
                      : "bg-amber-500 text-slate-900"
                  }`}
                >
                  {result.type === "critical" ? "🚨" : result.type === "authorized" ? "✓" : "⚠️"}
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider ${
                      result.type === "critical"
                        ? "bg-red-600 text-white"
                        : result.type === "authorized"
                        ? "bg-brand-gold-500 text-slate-900"
                        : "bg-amber-500 text-slate-900"
                    }`}
                  >
                    {result.type === "critical"
                      ? "CRITICAL RED FLAG ESCALATION"
                      : result.type === "authorized"
                      ? "ANTIVENOM AUTHORIZED"
                      : "OBSERVATION PROTOCOL"}
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    Assessment ID: {result.assessmentId}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white">
                  {result.title}
                </h3>

                <div
                  className={`mt-3 p-4 rounded-xl border ${
                    result.type === "critical"
                      ? "bg-red-900/60 border-red-700"
                      : result.type === "authorized"
                      ? "bg-brand-teal-900/60 border-brand-teal-700"
                      : "bg-amber-900/60 border-amber-700"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-brand-gold-400">
                    Transparent Clinical Recommendation
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {result.recommendation}
                  </div>
                  <div className="text-xs text-slate-300 mt-1">
                    {result.subtitle}
                  </div>
                </div>

                {/* Inpatient Ward & Final Outcome Handover */}
                <div className="mt-6 pt-5 border-t border-white/20 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🏥</span>
                      <span>Inpatient Ward Management &amp; Longitudinal Outcome</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Serial 20WBCT monitoring, repeat antivenom dosing if uncoagulated, or ward discharge.
                    </p>
                  </div>

                  {/* Serial 20WBCT Timeline */}
                  <div className="p-3.5 bg-brand-teal-900/60 border border-brand-teal-700 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-brand-gold-400 uppercase tracking-wider block">
                      🩸 Serial 20WBCT Clotting &amp; Recovery Timeline:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-900/60 rounded border border-white/10">
                        <span className="text-slate-400 block font-semibold">0h (ER Arrival):</span>
                        <span className="text-red-400 font-bold">Uncoagulated (Dose 1: 6 Vials)</span>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded border border-white/10">
                        <span className="text-slate-400 block font-semibold">6h (Ward Check):</span>
                        <span className="text-amber-300 font-bold">Repeat 20WBCT (+4 Vials if uncoagulated)</span>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded border border-white/10">
                        <span className="text-slate-400 block font-semibold">Day 2 (24h):</span>
                        <span className="text-blue-300 font-bold">Monitor AKI &amp; Swelling</span>
                      </div>
                      <div className="p-2 bg-slate-900/60 rounded border border-white/10">
                        <span className="text-slate-400 block font-semibold">Day 3 (48h-72h):</span>
                        <span className="text-emerald-300 font-bold">Normal Clotting &rarr; Discharge</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Clinical Outcome / Ward Disposition
                      </label>
                      <select
                        value={outcomeSelection}
                        disabled={isCaseClosed}
                        onChange={(e) => setOutcomeSelection(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 font-semibold text-xs shadow-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                      >
                        <option value="Discharged Stable">Discharged Stable (Full Recovery - Day 3 Discharge)</option>
                        <option value="Admitted Inpatient">Admitted Inpatient (Multi-Day Ward Observation)</option>
                        <option value="Surgical Intervention">Surgical Intervention (Fasciotomy / Debridement)</option>
                        <option value="Referred to Higher Care">Referred to Higher Care (Tertiary ICU)</option>
                        <option value="Deceased">Deceased</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        Attending Physician Notes &amp; Follow-up Plan
                      </label>
                      <input
                        type="text"
                        value={clinicalNotes}
                        disabled={isCaseClosed}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="e.g. 20WBCT normalized at 18h. Day 7 CSC wound follow-up scheduled."
                        className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 text-xs shadow-sm focus:ring-2 focus:ring-brand-gold-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-1 space-y-3">
                    {isCaseClosed ? (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 rounded-lg text-xs text-emerald-200 font-bold flex items-center gap-2 shadow-sm">
                        <span className="text-base">🔒</span>
                        <span>
                          <strong>Ward Disposition Finalized &amp; Locked:</strong> Patient recorded as &quot;{outcomeSelection}&quot;. Record is permanently closed for audit.
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCloseCaseOutcome}
                        disabled={submittingOutcome}
                        className="w-full sm:w-auto px-6 py-3 bg-brand-gold-500 hover:bg-brand-gold-600 disabled:opacity-75 text-slate-900 text-sm font-extrabold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submittingOutcome ? (
                          <>
                            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                            <span>Saving Clinical Disposition &amp; Notifying CSC...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              {outcomeSelection === "Admitted Inpatient"
                                ? "✓ Admit to Inpatient Ward & Update Records"
                                : "✓ Submit Outcome & Discharge Patient"}
                            </span>
                            <span>&rarr;</span>
                          </>
                        )}
                      </button>
                    )}

                    {demoData.healer && (
                      <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 rounded-lg flex items-center gap-2 text-xs text-emerald-100 font-semibold shadow-sm animate-fadeIn">
                        <span className="text-base">✅</span>
                        <span>
                          <strong>Referral Confirmed:</strong> Automated $10 voucher logged for Traditional Healer:{" "}
                          <span className="text-brand-gold-400 font-bold underline">{demoData.healer}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 font-medium">
            <p className="font-bold">Error calculating triage assessment</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        {/* CLINICAL DECISION MODULE GATED BY RBAC: Physician or Admin access only */}
        <RoleGate
          allowedRoles={["PHYSICIAN", "ADMIN"]}
          title="Clinical Authorization Barrier: Attending Physician Required"
          description="Non-clinical emergency dispatchers and unassigned roles are restricted from performing inpatient clinical triage and authorizing antivenom dosages. Clinical decisions require Attending Physician or System Administrator credentials."
        >
          <form onSubmit={submit} className="space-y-8">
            <fieldset disabled={isCaseClosed} className="space-y-8">
          {/* ========================================================================= */}
          {/* LAYER 1: IN-HOSPITAL DETERIORATION & INTER-FACILITY ESCALATION */}
          {/* ========================================================================= */}
          <section className="bg-red-50/70 p-6 rounded-2xl border-2 border-red-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-600 inline-block animate-pulse"></span>
                <h2 className="text-lg font-bold text-red-950">
                  Layer 1: In-Hospital Deterioration &amp; Inter-Facility Escalation Triggers
                </h2>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white uppercase tracking-wider self-start sm:self-auto">
                Tertiary Escalation Trigger (Level 3 ICU)
              </span>
            </div>
            <p className="text-xs text-red-900 mb-4 leading-relaxed font-medium">
              This safety override monitors acute in-hospital physiological deterioration for admitted patients. Any positive trigger overrides routine ward monitoring and prompts an urgent dispatch request for an Advanced Life Support (ALS) 4WD ambulance to transfer the patient to a Level 3 Tertiary Specialist Hospital / Intensive Care Unit (ICU).
            </p>

            {/* 4 Structured Clinical Deterioration Domains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DOMAIN 1: AIRWAY, BREATHING & BULBAR COLLAPSE */}
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-red-800 border-b border-red-100 pb-1.5 flex items-center justify-between">
                  <span>🚨 Airway, Breathing &amp; Bulbar Failure</span>
                  {(bypass.airwayRespCompromise || bypass.bulbarParesis || bypass.ocularInjury) && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Active</span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.airwayRespCompromise}
                      onChange={(e) => setBypass((s) => ({ ...s, airwayRespCompromise: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong className="text-red-950">Airway / Respiratory Compromise</strong>
                      <span className="block text-[11px] text-slate-500">Impending airway collapse, inability to protect airway, or acute respiratory exhaustion</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.bulbarParesis}
                      onChange={(e) => setBypass((s) => ({ ...s, bulbarParesis: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong className="text-red-950">Severe Bulbar Paresis / Dysphagia</strong>
                      <span className="block text-[11px] text-slate-500">Pooling of oral secretions, dysarthria, or inability to swallow</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.ocularInjury}
                      onChange={(e) => setBypass((s) => ({ ...s, ocularInjury: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Severe Ocular Venom Ophthalmia</strong>
                      <span className="block text-[11px] text-slate-500">Spitting cobra venom corneal injury requiring tertiary surgical ophthalmology</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* DOMAIN 2: REFRACTORY SHOCK & CIRCULATION */}
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-red-800 border-b border-red-100 pb-1.5 flex items-center justify-between">
                  <span>❤️ Circulation &amp; Refractory Shock</span>
                  {(bypass.shockSBP_lt_90 || bypass.cardiovascularCollapse || bypass.malignantArrhythmia) && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Active</span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.shockSBP_lt_90}
                      onChange={(e) => setBypass((s) => ({ ...s, shockSBP_lt_90: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong className="text-red-950">Refractory Shock (SBP &lt; 90 mmHg)</strong>
                      <span className="block text-[11px] text-slate-500">Persistent hypotension refractory to 20 mL/kg fluid bolus with cold peripheries</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.cardiovascularCollapse}
                      onChange={(e) => setBypass((s) => ({ ...s, cardiovascularCollapse: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Cardiovascular Collapse</strong>
                      <span className="block text-[11px] text-slate-500">Profound systemic vasoplegia or acute cardiogenic dysfunction</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.malignantArrhythmia}
                      onChange={(e) => setBypass((s) => ({ ...s, malignantArrhythmia: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Malignant Arrhythmia</strong>
                      <span className="block text-[11px] text-slate-500">Severe sinus bradycardia (&lt;40 bpm), ventricular tachycardia, or complete AV block</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* DOMAIN 3: MAJOR UNCONTROLLED BLEEDING */}
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-red-800 border-b border-red-100 pb-1.5 flex items-center justify-between">
                  <span>🩸 Major Uncontrolled Hemorrhage</span>
                  {(bypass.majorUncontrolledBleeding || bypass.spontaneousSystemicBleeding) && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Active</span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.majorUncontrolledBleeding}
                      onChange={(e) => setBypass((s) => ({ ...s, majorUncontrolledBleeding: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong className="text-red-950">Major Uncontrolled Hemorrhage</strong>
                      <span className="block text-[11px] text-slate-500">Massive gastrointestinal bleeding, hematemesis, or suspected intracranial bleed</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.spontaneousSystemicBleeding}
                      onChange={(e) => setBypass((s) => ({ ...s, spontaneousSystemicBleeding: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Multi-Site Spontaneous Systemic Bleeding</strong>
                      <span className="block text-[11px] text-slate-500">Continuous bleeding from gums, epistaxis, gross hematuria, and venepuncture sites</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* DOMAIN 4: PROGRESSIVE NEUROLOGICAL DETERIORATION */}
              <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-red-800 border-b border-red-100 pb-1.5 flex items-center justify-between">
                  <span>🧠 Progressive Neurological Deterioration</span>
                  {(bypass.rapidNeuroDeterioration || bypass.progressiveParalysis || bypass.alteredConsciousness) && (
                    <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Active</span>
                  )}
                </div>
                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.rapidNeuroDeterioration}
                      onChange={(e) => setBypass((s) => ({ ...s, rapidNeuroDeterioration: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong className="text-red-950">Rapid Neurological Deterioration</strong>
                      <span className="block text-[11px] text-slate-500">Fast-evolving descending motor paralysis spreading to intercostal muscles</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.progressiveParalysis}
                      onChange={(e) => setBypass((s) => ({ ...s, progressiveParalysis: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Progressive Paralysis / &quot;Broken Neck&quot; Sign</strong>
                      <span className="block text-[11px] text-slate-500">Loss of neck muscle tone with inability to lift head against gravity</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bypass.alteredConsciousness}
                      onChange={(e) => setBypass((s) => ({ ...s, alteredConsciousness: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                    />
                    <span>
                      <strong>Altered Consciousness / Coma (GCS &le; 8)</strong>
                      <span className="block text-[11px] text-slate-500">Stupor, coma, or convulsive activity related to severe neurotoxicity</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Layer 1 Direct Output Banner */}
            <div className={`mt-4 p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isLayer1Active
                ? "bg-red-600 text-white border-red-700 shadow-md"
                : "bg-red-100/60 text-red-900 border-red-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">{isLayer1Active ? "🚨" : "🛡️"}</span>
                <div>
                  <span className="font-extrabold uppercase tracking-wider block">
                    OUTPUT: INTER-FACILITY TERTIARY ESCALATION &rarr; ALS 4WD AMBULANCE &bull; LEVEL 3 FMC ICU
                  </span>
                  <span className={isLayer1Active ? "text-red-100" : "text-red-800"}>
                    {isLayer1Active
                      ? "In-hospital clinical deterioration trigger active. Central Dispatch notified to mobilize an ALS 4WD ambulance for transfer to a Level 3 Tertiary Specialist Hospital."
                      : "In-hospital deterioration safety trigger. Any active flag prompts immediate inter-facility tertiary escalation."}
                  </span>
                </div>
              </div>
              {isLayer1Active && (
                <span className="px-2.5 py-1 rounded bg-white text-red-700 font-black uppercase text-[10px] whitespace-nowrap shadow-sm">
                  Tertiary Transfer Active
                </span>
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* LAYER 2: NEWS2 PHYSIOLOGICAL DETERIORATION (PDF Page 3 & 4) */}
          {/* ========================================================================= */}
          <section className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span>
                <h2 className="text-lg font-bold text-slate-900">
                  Layer 2: NEWS2 Physiological Deterioration
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full">
                  Official RCP NEWS2 (0–20)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Use the official NEWS2 scoring system unchanged. Score physiological abnormality using official Royal College of Physicians (RCP) thresholds.
            </p>

            {/* Eligibility Gate Banner */}
            {!isNews2Eligible && (
              <div className="p-3.5 bg-amber-500/15 border-2 border-amber-500 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 animate-fadeIn">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div>
                  <strong className="block font-bold">
                    NEWS2 ELIGIBILITY GATE: {isPediatric ? "Pediatric Patient (Age ≤ 16)" : "Pregnant Patient"}
                  </strong>
                  <p className="mt-0.5 text-amber-900">
                    RCP Rule: NEWS2 is not calibrated or validated for children under 16 or pregnant individuals. Physiological scores are recorded for reference, while safety gates and WHO antivenom criteria govern referral decisions.
                  </p>
                </div>
              </div>
            )}

            {/* Input Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Respiratory Rate (bpm)
                </label>
                <input
                  type="number"
                  value={news2.rr}
                  onChange={(e) => setNews2((s) => ({ ...s, rr: e.target.value }))}
                  placeholder="12–20"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">Normal: 12–20 bpm</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  SpO2 (% Oxygen Saturation)
                </label>
                <input
                  type="number"
                  value={news2.spo2}
                  onChange={(e) => setNews2((s) => ({ ...s, spo2: e.target.value }))}
                  placeholder="98"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">Scale 1 (Normal: &ge;96%)</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  value={news2.sbp}
                  onChange={(e) => setNews2((s) => ({ ...s, sbp: e.target.value }))}
                  placeholder="120"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">Normal: 111–219 mmHg</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Heart Rate / Pulse (bpm)
                </label>
                <input
                  type="number"
                  value={news2.pulse}
                  onChange={(e) => setNews2((s) => ({ ...s, pulse: e.target.value }))}
                  placeholder="76"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">Normal: 51–90 bpm</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Consciousness (ACVPU)
                </label>
                <select
                  value={news2.acvpu}
                  onChange={(e) => setNews2((s) => ({ ...s, acvpu: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                >
                  <option value="A">Alert (A - 0 pts)</option>
                  <option value="C">New Confusion (C - 3 pts)</option>
                  <option value="V">Voice Response (V - 3 pts)</option>
                  <option value="P">Pain Response (P - 3 pts)</option>
                  <option value="U">Unresponsive (U - 3 pts)</option>
                </select>
                <span className="text-[11px] text-slate-500 block mt-0.5">New confusion scores 3 pts</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Temperature (°C)
                </label>
                <input
                  type="text"
                  value={news2.temperature}
                  onChange={(e) => setNews2((s) => ({ ...s, temperature: e.target.value }))}
                  placeholder="36.8"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">Normal: 36.1–38.0 °C</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={news2.supplementalO2}
                  onChange={(e) => setNews2((s) => ({ ...s, supplementalO2: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>Patient requires Supplemental Oxygen (+2 points)</span>
              </label>
            </div>

            {/* Calculated NEWS2 Score Card & Escalation Band (PDF Page 4) */}
            <div className="mt-3 p-4 bg-white border border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    NEWS2 Calculated Total:
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-sm font-black bg-blue-900 text-white font-mono">
                    {calculatedNews2Score} / 20
                  </span>
                  {hasSingle3 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Single Parameter = 3 Trigger
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {calculatedNews2Score === 0 && "Score 0: Routine monitoring &bull; Local / appropriate facility"}
                  {calculatedNews2Score >= 1 && calculatedNews2Score <= 4 && !hasSingle3 && "Score 1–4: Low Risk &bull; Clinical review / increased observation"}
                  {(calculatedNews2Score >= 5 || hasSingle3) && calculatedNews2Score < 7 && "Score ≥5 or single 3: Medium Risk (Urgent clinical assessment) &bull; REFERRAL to Hospital"}
                  {calculatedNews2Score >= 7 && "Score ≥7: High Risk (Emergency response threshold) &bull; REFERRAL to Critical-Care Capable Facility"}
                </p>
              </div>

              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                  calculatedNews2Score >= 7
                    ? "bg-red-600 text-white"
                    : calculatedNews2Score >= 5 || hasSingle3
                    ? "bg-amber-500 text-slate-950"
                    : calculatedNews2Score >= 1
                    ? "bg-blue-100 text-blue-900"
                    : "bg-emerald-100 text-emerald-900"
                }`}>
                  {calculatedNews2Score >= 7
                    ? "Critical Care Facility Required"
                    : calculatedNews2Score >= 5 || hasSingle3
                    ? "Hospital Referral Triggered"
                    : "Routine Monitoring"}
                </span>
              </div>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* LAYER 3: WHO ANTIVENOM INDICATION CRITERIA (PDF Page 9 & 14) */}
          {/* ========================================================================= */}
          <section className="bg-teal-50/70 p-6 rounded-2xl border-2 border-teal-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-600 inline-block"></span>
                <h2 className="text-lg font-bold text-teal-950">
                  Layer 3: WHO Antivenom Indication Criteria
                </h2>
              </div>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold bg-teal-700 text-white uppercase tracking-wider self-start sm:self-auto">
                Treatment Indication Layer
              </span>
            </div>

            <p className="text-xs text-teal-900 leading-relaxed font-medium">
              This is a parallel rule-based pathway. It does NOT add points to Dart or NEWS2. Any one positive criterion confirms indication for antivenom administration.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SYSTEMIC ENVENOMING */}
              <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-teal-900 border-b border-teal-100 pb-1.5 flex items-center justify-between">
                  <span>🩸 Systemic Envenoming Indications</span>
                  {(who.wbctBleeding || who.neurotoxicity || who.cardiovascularAbnormality || who.acuteRenalFailure) && (
                    <span className="text-[10px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-bold">Positive</span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.wbctBleeding}
                      onChange={(e) => setWho((s) => ({ ...s, wbctBleeding: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Incoagulable blood / abnormal 20WBCT OR spontaneous systemic bleeding</strong>
                      <span className="block text-[11px] text-slate-500">20-minute whole blood clotting test failed or spontaneous bleeding from gums/wounds</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.neurotoxicity}
                      onChange={(e) => setWho((s) => ({ ...s, neurotoxicity: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Neurotoxic signs</strong>
                      <span className="block text-[11px] text-slate-500">Ptosis (drooping eyelids), external ophthalmoplegia, bulbar weakness, progressive paralysis</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.cardiovascularAbnormality}
                      onChange={(e) => setWho((s) => ({ ...s, cardiovascularAbnormality: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Cardiovascular abnormalities</strong>
                      <span className="block text-[11px] text-slate-500">Hypotension, shock, cardiac arrhythmia, or abnormal ECG</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.acuteRenalFailure}
                      onChange={(e) => setWho((s) => ({ ...s, acuteRenalFailure: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Acute renal failure / Dark brown urine</strong>
                      <span className="block text-[11px] text-slate-500">Oliguria, dark cola urine (hemoglobinuria/myoglobinuria), or acute kidney injury</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* LOCAL ENVENOMING */}
              <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-sm space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-teal-900 border-b border-teal-100 pb-1.5 flex items-center justify-between">
                  <span>📍 Local Envenoming Indications</span>
                  {(who.swellingHalfLimb || who.swellingDigits || who.rapidProgression || who.childNonMinor) && (
                    <span className="text-[10px] bg-teal-100 text-teal-900 px-1.5 py-0.5 rounded font-bold">Positive</span>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.swellingHalfLimb}
                      onChange={(e) => setWho((s) => ({ ...s, swellingHalfLimb: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Swelling involving &gt; ½ of the bitten limb</strong>
                      <span className="block text-[11px] text-slate-500">In the absence of a tourniquet</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.swellingDigits}
                      onChange={(e) => setWho((s) => ({ ...s, swellingDigits: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Swelling after bites on digits (fingers &amp; toes)</strong>
                      <span className="block text-[11px] text-slate-500">High risk of local ischemic necrosis and compartment syndrome</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.rapidProgression}
                      onChange={(e) => setWho((s) => ({ ...s, rapidProgression: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Rapid extension of local swelling</strong>
                      <span className="block text-[11px] text-slate-500">Extending beyond wrist or ankle within a few hours after hand/foot bites</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-slate-900 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={who.childNonMinor}
                      onChange={(e) => setWho((s) => ({ ...s, childNonMinor: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span>
                      <strong className="text-teal-950">Child with anything other than a most minor bite</strong>
                      <span className="block text-[11px] text-slate-500">Low body mass leads to severe venom-to-weight concentration</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* WHO Output Indicator */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
              isWhoAntivenomPositive
                ? "bg-teal-700 text-white border-teal-800 shadow-md"
                : "bg-teal-100/60 text-teal-950 border-teal-200"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-base">{isWhoAntivenomPositive ? "💉" : "📋"}</span>
                <div>
                  <span className="font-extrabold uppercase tracking-wider block">
                    {isWhoAntivenomPositive
                      ? "ANY ONE POSITIVE &rarr; ANTIVENOM INDICATION = YES"
                      : "NO WHO CRITERIA ACTIVE &rarr; OBSERVATION PROTOCOL"}
                  </span>
                  <span className={isWhoAntivenomPositive ? "text-teal-100" : "text-teal-800"}>
                    {isWhoAntivenomPositive
                      ? "Start antivenom (after s/c adrenaline 2.5mg if indicated) and/or transfer to appropriate treatment centre."
                      : "Perform serial 20WBCT every 30 minutes and monitor for ascending local swelling."}
                  </span>
                </div>
              </div>

              {isWhoAntivenomPositive && (
                <span className="px-2.5 py-1 rounded bg-brand-gold-500 text-slate-900 font-black uppercase text-[10px] whitespace-nowrap shadow-sm">
                  Antivenom Indicated
                </span>
              )}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* PRIMARY FORM SUBMIT ACTION BUTTON */}
          {/* ========================================================================= */}
          <div className="pt-2">
            {isCaseClosed ? (
              <div className="w-full bg-slate-100 border-2 border-slate-300 text-slate-700 font-extrabold py-4 rounded-xl text-center text-sm flex items-center justify-center gap-2 shadow-sm">
                <span>🔒 Medical Case Closed &amp; Locked: Read-Only Clinical Audit Mode</span>
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/60 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-base"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Synthesizing Referral &amp; Antivenom Authorization...</span>
                  </>
                ) : (
                  <>
                    <span>💉 Authorize Antivenom &amp; Generate Clinical Referral Decision</span>
                    <span>&rarr;</span>
                  </>
                )}
              </button>
            )}
          </div>
            </fieldset>
          </form>
        </RoleGate>
      </div>
    </div>
  );
}



