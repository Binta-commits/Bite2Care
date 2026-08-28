"use client";

import React, { useState, use } from "react";
import Link from "next/link";

interface ReadinessPageProps {
  params: Promise<{ id: string }>;
}

export default function ReadinessPage({ params }: ReadinessPageProps) {
  const unwrappedParams = use(params);
  const facilityId = unwrappedParams.id;

  const [antivenomStatus, setAntivenomStatus] = useState("IN_STOCK");
  const [quantity, setQuantity] = useState<number | "">(20);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/facilities/${facilityId}/readiness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          antivenomStatus,
          quantity: quantity === "" ? 0 : Number(quantity),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMessage("Facility readiness updated and synced with matching engine.");
      } else {
        setErrorMessage(json.error || "Failed to update readiness status.");
      }
    } catch (err) {
      setErrorMessage("Network error: Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white shadow-lg rounded-xl p-8 border border-slate-200 mt-10">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal-900 text-brand-gold-500 border border-brand-gold-500/40">
              Facility Node
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {facilityId}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Facility Readiness &amp; Stock Status
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Keep antivenom inventory and critical clinical readiness current for real-time patient routing.
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-brand-teal-50 border border-brand-teal-200 rounded-lg text-sm text-brand-teal-950 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-brand-teal-800 text-brand-gold-500 flex items-center justify-center font-bold text-xs flex-shrink-0">
              ✓
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <p className="font-semibold">Error updating readiness</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label
              htmlFor="antivenomStatus"
              className="block text-sm font-medium text-slate-900 mb-1"
            >
              Antivenom Inventory Status <span className="text-red-500">*</span>
            </label>
            <select
              id="antivenomStatus"
              value={antivenomStatus}
              onChange={(e) => setAntivenomStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
            >
              <option value="IN_STOCK">In Stock (Normal Supply)</option>
              <option value="LOW">Low Stock (Critical Level)</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-slate-900 mb-1"
            >
              Available Antivenom Vials on Hand <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              min="0"
              required
              value={quantity === "" ? "" : quantity}
              onChange={(e) =>
                setQuantity(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/50 text-white font-semibold py-3 rounded-md transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Updating Inventory...</span>
              ) : (
                <span>Update Facility Readiness</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

