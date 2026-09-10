"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface FacilityItem {
  id: string;
  name: string;
  capabilityLevel: number;
  hasIcuHdu: boolean;
  canDo20WBCT: boolean;
  state: string;
  lga: string;
  address: string;
  phone: string;
  antivenomStatus: string;
  quantity: number;
  coldChainVerified: boolean;
  antivenomBrands: string;
  lastUpdated: string;
}

export default function FacilitiesDirectoryPage() {
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("ALL");

  // Onboarding Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [onboardSuccess, setOnboardSuccess] = useState<string | null>(null);
  const [newFacility, setNewFacility] = useState({
    name: "",
    capabilityLevel: 1,
    hasIcuHdu: false,
    canDo20WBCT: true,
    initialQuantity: 10,
    state: "Nasarawa",
    lga: "Keffi",
    address: "",
    phone: "",
    coldChainVerified: true,
  });

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/facilities");
      const json = await res.json();
      if (json.success && json.facilities) {
        setFacilities(json.facilities);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacility.name.trim()) return;

    setSubmittingNew(true);
    setOnboardSuccess(null);

    try {
      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFacility),
      });
      const json = await res.json();
      if (json.success) {
        setOnboardSuccess(`Successfully onboarded "${newFacility.name}" into the regional emergency network!`);
        fetchFacilities();
        setTimeout(() => {
          setIsModalOpen(false);
          setOnboardSuccess(null);
          setNewFacility({
            name: "",
            capabilityLevel: 1,
            hasIcuHdu: false,
            canDo20WBCT: true,
            initialQuantity: 10,
            state: "Nasarawa",
            lga: "Keffi",
            address: "",
            phone: "",
            coldChainVerified: true,
          });
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNew(false);
    }
  };

  // Filter facilities
  const filteredFacilities = facilities.filter((f) => {
    const matchesLevel =
      selectedLevel === "ALL" ||
      (selectedLevel === "LEVEL_3" && f.capabilityLevel === 3) ||
      (selectedLevel === "LEVEL_2" && f.capabilityLevel === 2) ||
      (selectedLevel === "LEVEL_1" && f.capabilityLevel === 1) ||
      (selectedLevel === "HUB" && f.name.toLowerCase().includes("hub"));

    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "IN_STOCK" && f.quantity > 5) ||
      (stockFilter === "LOW" && f.quantity > 0 && f.quantity <= 5) ||
      (stockFilter === "OUT_OF_STOCK" && f.quantity === 0);

    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.lga.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesLevel && matchesStock && matchesSearch;
  });

  const totalVials = facilities.reduce((sum, f) => sum + (f.quantity || 0), 0);
  const totalIcuReady = facilities.filter((f) => f.hasIcuHdu).length;
  const totalInStock = facilities.filter((f) => f.quantity > 5).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-gold-500 text-slate-900">
                Regional Health Network
              </span>
              <span className="text-xs text-slate-500 font-medium">Healthcare Facility Directory &amp; Stock</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Registered Facilities &amp; Antivenom Grid
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Real-time monitoring of facility capability tiers, cold chain readiness, ICU beds, and live antivenom vial reserves across the district.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-brand-teal-800 hover:bg-brand-teal-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>➕ Onboard New Facility</span>
            </button>
            <Link
              href="/activate"
              className="px-4 py-2.5 bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>🚨 Activate Emergency Case</span>
            </Link>
          </div>
        </div>

        {/* Network Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Registered Facilities
            </span>
            <div className="text-2xl font-black text-slate-900">{facilities.length}</div>
            <span className="text-[11px] text-slate-500">Across active clusters</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Total Vials in Grid
            </span>
            <div className="text-2xl font-black text-emerald-900">{totalVials}</div>
            <span className="text-[11px] text-emerald-700">Verified cold chain stock</span>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
              ICU / HDU Resuscitation
            </span>
            <div className="text-2xl font-black text-blue-900">{totalIcuReady}</div>
            <span className="text-[11px] text-blue-700">Level 2/3 Specialist Centres</span>
          </div>

          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
              Stock Readiness
            </span>
            <div className="text-2xl font-black text-amber-900">{totalInStock} / {facilities.length}</div>
            <span className="text-[11px] text-amber-700">Centres fully stocked</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white shadow-sm rounded-xl p-4 border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tier Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          {[
            { id: "ALL", label: "All Facilities" },
            { id: "LEVEL_3", label: "Level 3 Specialist" },
            { id: "LEVEL_2", label: "Level 2 General" },
            { id: "LEVEL_1", label: "Level 1 PHC" },
            { id: "HUB", label: "Depository Hubs" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedLevel(tab.id)}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                selectedLevel === tab.id
                  ? "bg-brand-teal-800 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input & Stock Dropdown */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by facility, LGA, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
          />

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-slate-50 text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt;5 Vials)</option>
            <option value="LOW">Low Stock (1-5 Vials)</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-brand-teal-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-medium">Loading regional facility telemetry...</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">No healthcare facilities match your filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedLevel("ALL");
              setStockFilter("ALL");
              setSearchQuery("");
            }}
            className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFacilities.map((fac) => {
            const isLevel3 = fac.capabilityLevel === 3;
            const isLevel2 = fac.capabilityLevel === 2;
            const isHub = fac.name.toLowerCase().includes("hub");
            const isStocked = fac.quantity > 5;
            const isLow = fac.quantity > 0 && fac.quantity <= 5;
            const isOut = fac.quantity === 0;

            return (
              <div
                key={fac.id}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHub
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : isLevel3
                            ? "bg-brand-teal-900 text-brand-gold-500 font-extrabold"
                            : isLevel2
                            ? "bg-blue-100 text-blue-800 font-bold border border-blue-200"
                            : "bg-slate-100 text-slate-700 font-bold border border-slate-200"
                        }`}
                      >
                        {isHub
                          ? "📦 Depository Hub"
                          : `Level ${fac.capabilityLevel} ${isLevel3 ? "Specialist Centre" : isLevel2 ? "General Hospital" : "Primary Health Care"}`}
                      </span>

                      {fac.hasIcuHdu && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          🫁 ICU / HDU
                        </span>
                      )}

                      {fac.canDo20WBCT && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          🩸 20WBCT Clotting
                        </span>
                      )}
                    </div>

                    {/* Stock Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                        isStocked
                          ? "bg-emerald-600 text-white"
                          : isLow
                          ? "bg-amber-500 text-slate-900"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {fac.quantity} Vials {isStocked ? "In Stock" : isLow ? "(Low)" : "(Out)"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{fac.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    📍 {fac.address}, {fac.lga}, {fac.state}
                  </p>

                  {/* Details Grid */}
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Brands:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[220px]">
                        {fac.antivenomBrands}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Emergency Phone:</span>
                      <span className="font-mono font-semibold text-slate-900">{fac.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cold Chain Verified:</span>
                      <span className={fac.coldChainVerified ? "text-emerald-700 font-semibold" : "text-red-600 font-semibold"}>
                        {fac.coldChainVerified ? "✓ Solar Refrigerator Online" : "⚠️ Power Dependent"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Updated {new Date(fac.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/facility/${fac.id}/readiness`}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-brand-teal-800 hover:text-white text-slate-800 font-bold rounded-md transition-all cursor-pointer"
                    >
                      ⚡ Quick Stock Log
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboard Facility Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Onboard Healthcare Facility</h3>
                <p className="text-xs text-slate-500">Add a new clinic or hospital into the emergency dispatch grid.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {onboardSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold text-center animate-fadeIn">
                ✓ {onboardSuccess}
              </div>
            ) : (
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Facility Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kokona Comprehensive Health Centre"
                    value={newFacility.name}
                    onChange={(e) => setNewFacility({ ...newFacility, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Capability Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newFacility.capabilityLevel}
                      onChange={(e) => setNewFacility({ ...newFacility, capabilityLevel: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                    >
                      <option value={1}>Level 1 - Primary Health Centre (PHC)</option>
                      <option value={2}>Level 2 - General / District Hospital</option>
                      <option value={3}>Level 3 - Central Specialist Centre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">
                      Initial Antivenom Stock (Vials) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newFacility.initialQuantity}
                      onChange={(e) => setNewFacility({ ...newFacility, initialQuantity: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">State</label>
                    <input
                      type="text"
                      value={newFacility.state}
                      onChange={(e) => setNewFacility({ ...newFacility, state: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">LGA / District</label>
                    <input
                      type="text"
                      placeholder="e.g. Keffi"
                      value={newFacility.lga}
                      onChange={(e) => setNewFacility({ ...newFacility, lga: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">Emergency Telephone Hotline</label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={newFacility.phone}
                    onChange={(e) => setNewFacility({ ...newFacility, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                  />
                </div>

                {/* Capability Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={newFacility.hasIcuHdu}
                      onChange={(e) => setNewFacility({ ...newFacility, hasIcuHdu: e.target.checked })}
                      className="w-4 h-4 text-brand-teal-800 rounded border-slate-300 focus:ring-brand-teal-700 cursor-pointer"
                    />
                    <span>Has Dedicated ICU / HDU Resuscitation Unit</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={newFacility.canDo20WBCT}
                      onChange={(e) => setNewFacility({ ...newFacility, canDo20WBCT: e.target.checked })}
                      className="w-4 h-4 text-brand-teal-800 rounded border-slate-300 focus:ring-brand-teal-700 cursor-pointer"
                    />
                    <span>Equipped with 20-Minute Whole Blood Clotting Test (20WBCT) Kits</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={newFacility.coldChainVerified}
                      onChange={(e) => setNewFacility({ ...newFacility, coldChainVerified: e.target.checked })}
                      className="w-4 h-4 text-brand-teal-800 rounded border-slate-300 focus:ring-brand-teal-700 cursor-pointer"
                    />
                    <span>Verified Solar / Generator Continuous Cold Chain Storage</span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNew}
                    className="px-5 py-2 bg-brand-teal-800 hover:bg-brand-teal-700 disabled:opacity-75 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {submittingNew ? "Registering..." : "Confirm & Onboard Facility"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
