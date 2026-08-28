import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Presentation Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 sm:p-12 mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal-900 text-brand-gold-500 border border-brand-gold-500/30">
            <span className="w-2 h-2 rounded-full bg-brand-gold-500 animate-pulse"></span>
            Bite2Care MVP Platform
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-gold-500 text-slate-900">
            Dynamic Treatment Rendezvous
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Rapid Emergency Response &amp; Intelligent Antivenom Routing
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-3xl leading-relaxed">
          Coordinating the fastest safe way to bring the patient, capable care, verified antivenom, and mapped transport together &mdash; featuring <strong>Dynamic Treatment Rendezvous (Reverse Logistics)</strong>, <strong>USSD frontline intake</strong>, and <strong>transparent 4-layer clinical safety gates</strong>.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/activate"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-brand-teal-800 hover:bg-brand-teal-700 text-white font-semibold text-base rounded-lg shadow-md transition-all cursor-pointer"
          >
            Activate Emergency Case &rarr;
          </Link>
          <Link
            href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
            className="inline-flex items-center justify-center px-6 py-3.5 bg-white hover:bg-slate-100 text-brand-teal-900 font-semibold text-base rounded-lg transition-colors border border-brand-teal-800/30 shadow-sm"
          >
            Update Hospital Readiness
          </Link>
        </div>
      </div>

      {/* 4-Step Interactive Workflow */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 mb-4">
          End-to-End Emergency Response Pipeline
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-brand-teal-900 text-brand-gold-500 font-bold flex items-center justify-center text-sm mb-3">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Case Activation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Dual intake: Web form for smartphone CSCs or <strong>interactive 2G USSD simulator</strong> (*999#) for low-bandwidth rural frontline.
            </p>
            <Link
              href="/activate"
              className="text-xs font-bold text-brand-teal-800 hover:text-brand-teal-700"
            >
              Start Intake &rarr;
            </Link>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-brand-teal-800 text-white font-bold flex items-center justify-center text-sm mb-3">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              4-Layer Clinical Gate
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Immediate Bypass safety gate, NEWS2 (with strict pediatric/pregnancy bypass), 6-domain DART score, and WHO antivenom triggers.
            </p>
            <span className="text-xs font-medium text-slate-400">
              No black-box AI scores
            </span>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-brand-gold-500 text-slate-900 font-bold flex items-center justify-center text-sm mb-3">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Dynamic Rendezvous
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ranks <strong>Option A (Direct Transport)</strong> and <strong>Option B (Reverse Logistics)</strong> moving antivenom to a nearer capable hub.
            </p>
            <span className="text-xs font-semibold text-brand-gold-600">
              48h Stale Data Penalty
            </span>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-8 h-8 rounded-lg bg-brand-teal-700 text-white font-bold flex items-center justify-center text-sm mb-3">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Handover &amp; CSC Feedback
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pre-alert confirmation, transport dispatch, clinical outcome capture (vials used), and automated closed-loop feedback to the CSC.
            </p>
            <span className="text-xs font-medium text-slate-400">
              Closed-loop resolution
            </span>
          </div>
        </div>
      </div>

      {/* Demo Facilities Quick Access */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-slate-900 text-base">
            Active Hospital Readiness Network (Pilot Sandbox)
          </h3>
          <span className="text-xs text-slate-500 font-mono">3 Verified Nodes</span>
        </div>
        <p className="text-xs text-slate-600 mb-4">
          Test real-time antivenom stock updates and 48-hour staleness penalties across the pilot facilities:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/facility/00000000-0000-0000-0000-00000000000A/readiness"
            className="p-4 bg-slate-50 hover:bg-brand-teal-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-bold text-slate-900">General Hospital A</div>
              <div className="text-slate-500 text-[11px]">Level 3 • ICU Available • In Stock</div>
            </div>
            <span className="text-brand-teal-800 font-bold">&rarr;</span>
          </Link>
          <Link
            href="/facility/00000000-0000-0000-0000-00000000000B/readiness"
            className="p-4 bg-slate-50 hover:bg-brand-teal-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-bold text-slate-900">Rural Clinic B</div>
              <div className="text-slate-500 text-[11px]">Level 2 • Nearer Node • Out of Stock (Rendezvous Target)</div>
            </div>
            <span className="text-brand-teal-800 font-bold">&rarr;</span>
          </Link>
          <Link
            href="/facility/00000000-0000-0000-0000-00000000000C/readiness"
            className="p-4 bg-slate-50 hover:bg-brand-teal-50/50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 flex justify-between items-center transition-colors"
          >
            <div>
              <div className="font-bold text-slate-900">Central Medical Hub</div>
              <div className="text-slate-500 text-[11px]">Level 3 • 50 Vials (Reverse Logistics Donor Hub)</div>
            </div>
            <span className="text-brand-teal-800 font-bold">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}



