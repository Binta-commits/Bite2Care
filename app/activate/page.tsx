"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ActivatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"web" | "ussd">("web");

  // Web Form State
  const [form, setForm] = useState({
    location: "",
    biteTime: new Date().toISOString().slice(0, 16),
    suspectedSnake: "",
    patientAge: "",
    patientSex: "male",
    pregnancyStatus: "unknown",
  });

  const [loading, setLoading] = useState(false);
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [createdChannel, setCreatedChannel] = useState<string>("WEB");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // USSD Simulator State
  const [ussdInput, setUssdInput] = useState("*999*Keffi Ward 3*28*M*VIPER#");
  const [ussdSessionText, setUssdSessionText] = useState("");
  const [ussdScreen, setUssdScreen] = useState<string>(
    "Dial *999# for interactive menu or enter quick string e.g. *999*LOCATION*AGE*SEX*SNAKE#"
  );
  const [ussdLoading, setUssdLoading] = useState(false);
  const [ussdIsEnd, setUssdIsEnd] = useState(false);

  const handleWebChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitWeb = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setCreatedCaseId(null);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, channel: "WEB" }),
      });
      const json = await res.json();
      if (json.success && json.id) {
        setCreatedCaseId(json.id);
        setCreatedChannel("WEB");
      } else {
        setErrorMessage(json.error || "Failed to create case.");
      }
    } catch (err) {
      setErrorMessage("Network error: Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const submitUssd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ussdInput.trim()) return;

    setUssdLoading(true);
    setErrorMessage(null);

    try {
      // If it's a direct *999*...# code
      const isDirect = ussdInput.startsWith("*") && ussdInput.endsWith("#") && ussdInput.split("*").length > 2;

      let payload: any = { ussdString: ussdInput };
      if (!isDirect) {
        const nextText = ussdSessionText ? `${ussdSessionText}*${ussdInput}` : ussdInput;
        payload = { text: nextText };
      }

      const res = await fetch("/api/cases/ussd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setUssdScreen(json.message);
        if (json.type === "END") {
          setUssdIsEnd(true);
          if (json.caseId) {
            setCreatedCaseId(json.caseId);
            setCreatedChannel("USSD");
          }
        } else {
          setUssdIsEnd(false);
          setUssdSessionText((prev) => (prev ? `${prev}*${ussdInput}` : ussdInput));
          setUssdInput("");
        }
      } else {
        setUssdScreen(`ERROR: ${json.error || "USSD Gateway Timeout"}`);
        setUssdIsEnd(true);
      }
    } catch (err) {
      setUssdScreen("ERROR: USSD Network Disconnected.");
      setUssdIsEnd(true);
    } finally {
      setUssdLoading(false);
    }
  };

  const resetUssd = () => {
    setUssdSessionText("");
    setUssdInput("*999*Keffi Ward 3*28*M*VIPER#");
    setUssdScreen("Dial *999# for interactive menu or enter quick string e.g. *999*LOCATION*AGE*SEX*SNAKE#");
    setUssdIsEnd(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-slate-200 mt-10">
        {/* Header */}
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold-500 text-slate-900">
                Emergency Step 1
              </span>
              <span className="text-xs text-slate-500 font-medium">Case Intake</span>
            </div>
            <span className="text-xs text-brand-teal-900 font-bold bg-slate-100 px-2 py-0.5 rounded">
              Channel: {activeTab.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Activate Emergency Case
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Initiate snakebite emergency dispatch via Web Intake or Frontline USSD/Feature Phone channel.
          </p>

          {/* Channel Tabs */}
          <div className="mt-4 flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("web")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "web"
                  ? "bg-brand-teal-800 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🌐 Smartphone / Web Portal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ussd")}
              className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === "ussd"
                  ? "bg-brand-teal-800 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📱 USSD / 2G Feature Phone Simulator
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {createdCaseId && (
          <div className="mb-6 p-5 bg-brand-teal-50 border border-brand-teal-200 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 rounded-full bg-brand-teal-800 text-brand-gold-500 flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-teal-900">
                    Emergency Case Activated ({createdChannel})!
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-gold-500 text-slate-900 uppercase">
                    State: ACTIVATED
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-1">
                  Reference ID:{" "}
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-brand-teal-200 text-brand-teal-900">
                    {createdCaseId}
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/triage/${createdCaseId}`}
                    className="inline-flex items-center justify-center px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-700 text-white text-sm font-semibold rounded-md shadow-sm transition-colors"
                  >
                    Proceed to Clinical Triage &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedCaseId(null);
                      resetUssd();
                    }}
                    className="text-xs text-brand-teal-800 hover:text-brand-teal-900 underline font-medium"
                  >
                    Activate another case
                  </button>
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

        {/* TAB 1: WEB FORM */}
        {activeTab === "web" && (
          <form onSubmit={submitWeb} className="space-y-5">
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-slate-900 mb-1"
              >
                Incident Location / Ward <span className="text-red-500">*</span>
              </label>
              <input
                id="location"
                name="location"
                type="text"
                required
                placeholder="e.g. Keffi Ward 3, Nasarawa State"
                value={form.location}
                onChange={handleWebChange}
                className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="biteTime"
                className="block text-sm font-medium text-slate-900 mb-1"
              >
                Estimated Bite Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                id="biteTime"
                type="datetime-local"
                name="biteTime"
                required
                value={form.biteTime}
                onChange={handleWebChange}
                className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="suspectedSnake"
                className="block text-sm font-medium text-slate-900 mb-1"
              >
                Suspected Snake Species (if identified)
              </label>
              <input
                id="suspectedSnake"
                type="text"
                name="suspectedSnake"
                placeholder="e.g. Carpet Viper (Echis ocellatus), Naja nigricollis, Unknown"
                value={form.suspectedSnake}
                onChange={handleWebChange}
                className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="patientAge"
                  className="block text-sm font-medium text-slate-900 mb-1"
                >
                  Patient Age <span className="text-red-500">*</span>
                </label>
                <input
                  id="patientAge"
                  type="number"
                  name="patientAge"
                  min="0"
                  max="120"
                  required
                  placeholder="Years"
                  value={form.patientAge}
                  onChange={handleWebChange}
                  className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="patientSex"
                  className="block text-sm font-medium text-slate-900 mb-1"
                >
                  Patient Sex <span className="text-red-500">*</span>
                </label>
                <select
                  id="patientSex"
                  name="patientSex"
                  value={form.patientSex}
                  onChange={handleWebChange}
                  className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="pregnancyStatus"
                  className="block text-sm font-medium text-slate-900 mb-1"
                >
                  Pregnancy Status
                </label>
                <select
                  id="pregnancyStatus"
                  name="pregnancyStatus"
                  value={form.pregnancyStatus}
                  onChange={handleWebChange}
                  className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
                >
                  <option value="unknown">Unknown / N/A</option>
                  <option value="not_pregnant">Not Pregnant</option>
                  <option value="pregnant">Pregnant</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-semibold py-3 rounded-md transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span>Submitting Case...</span>
                ) : (
                  <span>Activate Emergency Case (Web Intake)</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: USSD / 2G FEATURE PHONE SIMULATOR */}
        {activeTab === "ussd" && (
          <div className="space-y-4">
            <div className="p-3 bg-brand-gold-500/10 border border-brand-gold-500/30 rounded-md text-xs text-brand-gold-600 font-medium">
              <span className="font-bold text-slate-900">Frontline 2G Simulation: </span>
              Simulates a Community Snakebite Champion (CSC) dialing USSD on a basic Nokia/Feature phone without mobile data.
            </div>

            {/* Simulated Feature Phone LCD Screen */}
            <div className="bg-brand-teal-900 rounded-xl p-5 text-brand-gold-500 font-mono text-xs shadow-inner border border-brand-teal-800">
              <div className="flex justify-between items-center text-[10px] text-slate-300 mb-2 border-b border-brand-teal-800 pb-1">
                <span>📶 2G GSM • MTN / Airtel</span>
                <span className="font-bold text-brand-gold-500">USSD SESSION</span>
              </div>
              <pre className="whitespace-pre-wrap font-mono leading-relaxed min-h-[90px] text-emerald-300">
                {ussdScreen}
              </pre>
            </div>

            {/* USSD Input Form */}
            <form onSubmit={submitUssd} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  USSD Command / Dial Input:
                </label>
                <input
                  type="text"
                  value={ussdInput}
                  disabled={ussdIsEnd}
                  onChange={(e) => setUssdInput(e.target.value)}
                  placeholder="Enter option or quick code (e.g. *999*...#)"
                  className="w-full border border-slate-300 rounded-md p-2.5 font-mono text-sm focus:ring-2 focus:ring-brand-teal-700 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={ussdLoading || ussdIsEnd}
                  className="flex-1 bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-md text-xs transition-colors shadow-sm cursor-pointer"
                >
                  {ussdLoading ? "Dialing Telco..." : "📞 Send USSD Command"}
                </button>
                <button
                  type="button"
                  onClick={resetUssd}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md text-xs transition-colors border border-slate-300"
                >
                  Reset Session
                </button>
              </div>
            </form>

            {/* Quick Demo Pre-fill Buttons */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase mb-2">
                Presentation Quick Demo Presets:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUssdSessionText("");
                    setUssdInput("*999*Keffi Ward 3*28*M*VIPER#");
                    setUssdIsEnd(false);
                    setUssdScreen("Pre-filled direct USSD string: *999*Keffi Ward 3*28*M*VIPER#. Click 'Send USSD Command' to test!");
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-brand-teal-50/50 border border-slate-200 rounded text-xs text-slate-800"
                >
                  <span className="font-semibold text-brand-teal-800 block">⚡ Quick String Activation</span>
                  <span className="text-[10px] text-slate-500 font-mono">*999*Keffi*28*M*VIPER#</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUssdSessionText("");
                    setUssdInput("*999#");
                    setUssdIsEnd(false);
                    setUssdScreen("Dial *999# to start interactive multi-step menu.");
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-brand-teal-50/50 border border-slate-200 rounded text-xs text-slate-800"
                >
                  <span className="font-semibold text-brand-teal-800 block">📋 Interactive Menu Flow</span>
                  <span className="text-[10px] text-slate-500 font-mono">*999# (Step-by-step)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


