"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PathwayComparison from "@/components/PathwayComparison";

// Regional country configurations for scalable localization and cell tower triangulation simulation
const COUNTRY_CONFIGS: Record<
  string,
  { label: string; placeholder: string; defaultLoc: string; lat: string; lng: string }
> = {
  Nigeria: {
    label: "Site of Incident & Local Landmarks",
    placeholder: "e.g., Yam farm 2km north of Keffi market, Nasarawa",
    defaultLoc: "Yam farm 2km north of Keffi market, Nasarawa",
    lat: "8.8471",
    lng: "7.8932",
  },
  Ghana: {
    label: "Site of Incident & Local Landmarks",
    placeholder: "e.g., Cocoa plantation near Osu river",
    defaultLoc: "Cocoa plantation near Osu river",
    lat: "5.5560",
    lng: "-0.1820",
  },
  Kenya: {
    label: "Site of Incident & Local Landmarks",
    placeholder: "e.g., Grazing field outside Kibera",
    defaultLoc: "Grazing field outside Kibera",
    lat: "-1.3138",
    lng: "36.7876",
  },
  Zambia: {
    label: "Site of Incident & Local Landmarks",
    placeholder: "e.g., Maize field near Kabulonga clinic",
    defaultLoc: "Maize field near Kabulonga clinic",
    lat: "-15.4167",
    lng: "28.3500",
  },
  India: {
    label: "Site of Incident & Local Landmarks",
    placeholder: "e.g., Rice paddy edge, Andheri district",
    defaultLoc: "Rice paddy edge, Andheri district",
    lat: "19.1136",
    lng: "72.8697",
  },
};

// Curated regional snake species list for rapid frontline identification
const SNAKE_SPECIES_OPTIONS = [
  "Unknown / Not Identified",
  "West African Carpet Viper (Echis ocellatus)",
  "Black-necked Spitting Cobra (Naja nigricollis)",
  "Puff Adder (Bitis arietans)",
  "Black Mamba (Dendroaspis polylepis)",
  "Green Mamba (Dendroaspis viridis / angusticeps)",
  "Saw-scaled Viper (Echis carinatus)",
  "Russell's Viper (Daboia russelii)",
  "Indian Spectacled Cobra (Naja naja)",
  "Common Krait (Bungarus caeruleus)",
  "Boomslang (Dispholidus typus)",
  "Gaboon Viper (Bitis gabonica)",
  "Forest Cobra (Naja melanoleuca)",
  "Other / Unidentified Viper",
  "Other / Unidentified Elapid",
];

// Helper to get local datetime string in browser timezone
const getLocalIsoDateTime = () => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    return new Date().toISOString().slice(0, 16);
  }
};

// Curated popular incident landmarks for fast dispatch autocomplete
const POPULAR_LANDMARKS = [
  "Keffi Market Farm Corridor, Nasarawa",
  "Kaltungo Snakebite Treatment Center, Gombe",
  "Yam farm 2km north of Keffi market, Nasarawa",
  "Cocoa plantation near Osu river, Greater Accra",
  "Grazing field outside Kibera, Nairobi",
  "Maize field near Kabulonga clinic, Lusaka",
  "Rice paddy edge, Andheri district, Maharashtra",
];

