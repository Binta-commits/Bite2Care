"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PathwayComparisonProps {
  caseId: string;
  channel?: string;
  location?: string;
  country?: string;
  onReset?: () => void;
}

export default function PathwayComparison({
  caseId,
  channel = "WEB",
  location = "Site of Incident",
  country = "Nigeria",
  onReset,
}: PathwayComparisonProps) {
  const router = useRouter();
  const [selectedPathway, setSelectedPathway] = useState<"rendezvous" | "direct">("rendezvous");
  const [isMobilizing, setIsMobilizing] = useState(false);

  const handleConfirmMobilization = () => {
    setIsMobilizing(true);
    try {
      const existing = localStorage.getItem("bite2care_demo_data");
      const current = existing ? JSON.parse(existing) : {};
      localStorage.setItem(
        "bite2care_demo_data",
        JSON.stringify({
          location: current.location || location,
          country: current.country || country,
          age: current.age || "28",
          sex: current.sex || "male",
          snake: current.snake || "West African Carpet Viper (Echis ocellatus)",
        })
      );
    } catch (e) {}

    setTimeout(() => {
      router.push(`/cases/${caseId}/match`);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Reference ID Banner */}
      <div className="p-4 bg-brand-teal-900 text-white rounded-xl shadow-md border border-brand-teal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-gold-500 text-slate-900 flex items-center justify-center font-bold text-lg shadow-sm">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold-500">
                Case Activated ({channel})
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase">
                Ready for Dispatch
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-white mt-0.5">
              Ref ID: <span className="text-brand-gold-500">{caseId}</span>
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-300 hover:text-white underline font-medium self-start sm:self-auto cursor-pointer"
          >
            ← Activate Another Case
          </button>
        )}
      </div>

      {/* Main Pathway Engine Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
            ⚡ Real-Time Optimization
          </span>
          <span className="text-xs text-slate-500 font-medium">Logistics &amp; Inventory Engine</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Pathway Comparison Engine: Evaluating Fastest Safe Routes
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          The engine evaluated direct transit vs. a synchronized stock rendezvous to minimize time to first antivenom vial.
        </p>
      </div>

      {/* Choice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CARD 1 (OPTION A): DIRECT TO STOCKED FACILITY */}
        <div
          onClick={() => setSelectedPathway("direct")}
          className={`rounded-xl p-5 transition-all cursor-pointer border flex flex-col justify-between ${
            selectedPathway === "direct"
              ? "border-2 border-slate-700 bg-slate-50 shadow-md ring-1 ring-slate-400"
              : "border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm"
          }`}
        >
          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Option A
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Direct to Stocked Facility
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-slate-200 text-slate-800 font-mono font-bold text-xs">
                ⏱️ ETA: 78 Mins
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Patient travels across regional roads directly to the central hospital holding verified antivenom stock.
            </p>

            {/* Pathway Logistics Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-slate-200 pt-3 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">🏥</span>
                <div>
                  <span className="font-semibold text-slate-900">Destination:</span> Facility A (General Specialist Hospital)
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">💉</span>
                <div>
                  <span className="font-semibold text-slate-900">Antivenom Stock:</span> 14 Vials on-site (IN_STOCK)
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">🛣️</span>
                <div>
                  <span className="font-semibold text-slate-900">Transit Distance:</span> 68 km rural unpaved corridor
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">⏳</span>
                <div>
                  <span className="font-semibold text-slate-900">Time to First Vial:</span> 78 Minutes (High delay risk)
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPathway("direct");
              }}
              className={`w-full py-2 px-3 rounded-md text-xs font-semibold transition-all ${
                selectedPathway === "direct"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {selectedPathway === "direct" ? "✓ Direct Route Selected" : "Select Direct Route"}
            </button>
          </div>
        </div>

        {/* CARD 2 (OPTION B - RECOMMENDED): DYNAMIC RENDEZVOUS */}
        <div
          onClick={() => setSelectedPathway("rendezvous")}
          className={`rounded-xl p-5 transition-all cursor-pointer border flex flex-col justify-between relative ${
            selectedPathway === "rendezvous"
              ? "border-2 border-brand-teal-800 bg-brand-teal-50/50 shadow-lg ring-2 ring-brand-teal-700/30"
              : "border-brand-teal-300 bg-white hover:border-brand-teal-600 hover:shadow-md"
          }`}
        >
          {/* Top Badge */}
          <div className="absolute -top-3 right-4">
            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold bg-brand-gold-500 text-slate-900 shadow-sm border border-brand-gold-600">
              ⭐ Fastest Safe Pathway (-37 Mins)
            </span>
          </div>

          <div>
            {/* Card Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-brand-teal-800 uppercase tracking-wide">
                  Option B • Recommended
                </span>
                <h3 className="text-base font-bold text-brand-teal-900">
                  Dynamic Rendezvous
                </h3>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-brand-teal-900 text-brand-gold-500 font-mono font-bold text-xs shadow-sm">
                ⏱️ ETA: 41 Mins
              </div>
            </div>

            <p className="text-xs text-slate-700 mb-4 leading-relaxed">
              Patient travels to the nearer capable clinic, while emergency antivenom stock is simultaneously transferred via priority motorcycle dispatch from regional storage.
            </p>

            {/* Pathway Logistics Breakdown */}
            <div className="space-y-2.5 text-xs border-t border-brand-teal-200/80 pt-3 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="text-brand-teal-800 font-bold">🏥</span>
                <div>
                  <span className="font-semibold text-slate-900">Destination:</span> Facility B (Primary Healthcare Centre &mdash; 19 km)
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-brand-teal-800 font-bold">⚡</span>
                <div>
                  <span className="font-semibold text-slate-900">Stock Reallocation:</span> Hub C transferring 6 Vials via rapid motorcycle courier
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-brand-teal-800 font-bold">📍</span>
                <div>
                  <span className="font-semibold text-slate-900">Convergence:</span> Patient ETA (35m) &amp; Courier ETA (38m) synchronize at Clinic B
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <div>
                  <span className="font-bold text-emerald-800">Time to First Vial:</span>{" "}
                  <span className="font-bold text-slate-900">41 Minutes</span>{" "}
                  <span className="text-emerald-700 font-semibold">(47% reduction in time to antivenom)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-brand-teal-200">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPathway("rendezvous");
              }}
              className={`w-full py-2 px-3 rounded-md text-xs font-bold transition-all ${
                selectedPathway === "rendezvous"
                  ? "bg-brand-teal-800 text-white shadow-sm"
                  : "bg-brand-teal-100 text-brand-teal-900 hover:bg-brand-teal-200"
              }`}
            >
              {selectedPathway === "rendezvous" ? "✓ Dynamic Rendezvous Selected" : "Select Rendezvous Pathway"}
            </button>
          </div>
        </div>
      </div>

      {/* Primary Action Button Bar */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-slate-900">Selected Pathway: </span>
            {selectedPathway === "rendezvous" ? (
              <span className="text-brand-teal-900 font-semibold">
                Dynamic Rendezvous (41 Mins &bull; Facility B + Hub C Transfer)
              </span>
            ) : (
              <span className="text-slate-800 font-semibold">
                Direct Transit (78 Mins &bull; Facility A)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleConfirmMobilization}
            disabled={isMobilizing}
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/60 text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMobilizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Mobilizing Pathways &amp; Routing...</span>
              </>
            ) : (
              <>
                <span>Confirm Destination &amp; Mobilize Resources</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
