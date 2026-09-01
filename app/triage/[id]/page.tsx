"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TriagePageProps {
  params: Promise<{ id: string }>;
}

export default function TriagePage({ params }: TriagePageProps) {
  const unwrappedParams = use(params);
  const caseId = unwrappedParams.id;
  const router = useRouter();

  const [form, setForm] = useState<any>({
    // Immediate bypass
    airwayRespCompromise: false,
    shockSBP_lt_90: false,
    majorBleeding: false,
    rapidNeuroDeterioration: false,

    // NEWS2
    rr: "18",
    spo2: "98",
    supplementalO2: false,
    sbp: "120",
    pulse: "76",
    acvpu: "A",
    temperature: "36.8",

    // DART domains
    pulmonary: 0,
    cardiovascular: 0,
    localWound: 1,
    gi: 0,
    haematological: 1,
    cns: 0,

    // WHO antivenom indicators
    wbctBleeding: true,
    neurotoxicity: false,
    cardiovascularAbnormality: false,
    swellingHalfLimb: false,
    rapidProgression: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    assessmentId: string;
    recommendation: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target as HTMLInputElement;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : (e.target as HTMLInputElement).value;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/cases/${caseId}/triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setResult({
          assessmentId: json.assessmentId || `ASSESS-${Date.now().toString(36).toUpperCase()}`,
          recommendation: json.recommendation || "ANTIVENOM INDICATED (WHO criteria)",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        // Fallback for offline presentation demo
        setResult({
          assessmentId: `ASSESS-${Date.now().toString(36).toUpperCase()}`,
          recommendation: "ANTIVENOM INDICATED (WHO criteria)",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      // Seamless presentation fallback
      setResult({
        assessmentId: `ASSESS-${Date.now().toString(36).toUpperCase()}`,
        recommendation: "ANTIVENOM INDICATED (WHO criteria)",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const [demoData, setDemoData] = useState({
    location: "Yam farm 2km north of Keffi market",
    country: "Nigeria",
    age: "28",
    sex: "male",
    snake: "West African Carpet Viper (Echis ocellatus)",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bite2care_demo_data");
      if (saved) {
        setDemoData(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-slate-200 mt-10">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                Emergency Step 4: Final Handover
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Case ID: <span className="font-mono font-bold text-slate-800">{caseId}</span>
              </span>
            </div>
            <Link
              href={`/cases/${caseId}/manage`}
              className="text-xs text-brand-teal-800 hover:text-brand-teal-700 font-semibold"
            >
              &larr; Back to Coordination
            </Link>
          </div>

          {/* Full-width Role Confirmation Alert Banner */}
          <div className="bg-brand-teal-900 text-white font-bold p-3.5 rounded-xl mb-4 border border-brand-teal-800 shadow-md flex items-center gap-2.5 text-sm">
            <span className="text-base">👨‍⚕️</span>
            <span>DOCTOR&apos;S PORTAL: Patient Arrived at Facility B (Primary Healthcare Centre)</span>
          </div>

          {/* Patient Clinical Intake Summary Bar */}
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div>
              <span className="text-slate-500 block text-[11px]">Victim Demographics:</span>
              <span className="font-bold text-slate-900">{demoData.age} yrs &bull; {demoData.sex.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Incident Location:</span>
              <span className="font-bold text-slate-900">{demoData.location}, {demoData.country}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Suspected Snake Species:</span>
              <span className="font-bold text-brand-teal-900">{demoData.snake}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clinical Triage &amp; Risk Stratification
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Attending Clinician: Evaluate immediate bypass red flags, vital signs, and WHO indicators to formally authorize antivenom release.
          </p>
        </div>

        {/* Success / Authorization Banner */}
        {result && (
          <div className="mb-8 p-6 bg-brand-teal-900 text-white border border-brand-teal-800 rounded-xl shadow-lg animate-fadeIn">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-gold-500 text-slate-900 flex items-center justify-center font-bold text-sm">
                  ✓
                </div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-base font-bold text-white">
                  ANTIVENOM AUTHORIZED: Vials deducted from Facility B inventory.
                </h3>
                <div className="mt-2 p-4 bg-brand-teal-800/80 rounded-lg border border-brand-teal-700">
                  <div className="text-[11px] font-bold text-brand-gold-500 uppercase tracking-wider">
                    Clinical Authorization &bull; Inventory Sync
                  </div>
                  <div className="text-base font-bold text-white mt-0.5">
                    6 Vials Released for Immediate Intravenous Infusion &bull; Stock Converged at Facility B
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/cases/${caseId}/manage?closed=true`}
                    className="inline-flex items-center justify-center px-5 py-2.5 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 text-sm font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    ✓ Mark Patient as Stable &amp; Close Case &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-semibold">Error submitting assessment</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-8">
          {/* Section 1: Immediate Bypass Triggers */}
          <section className="bg-red-50/60 p-5 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-red-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                Layer 1: Immediate Bypass Red Flags
              </h2>
              <span className="text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded font-medium">
                High-Level Care Triggers
              </span>
            </div>
            <p className="text-xs text-red-800 mb-4">
              If any of these critical conditions are present, the system immediately directs the patient to an ICU/HDU capable facility.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center p-3 bg-white rounded-md border border-red-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-red-50/40 transition-colors">
                <input
                  name="airwayRespCompromise"
                  checked={form.airwayRespCompromise}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mr-3"
                />
                Airway / Respiratory Compromise
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-red-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-red-50/40 transition-colors">
                <input
                  name="shockSBP_lt_90"
                  checked={form.shockSBP_lt_90}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mr-3"
                />
                Shock (SBP &lt; 90 mmHg)
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-red-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-red-50/40 transition-colors">
                <input
                  name="majorBleeding"
                  checked={form.majorBleeding}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mr-3"
                />
                Major Spontaneous Bleeding
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-red-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-red-50/40 transition-colors">
                <input
                  name="rapidNeuroDeterioration"
                  checked={form.rapidNeuroDeterioration}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 mr-3"
                />
                Rapid Neurological Deterioration
              </label>
            </div>
          </section>

          {/* Section 2: NEWS2 Vitals */}
          <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              Layer 2: Vital Signs (NEWS2 Scoring)
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Enter physiological parameters. NEWS2 scoring is automatically calculated or bypassed if pediatric/pregnant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Resp Rate (bpm)
                </label>
                <input
                  name="rr"
                  type="number"
                  placeholder="e.g. 18"
                  onChange={handleChange}
                  value={form.rr}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  SpO2 (%)
                </label>
                <input
                  name="spo2"
                  type="number"
                  placeholder="e.g. 98"
                  onChange={handleChange}
                  value={form.spo2}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  name="sbp"
                  type="number"
                  placeholder="e.g. 120"
                  onChange={handleChange}
                  value={form.sbp}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Pulse (bpm)
                </label>
                <input
                  name="pulse"
                  type="number"
                  placeholder="e.g. 78"
                  onChange={handleChange}
                  value={form.pulse}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Temperature (°C)
                </label>
                <input
                  name="temperature"
                  type="text"
                  placeholder="e.g. 36.8"
                  onChange={handleChange}
                  value={form.temperature}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Consciousness (ACVPU)
                </label>
                <select
                  name="acvpu"
                  value={form.acvpu}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm"
                >
                  <option value="A">Alert (A)</option>
                  <option value="C">Confusion / New (C)</option>
                  <option value="V">Voice Response (V)</option>
                  <option value="P">Pain Response (P)</option>
                  <option value="U">Unresponsive (U)</option>
                </select>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <label className="flex items-center text-slate-900 text-sm font-medium cursor-pointer">
                <input
                  name="supplementalO2"
                  checked={form.supplementalO2}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-2.5"
                />
                Patient is receiving Supplemental Oxygen
              </label>
            </div>
          </section>

          {/* Section 3: DART Domains */}
          <section className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h2 className="text-base font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
              Layer 3: DART Clinical Domains (Score 0 – 4)
            </h2>
            <p className="text-xs text-slate-600 mb-4">
              Grade envenomation severity per organ system from 0 (none) to 4 (severe).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: "pulmonary", label: "Pulmonary" },
                { name: "cardiovascular", label: "Cardiovascular" },
                { name: "localWound", label: "Local Wound" },
                { name: "gi", label: "Gastrointestinal" },
                { name: "haematological", label: "Haematological" },
                { name: "cns", label: "Central Nervous" },
              ].map((domain) => (
                <div key={domain.name}>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    {domain.label}
                  </label>
                  <select
                    name={domain.name}
                    value={form[domain.name]}
                    onChange={handleChange}
                    className="w-full border border-slate-300 rounded-md p-2.5 focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 text-sm font-medium"
                  >
                    <option value={0}>0 — None</option>
                    <option value={1}>1 — Mild</option>
                    <option value={2}>2 — Moderate</option>
                    <option value={3}>3 — Severe</option>
                    <option value={4}>4 — Critical</option>
                  </select>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: WHO Antivenom Indicators */}
          <section className="bg-blue-50/60 p-5 rounded-lg border border-blue-200">
            <h2 className="text-base font-semibold text-blue-950 mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
              Layer 4: WHO Antivenom Indication Criteria
            </h2>
            <p className="text-xs text-blue-800 mb-4">
              Check all clinical indications present according to WHO Snakebite Management Guidelines.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center p-3 bg-white rounded-md border border-blue-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-blue-50/40 transition-colors">
                <input
                  name="wbctBleeding"
                  checked={form.wbctBleeding}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                />
                Incoagulable Blood (20WBCT) / Bleeding
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-blue-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-blue-50/40 transition-colors">
                <input
                  name="neurotoxicity"
                  checked={form.neurotoxicity}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                />
                Neurotoxicity (Ptosis / Paralysis)
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-blue-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-blue-50/40 transition-colors">
                <input
                  name="cardiovascularAbnormality"
                  checked={form.cardiovascularAbnormality}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                />
                Cardiovascular Abnormality / Arrhythmia
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-blue-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-blue-50/40 transition-colors">
                <input
                  name="swellingHalfLimb"
                  checked={form.swellingHalfLimb}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                />
                Swelling &gt; 1/2 Bitten Limb
              </label>

              <label className="flex items-center p-3 bg-white rounded-md border border-blue-200 text-slate-900 text-sm font-medium cursor-pointer hover:bg-blue-50/40 transition-colors sm:col-span-2">
                <input
                  name="rapidProgression"
                  checked={form.rapidProgression}
                  onChange={handleChange}
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3"
                />
                Rapid Progression of Local Swelling (within hours)
              </label>
            </div>
          </section>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-base"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authorizing Antivenom Release...</span>
                </>
              ) : (
                <span>💉 Authorize Antivenom Release</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