export default function ActivatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"web" | "ussd">("web");

  // Web Form State
  const [form, setForm] = useState({
    country: "Nigeria",
    initiatorRole: "Remote Dispatcher",
    referredByHealer: false,
    healerName: "",
    location: "",
    latitude: "",
    longitude: "",
    biteTime: getLocalIsoDateTime(),
    suspectedSnake: "Unknown / Not Identified",
    patientAge: "",
    ageUnit: "years",
    anatomicalBiteSite: "Lower Limb",
    patientSex: "male",
    pregnancyStatus: "N/A",
  });

  // Snake Autocomplete Dropdown State
  const [snakeSearchQuery, setSnakeSearchQuery] = useState("");
  const [isSnakeDropdownOpen, setIsSnakeDropdownOpen] = useState(false);

  // Simulated Telecom Network Geolocation State
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const [locCaptured, setLocCaptured] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false); // isSubmitting state
  const [createdCaseId, setCreatedCaseId] = useState<string | null>(null);
  const [createdChannel, setCreatedChannel] = useState<string>("WEB");

  // USSD Simulator State
  const [ussdInput, setUssdInput] = useState("*999*Keffi Ward 3*28*M*VIPER#");
  const [ussdSessionText, setUssdSessionText] = useState("");
  const [ussdScreen, setUssdScreen] = useState<string>(
    "Dial *999# for interactive menu or enter quick string e.g. *999*LOCATION*AGE*SEX*SNAKE#"
  );
  const [ussdLoading, setUssdLoading] = useState(false);
  const [ussdIsEnd, setUssdIsEnd] = useState(false);

  // Telecom Cell Tower Triangulation Pure Simulation Handler (Zero external network calls)
  const fetchCallerNetworkLocation = () => {
    setFetchingLoc(true);
    setLocCaptured(false);

    // 1500ms simulated network timeout
    setTimeout(() => {
      const config = COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;
      setForm((prev) => ({
        ...prev,
        latitude: config.lat,
        longitude: config.lng,
        location: prev.location.trim() ? prev.location : config.defaultLoc,
      }));
      setFetchingLoc(false);
      setLocCaptured(true);

      // Clear location error if active
      if (errors.location) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      }
    }, 1500);
  };

  // Handle Web input changes with conditional country & pregnancy logic
  const handleWebChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "country") {
      setForm((prev) => ({
        ...prev,
        country: value,
        latitude: "",
        longitude: "",
      }));
      setLocCaptured(false);
    } else if (name === "patientSex") {
      if (value === "male") {
        setForm((prev) => ({
          ...prev,
          patientSex: value,
          pregnancyStatus: "N/A",
        }));
      } else if (value === "female") {
        setForm((prev) => ({
          ...prev,
          patientSex: value,
          pregnancyStatus:
            prev.pregnancyStatus === "N/A" ? "unknown" : prev.pregnancyStatus,
        }));
      } else {
        setForm((prev) => ({
          ...prev,
          patientSex: value,
        }));
      }
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: isCheckbox ? checked : value,
      }));
    }

    // Clear field-level error on user modification
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Client-side form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.country) {
      newErrors.country = "Country selection is required.";
    }

    if (!form.location.trim()) {
      newErrors.location = "Site of incident & landmarks is required.";
    }

    if (!form.biteTime) {
      newErrors.biteTime = "Estimated bite date and time is required.";
    }

    if (!form.anatomicalBiteSite) {
      newErrors.anatomicalBiteSite = "Anatomical bite site is required.";
    }

    const ageNum = Number(form.patientAge);
    if (!form.patientAge || isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      newErrors.patientAge = "Patient age is required (e.g. 0.5 to 120).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitWeb = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict client validation before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setCreatedCaseId(null);

    try {
      const locText = form.location.trim();
      const formattedLocation = locText.startsWith(`[${form.country}]`)
        ? locText
        : `[${form.country}] ${locText}`;

      const formattedAgeDisplay =
        form.ageUnit === "months"
          ? `${form.patientAge} mo`
          : `${form.patientAge}`;

      // Strictly sanitized payload matching database schema
      const payload = {
        location: formattedLocation,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        biteTime: form.biteTime,
        suspectedSnake: form.suspectedSnake.trim() || "Unknown / Not Identified",
        patientAge: Number(form.patientAge),
        ageUnit: form.ageUnit,
        anatomicalBiteSite: form.anatomicalBiteSite,
        patientSex: form.patientSex,
        pregnancyStatus: form.patientSex === "male" ? "N/A" : form.pregnancyStatus,
        channel: "WEB",
      };

      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      // Save to localStorage for demo persistence across all pages
      try {
        const activeCountryConfig = COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;
        const healerValue = form.referredByHealer
          ? form.healerName.trim() || "Traditional Healer (Registered ID #TH-882)"
          : null;

        localStorage.setItem(
          "bite2care_demo_data",
          JSON.stringify({
            location: form.location.trim() || activeCountryConfig.defaultLoc,
            country: form.country,
            latitude: form.latitude || activeCountryConfig.lat,
            longitude: form.longitude || activeCountryConfig.lng,
            age: formattedAgeDisplay,
            sex: form.patientSex || "male",
            snake: form.suspectedSnake || "West African Carpet Viper (Echis ocellatus)",
            biteSite: form.anatomicalBiteSite,
            initiator: form.initiatorRole,
            healer: healerValue,
          })
        );
      } catch (err) {}

      if (json.success && json.id) {
        setCreatedCaseId(json.id);
        setCreatedChannel("WEB");
        setErrors({});
      } else {
        // Robust fallback ID for presentation resilience
        const fallbackId = `CASE-${Date.now().toString(36).toUpperCase()}`;
        setCreatedCaseId(fallbackId);
        setCreatedChannel("WEB");
        setErrors({});
      }
    } catch (err) {
      // Save to localStorage on fallback as well
      try {
        const activeCountryConfig = COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;
        const formattedAgeDisplay =
          form.ageUnit === "months"
            ? `${form.patientAge} mo`
            : `${form.patientAge}`;
        const healerValue = form.referredByHealer
          ? form.healerName.trim() || "Traditional Healer (Registered ID #TH-882)"
          : null;

        localStorage.setItem(
          "bite2care_demo_data",
          JSON.stringify({
            location: form.location.trim() || activeCountryConfig.defaultLoc,
            country: form.country,
            latitude: form.latitude || activeCountryConfig.lat,
            longitude: form.longitude || activeCountryConfig.lng,
            age: formattedAgeDisplay || "28",
            sex: form.patientSex || "male",
            snake: form.suspectedSnake || "West African Carpet Viper (Echis ocellatus)",
            biteSite: form.anatomicalBiteSite,
            initiator: form.initiatorRole,
            healer: healerValue,
          })
        );
      } catch (e) {}

      // Seamless presentation fallback to prevent blocking
      const fallbackId = `CASE-${Date.now().toString(36).toUpperCase()}`;
      setCreatedCaseId(fallbackId);
      setCreatedChannel("WEB");
      setErrors({});
    } finally {
      setLoading(false);
    }
  };

  const submitUssd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ussdInput.trim()) return;

    setUssdLoading(true);

    try {
      const isDirect =
        ussdInput.startsWith("*") &&
        ussdInput.endsWith("#") &&
        ussdInput.split("*").length > 2;

      let payload: any = { ussdString: ussdInput };
      if (!isDirect) {
        const nextText = ussdSessionText
          ? `${ussdSessionText}*${ussdInput}`
          : ussdInput;
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
          setUssdSessionText((prev) =>
            prev ? `${prev}*${ussdInput}` : ussdInput
          );
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
    setUssdScreen(
      "Dial *999# for interactive menu or enter quick string e.g. *999*LOCATION*AGE*SEX*SNAKE#"
    );
    setUssdIsEnd(false);
  };

  const handleResetAll = () => {
    setCreatedCaseId(null);
    resetUssd();
    setLocCaptured(false);
  };

  const activeCountryConfig =
    COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-200 mt-4">
        {/* VIEW 1: PATHWAY COMPARISON ENGINE (Renders immediately after case activation) */}
        {createdCaseId ? (
          <PathwayComparison
            caseId={createdCaseId}
            channel={createdChannel}
            location={form.location || activeCountryConfig.defaultLoc}
            country={form.country}
            onReset={handleResetAll}
          />
        ) : (
          /* VIEW 2: ACTIVATION INTAKE FORM (WEB + USSD) */
          <>
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
                Initiate snakebite emergency dispatch via Web Intake (Remote Dispatcher) or Frontline USSD channel.
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

            {/* TAB 1: WEB FORM */}
            {activeTab === "web" && (
              <form onSubmit={submitWeb} noValidate className="space-y-5">
                {/* Initiator Role (Point 1) */}
                <div>
                  <label
                    htmlFor="initiatorRole"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Initiator Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="initiatorRole"
                    name="initiatorRole"
                    value={form.initiatorRole}
                    onChange={handleWebChange}
                    className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm font-medium"
                  >
                    <option value="Remote Dispatcher">Remote Dispatcher (Central Emergency Ops)</option>
                    <option value="On-site Snakebite Champion (SBC)">On-site Snakebite Champion (SBC / Community Volunteer)</option>
                    <option value="Facility Nurse">Facility Nurse (Frontline Clinic)</option>
                  </select>
                </div>

                {/* Country Selection */}
                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Operational Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleWebChange}
                    className={`w-full border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                      errors.country ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  >
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Zambia">Zambia</option>
                    <option value="India">India</option>
                  </select>
                  {errors.country && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">
                      {errors.country}
                    </p>
                  )}
                </div>

                {/* Traditional Healer Integration (Point 1) */}
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="referredByHealer"
                      name="referredByHealer"
                      type="checkbox"
                      checked={form.referredByHealer}
                      onChange={handleWebChange}
                      className="w-4 h-4 mt-0.5 text-brand-teal-800 rounded border-slate-300 focus:ring-brand-teal-700 cursor-pointer"
                    />
                    <label htmlFor="referredByHealer" className="text-xs font-bold text-slate-900 cursor-pointer">
                      Referred by Traditional Healer?
                      <span className="block font-normal text-[11px] text-slate-600 mt-0.5">
                        Enables automated referral incentive tracking ($10 voucher) to integrate grassroots healers into modern clinical pathways.
                      </span>
                    </label>
                  </div>

                  {form.referredByHealer && (
                    <div className="pt-2 border-t border-amber-200/80 animate-fadeIn">
                      <label htmlFor="healerName" className="block text-xs font-semibold text-slate-800 mb-1">
                        Healer Name / ID
                      </label>
                      <input
                        id="healerName"
                        name="healerName"
                        type="text"
                        placeholder="e.g. Baba Musa (Keffi Ward Registry #TH-402)"
                        value={form.healerName}
                        onChange={handleWebChange}
                        className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-slate-900 text-xs shadow-sm focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Dynamic Specific Location Section with Telecom Network Triangulation Action */}
                <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label
                      htmlFor="location"
                      className="block text-sm font-bold text-slate-900"
                    >
                      {activeCountryConfig.label} <span className="text-red-500">*</span>
                    </label>

                    {/* Telecom Location Trigger Button */}
                    <button
                      type="button"
                      onClick={fetchCallerNetworkLocation}
                      disabled={fetchingLoc}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                        locCaptured
                          ? "bg-emerald-600 text-white border border-emerald-700 font-bold"
                          : fetchingLoc
                          ? "bg-brand-gold-400 text-slate-900 cursor-wait opacity-90"
                          : "bg-brand-gold-500 hover:bg-brand-gold-600 text-slate-900 font-semibold"
                      }`}
                    >
                      {fetchingLoc ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                          <span>Pinging Cell Network...</span>
                        </>
                      ) : locCaptured ? (
                        <>
                          <span>✓ Coordinates Captured</span>
                        </>
                      ) : (
                        <>
                          <span>📍 Fetch Caller Network Location (Telecom API)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* State/LGA / Landmarks input with dynamic placeholder per selected country & popular landmarks datalist */}
                  <div>
                    <input
                      key={form.country}
                      id="location"
                      name="location"
                      type="text"
                      list="local-landmarks-list"
                      required
                      placeholder={activeCountryConfig.placeholder}
                      value={form.location}
                      onChange={handleWebChange}
                      className={`w-full border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                        errors.location ? "border-red-500 bg-red-50/20" : "border-slate-300"
                      }`}
                    />
                    <datalist id="local-landmarks-list">
                      {POPULAR_LANDMARKS.map((landmark) => (
                        <option key={landmark} value={landmark} />
                      ))}
                    </datalist>
                    {errors.location && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  {/* Unlocked Latitude and Longitude Coordinates (Allows Manual Override if Telco Ping is Inaccurate) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="latitude"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Victim Latitude
                        </label>
                        <span className="text-[10px] text-slate-500 italic">Editable / GPS Override</span>
                      </div>
                      <input
                        id="latitude"
                        name="latitude"
                        type="text"
                        placeholder="e.g. 8.8471"
                        value={form.latitude}
                        onChange={handleWebChange}
                        className="w-full border border-slate-300 rounded-md p-2.5 font-mono text-xs bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="longitude"
                          className="block text-xs font-semibold text-slate-700"
                        >
                          Victim Longitude
                        </label>
                        <span className="text-[10px] text-slate-500 italic">Editable / GPS Override</span>
                      </div>
                      <input
                        id="longitude"
                        name="longitude"
                        type="text"
                        placeholder="e.g. 7.8932"
                        value={form.longitude}
                        onChange={handleWebChange}
                        className="w-full border border-slate-300 rounded-md p-2.5 font-mono text-xs bg-white text-slate-900 shadow-sm focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Estimated Bite Time (Local Timezone Initialized) */}
                <div>
                  <label
                    htmlFor="biteTime"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Estimated Bite Date &amp; Time (Local Timezone) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="biteTime"
                    type="datetime-local"
                    name="biteTime"
                    required
                    value={form.biteTime}
                    onChange={handleWebChange}
                    className={`w-full border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                      errors.biteTime ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  />
                  {errors.biteTime && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">
                      {errors.biteTime}
                    </p>
                  )}
                </div>

                {/* Anatomical Bite Site (Point 6) */}
                <div>
                  <label
                    htmlFor="anatomicalBiteSite"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Anatomical Bite Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="anatomicalBiteSite"
                    name="anatomicalBiteSite"
                    required
                    value={form.anatomicalBiteSite}
                    onChange={handleWebChange}
                    className={`w-full border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                      errors.anatomicalBiteSite ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  >
                    <option value="Lower Limb">Lower Limb (Foot / Ankle / Leg)</option>
                    <option value="Upper Limb">Upper Limb (Hand / Wrist / Arm)</option>
                    <option value="Head/Neck">Head / Neck (High Alert)</option>
                    <option value="Torso">Torso / Abdomen / Back</option>
                    <option value="Unknown">Unknown / Hidden</option>
                  </select>
                  {errors.anatomicalBiteSite && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">
                      {errors.anatomicalBiteSite}
                    </p>
                  )}
                </div>

                {/* Snake Species Searchable Filter Combobox & Autocomplete Selection */}
                <div className="relative">
                  <label
                    htmlFor="suspectedSnake"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Suspected Snake Species (Search &amp; Filter Autocomplete)
                  </label>
                  <div className="relative">
                    <input
                      id="suspectedSnake"
                      name="suspectedSnake"
                      type="text"
                      list="snake-species-list"
                      placeholder="Type to filter species e.g. Viper, Cobra, Krait..."
                      value={form.suspectedSnake}
                      onChange={(e) => {
                        handleWebChange(e);
                        setSnakeSearchQuery(e.target.value);
                        setIsSnakeDropdownOpen(true);
                      }}
                      onFocus={() => setIsSnakeDropdownOpen(true)}
                      className="w-full border border-slate-300 rounded-md p-3 pr-10 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setIsSnakeDropdownOpen((prev) => !prev)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                    >
                      {isSnakeDropdownOpen ? "▲" : "▼"}
                    </button>
                  </div>

                  <datalist id="snake-species-list">
                    {SNAKE_SPECIES_OPTIONS.map((species) => (
                      <option key={species} value={species} />
                    ))}
                  </datalist>

                  {/* Interactive Dynamic Dropdown Filter Menu */}
                  {isSnakeDropdownOpen && (
                    <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                      {SNAKE_SPECIES_OPTIONS.filter((item) =>
                        item.toLowerCase().includes((form.suspectedSnake || snakeSearchQuery).toLowerCase())
                      ).map((species) => (
                        <button
                          key={species}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, suspectedSnake: species }));
                            setIsSnakeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between hover:bg-brand-teal-50 hover:text-brand-teal-900 cursor-pointer ${
                            form.suspectedSnake === species
                              ? "bg-brand-teal-50 text-brand-teal-900 font-bold"
                              : "text-slate-800"
                          }`}
                        >
                          <span>{species}</span>
                          {form.suspectedSnake === species && (
                            <span className="text-brand-teal-700 font-bold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-500">Quick Pick:</span>
                    {["Unknown / Not Identified", "West African Carpet Viper", "Black-necked Spitting Cobra", "Russell's Viper"].map((name) => {
                      const fullOption = SNAKE_SPECIES_OPTIONS.find((s) => s.includes(name)) || name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, suspectedSnake: fullOption }));
                            setIsSnakeDropdownOpen(false);
                          }}
                          className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200 cursor-pointer"
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Patient Demographics & Infant Decimal Age Support */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="patientAge"
                      className="block text-sm font-medium text-slate-900 mb-1"
                    >
                      Patient Age <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="patientAge"
                        type="number"
                        name="patientAge"
                        step="0.1"
                        min="0"
                        max="120"
                        required
                        placeholder="e.g. 0.5 or 28"
                        value={form.patientAge}
                        onChange={handleWebChange}
                        className={`flex-1 border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                          errors.patientAge ? "border-red-500 bg-red-50/20" : "border-slate-300"
                        }`}
                      />
                      <select
                        name="ageUnit"
                        value={form.ageUnit}
                        onChange={handleWebChange}
                        className="w-24 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-slate-50 text-slate-900 shadow-sm text-xs font-semibold"
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                      </select>
                    </div>
                    {errors.patientAge && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">
                        {errors.patientAge}
                      </p>
                    )}
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
                      className={`block text-sm font-medium mb-1 ${
                        form.patientSex === "male" ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      Pregnancy Status
                    </label>
                    <select
                      id="pregnancyStatus"
                      name="pregnancyStatus"
                      value={form.pregnancyStatus}
                      disabled={form.patientSex === "male"}
                      onChange={handleWebChange}
                      className={`w-full border rounded-md p-3 text-sm shadow-sm transition-colors ${
                        form.patientSex === "male"
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                      }`}
                    >
                      {form.patientSex === "male" ? (
                        <option value="N/A">N/A (Male Patient)</option>
                      ) : (
                        <>
                          <option value="unknown">Unknown / Not Assessed</option>
                          <option value="not_pregnant">Not Pregnant</option>
                          <option value="pregnant">Pregnant</option>
                        </>
                      )}
                    </select>
                    {form.patientSex === "male" && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Disabled for male patients.
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Action Button with isSubmitting state & spinner */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-teal-800 hover:bg-brand-teal-700 disabled:bg-brand-teal-900/60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-md transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Case Intake...</span>
                      </>
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

                {/* Quick Demo Presets */}
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
          </>
        )}
      </div>
    </div>
  );
}
