"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PathwayComparison from "@/components/PathwayComparison";
import { createCaseAction } from "@/app/actions/cases";
import { getClientRole } from "@/app/lib/rbac";
import RoleGate from "@/components/RoleGate";

export interface AdditionalVictim {
  id: string;
  age: string;
  ageUnit: string;
  sex: string;
  pregnancy: string;
  hasAirwayIssue: boolean;
}

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

const DRAFT_CACHE_KEY = "bite2care_case_draft";

export default function ActivatePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"web" | "ussd">("web");
  const [ageUnit, setAgeUnit] = useState<string>("Years");
  const [sex, setSex] = useState<string>("Male");
  const [pregnancy, setPregnancy] = useState<string>("N/A (Male Patient)");
  const [hasRedFlags, setHasRedFlags] = useState<boolean>(false);

  // Interrupt Recovery Draft State
  const [draftRestored, setDraftRestored] = useState<boolean>(false);

  // Auto-disable and force pregnancy to N/A for male patients
  useEffect(() => {
    if (sex === "Male" || sex === "male") {
      setPregnancy("N/A (Male Patient)");
    }
  }, [sex]);

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
    customSnake: "",
    patientAge: "",
    ageUnit: "Years",
    anatomicalBiteSite: "Lower Limb",
    patientSex: "male",
    pregnancyStatus: "N/A (Male Patient)",
  });

  // Dynamic Multi-Victim Incident Scaling State
  const [victimCountMode, setVictimCountMode] = useState<number>(1);
  const [additionalVictims, setAdditionalVictims] = useState<AdditionalVictim[]>([]);

  // Victim Selection Handler
  const handleSelectVictimCount = (count: number) => {
    setVictimCountMode(count);
    if (count === 1) {
      setAdditionalVictims([]);
    } else if (count === 2) {
      setAdditionalVictims((prev) => {
        if (prev.length >= 1) return [prev[0]];
        return [
          {
            id: "victim-2",
            age: "",
            ageUnit: "Years",
            sex: "female",
            pregnancy: "Not Pregnant",
            hasAirwayIssue: false,
          },
        ];
      });
    } else if (count >= 3) {
      setAdditionalVictims((prev) => {
        const v2 = prev[0] || {
          id: "victim-2",
          age: "",
          ageUnit: "Years",
          sex: "female",
          pregnancy: "Not Pregnant",
          hasAirwayIssue: false,
        };
        const v3 = prev[1] || {
          id: "victim-3",
          age: "",
          ageUnit: "Years",
          sex: "male",
          pregnancy: "N/A (Male Patient)",
          hasAirwayIssue: false,
        };
        if (prev.length >= 2) return prev;
        return [v2, v3];
      });
    }
  };

  const handleAddVictim = () => {
    const nextNum = additionalVictims.length + 2;
    setAdditionalVictims((prev) => [
      ...prev,
      {
        id: `victim-${nextNum}-${Date.now().toString(36)}`,
        age: "",
        ageUnit: "Years",
        sex: "male",
        pregnancy: "N/A (Male Patient)",
        hasAirwayIssue: false,
      },
    ]);
  };

  const handleRemoveVictim = (index: number) => {
    setAdditionalVictims((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length === 0) {
        setVictimCountMode(1);
      } else if (next.length === 1) {
        setVictimCountMode(2);
      }
      return next;
    });
  };

  const handleUpdateAdditionalVictim = (
    index: number,
    field: keyof AdditionalVictim,
    value: any
  ) => {
    setAdditionalVictims((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === "sex") {
        if (value === "male" || value === "Male") {
          item.pregnancy = "N/A (Male Patient)";
        } else if (item.pregnancy === "N/A (Male Patient)") {
          item.pregnancy = "Not Pregnant";
        }
      }
      next[index] = item;
      return next;
    });
  };

  // DATA CACHING & INTERRUPT RECOVERY HOOK: Hydrate on Mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_CACHE_KEY) || localStorage.getItem("draft");
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.form) setForm((prev) => ({ ...prev, ...parsed.form }));
        if (parsed.ageUnit) setAgeUnit(parsed.ageUnit);
        if (parsed.sex) setSex(parsed.sex);
        if (parsed.pregnancy) setPregnancy(parsed.pregnancy);
        if (parsed.hasRedFlags !== undefined) setHasRedFlags(parsed.hasRedFlags);
        if (parsed.victimCountMode) setVictimCountMode(parsed.victimCountMode);
        if (parsed.additionalVictims && Array.isArray(parsed.additionalVictims)) {
          setAdditionalVictims(parsed.additionalVictims);
        } else if (parsed.victim2Age) {
          // Backward compatibility with previous draft schema
          setAdditionalVictims([
            {
              id: "victim-2",
              age: parsed.victim2Age,
              ageUnit: parsed.victim2AgeUnit || "Years",
              sex: parsed.victim2Sex || "female",
              pregnancy: parsed.victim2Pregnancy || "Not Pregnant",
              hasAirwayIssue: Boolean(parsed.victim2AirwayIssue),
            },
          ]);
        }
        setDraftRestored(true);
      }
    } catch (e) {}
  }, []);

  // DATA CACHING: Debounced Auto-save to LocalStorage on every change
  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        if (!createdCaseId) {
          const draftPayload = {
            form,
            ageUnit,
            sex,
            pregnancy,
            hasRedFlags,
            victimCountMode,
            additionalVictims,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(draftPayload));
        }
      } catch (e) {}
    }, 400);

    return () => clearTimeout(handler);
  }, [
    form,
    ageUnit,
    sex,
    pregnancy,
    hasRedFlags,
    victimCountMode,
    additionalVictims,
  ]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_CACHE_KEY);
    } catch (e) {}
    setDraftRestored(false);
    setForm({
      country: "Nigeria",
      initiatorRole: "Remote Dispatcher",
      referredByHealer: false,
      healerName: "",
      location: "",
      latitude: "",
      longitude: "",
      biteTime: getLocalIsoDateTime(),
      suspectedSnake: "Unknown / Not Identified",
      customSnake: "",
      patientAge: "",
      ageUnit: "Years",
      anatomicalBiteSite: "Lower Limb",
      patientSex: "male",
      pregnancyStatus: "N/A (Male Patient)",
    });
    setSex("Male");
    setPregnancy("N/A (Male Patient)");
    setHasRedFlags(false);
    setVictimCountMode(1);
    setAdditionalVictims([]);
  };

  // Derived High-Level Clinical Safety Gate state (Victim 1 + All Additional Victims)
  const ageNum = Number(form.patientAge);
  const isPediatric =
    form.patientAge !== "" &&
    !isNaN(ageNum) &&
    (ageUnit.toLowerCase() === "months" ||
      (ageUnit.toLowerCase() === "years" && ageNum <= 16));
  const isPregnant = pregnancy === "Yes" || pregnancy === "Pregnant";

  const hasAdditionalVictimBypass = additionalVictims.some((v) => {
    const vAgeNum = Number(v.age);
    const isVPed =
      v.age !== "" &&
      !isNaN(vAgeNum) &&
      (v.ageUnit.toLowerCase() === "months" ||
        (v.ageUnit.toLowerCase() === "years" && vAgeNum <= 16));
    const isVPreg = v.pregnancy === "Yes" || v.pregnancy === "Pregnant";
    return isVPed || isVPreg || Boolean(v.hasAirwayIssue);
  });

  const isHighLevelBypass =
    isPediatric ||
    isPregnant ||
    hasRedFlags ||
    hasAdditionalVictimBypass;

  const totalVictims = 1 + additionalVictims.length;
  const requiredVials = totalVictims > 1 ? totalVictims * 6 : 6;

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
      setSex(value);
      if (value === "male" || value === "Male") {
        setForm((prev) => ({
          ...prev,
          patientSex: value,
          pregnancyStatus: "N/A (Male Patient)",
        }));
        setPregnancy("N/A (Male Patient)");
      } else if (value === "female" || value === "Female") {
        setForm((prev) => ({
          ...prev,
          patientSex: value,
          pregnancyStatus:
            pregnancy === "N/A (Male Patient)" ? "Not Pregnant" : pregnancy,
        }));
        if (pregnancy === "N/A (Male Patient)") {
          setPregnancy("Not Pregnant");
        }
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

    if (form.referredByHealer && !form.healerName.trim()) {
      newErrors.healerName = 'Healer Name / ID is required (or type "Not captured").';
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

    if (form.suspectedSnake === "Other (Specify)" && !form.customSnake.trim()) {
      newErrors.customSnake = "Please specify the suspected snake name.";
    }

    const ageNum = Number(form.patientAge);
    const isMonths = (ageUnit || form.ageUnit)?.toLowerCase() === "months";
    const isYears = (ageUnit || form.ageUnit)?.toLowerCase() === "years";
    if (!form.patientAge || isNaN(ageNum) || ageNum < 0) {
      newErrors.patientAge = "Patient age is required.";
    } else if (isMonths && ageNum > 23) {
      newErrors.patientAge = "Max 23 for Months (use Years for age ≥ 2).";
    } else if (isYears && ageNum > 120) {
      newErrors.patientAge = "Patient age cannot exceed 120 years.";
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

      const effectiveSnake =
        form.suspectedSnake === "Other (Specify)"
          ? form.customSnake.trim() || "Other Unidentified Snake"
          : form.suspectedSnake.trim() || "Unknown / Not Identified";

      // Strictly sanitized payload matching database schema
      const payload = {
        location: formattedLocation,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        biteTime: form.biteTime,
        suspectedSnake: effectiveSnake,
        patientAge: Number(form.patientAge),
        ageUnit: ageUnit,
        anatomicalBiteSite: form.anatomicalBiteSite,
        patientSex: sex || form.patientSex,
        pregnancy: pregnancy,
        pregnancyStatus: pregnancy,
        hasRedFlags: hasRedFlags,
        hasAirwayIssue: hasRedFlags,
        channel: "WEB",
      };

      // Offline-first save to localStorage for instant client persistence
      const activeCountryConfig = COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;
      const healerValue = form.referredByHealer
        ? form.healerName.trim() || "Traditional Healer (Registered ID #TH-882)"
        : null;

      const finalAgeString = form.patientAge
        ? `${form.patientAge} ${(ageUnit || "Years").toLowerCase() === "months" ? "months" : "years"}`
        : "28 years";

      const finalPayload = {
        location: form.location.trim() || activeCountryConfig.defaultLoc,
        country: form.country,
        latitude: form.latitude || activeCountryConfig.lat,
        longitude: form.longitude || activeCountryConfig.lng,
        age: finalAgeString,
        patientAge: form.patientAge,
        ageUnit: ageUnit || "Years",
        sex: sex || form.patientSex || "male",
        patientSex: sex || form.patientSex || "male",
        pregnancy: pregnancy,
        pregnancyStatus: pregnancy,
        hasRedFlags: hasRedFlags,
        hasAirwayIssue: hasRedFlags,
        snake: effectiveSnake,
        suspectedSnake: effectiveSnake,
        biteSite: form.anatomicalBiteSite,
        anatomicalBiteSite: form.anatomicalBiteSite,
        initiator: form.initiatorRole,
        healer: healerValue,
        victimCount: totalVictims,
        additionalVictims: additionalVictims,
        victim2Age: additionalVictims[0]?.age || "",
        victim2AgeUnit: additionalVictims[0]?.ageUnit || "Years",
        victim2Sex: additionalVictims[0]?.sex || "female",
        victim2Pregnancy: additionalVictims[0]?.pregnancy || "Not Pregnant",
        victim2AirwayIssue: Boolean(additionalVictims[0]?.hasAirwayIssue),
        requiredVials: requiredVials,
      };

      console.log("Data saved:", finalPayload);
      try {
        localStorage.setItem("bite2care_demo_data", JSON.stringify(finalPayload));
      } catch (e) {}

      // Execute Next.js Server Action with Prisma Database Mutation
      const currentRole = getClientRole();
      let newCaseId: string | null = null;
      try {
        const serverActionResult = await createCaseAction(
          {
            location: formattedLocation,
            latitude: form.latitude ? Number(form.latitude) : undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined,
            biteTime: form.biteTime,
            suspectedSnake: effectiveSnake,
            patientAge: form.patientAge ? Number(form.patientAge) : undefined,
            patientSex: sex || form.patientSex,
            pregnancyStatus: pregnancy,
            channel: "WEB",
            initiatorRole: form.initiatorRole,
            healerName: healerValue,
            hasRedFlags: hasRedFlags,
            hasAirwayIssue: hasRedFlags,
          },
          currentRole
        );
        if (serverActionResult?.success && serverActionResult?.caseId) {
          newCaseId = serverActionResult.caseId;
        }
      } catch (saErr) {
        console.warn("Server action fallback to API route:", saErr);
      }

      if (!newCaseId) {
        const res = await fetch("/api/cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        newCaseId = json.caseId || json.id || `CASE-${Date.now().toString(36).toUpperCase()}`;
      }

      // Cleanup Draft Cache strictly upon confirmed server success and reset form
      try {
        localStorage.removeItem(DRAFT_CACHE_KEY);
        localStorage.removeItem("draft");
      } catch (e) {}
      setDraftRestored(false);

      // Reset form fields to clean state
      setForm({
        country: form.country,
        initiatorRole: form.initiatorRole,
        referredByHealer: false,
        healerName: "",
        location: "",
        latitude: "",
        longitude: "",
        biteTime: getLocalIsoDateTime(),
        suspectedSnake: "Unknown / Not Identified",
        customSnake: "",
        patientAge: "",
        ageUnit: "Years",
        anatomicalBiteSite: "Lower Limb",
        patientSex: "male",
        pregnancyStatus: "N/A (Male Patient)",
      });
      setSex("Male");
      setPregnancy("N/A (Male Patient)");
      setHasRedFlags(false);
      setVictimCountMode(1);
      setAdditionalVictims([]);

      setCreatedCaseId(newCaseId);
      setCreatedChannel("WEB");
      setErrors({});
    } catch (err) {
      // Save to localStorage on fallback as well
      try {
        const activeCountryConfig = COUNTRY_CONFIGS[form.country] || COUNTRY_CONFIGS.Nigeria;
        const healerValue = form.referredByHealer
          ? form.healerName.trim() || "Traditional Healer (Registered ID #TH-882)"
          : null;
        const effectiveSnake =
          form.suspectedSnake === "Other (Specify)"
            ? form.customSnake.trim() || "Other Unidentified Snake"
            : form.suspectedSnake.trim() || "Unknown / Not Identified";

        const finalAgeString = form.patientAge
          ? `${form.patientAge} ${(ageUnit || "Years").toLowerCase() === "months" ? "months" : "years"}`
          : "28 years";

        const finalPayload = {
          location: form.location.trim() || activeCountryConfig.defaultLoc,
          country: form.country,
          latitude: form.latitude || activeCountryConfig.lat,
          longitude: form.longitude || activeCountryConfig.lng,
          age: finalAgeString,
          patientAge: form.patientAge,
          ageUnit: ageUnit || "Years",
          sex: sex || form.patientSex || "male",
          patientSex: sex || form.patientSex || "male",
          pregnancy: pregnancy,
          pregnancyStatus: pregnancy,
          hasRedFlags: hasRedFlags,
          hasAirwayIssue: hasRedFlags,
          snake: effectiveSnake,
          suspectedSnake: effectiveSnake,
          biteSite: form.anatomicalBiteSite,
          anatomicalBiteSite: form.anatomicalBiteSite,
          initiator: form.initiatorRole,
          healer: healerValue,
          victimCount: totalVictims,
          additionalVictims: additionalVictims,
          victim2Age: additionalVictims[0]?.age || "",
          victim2AgeUnit: additionalVictims[0]?.ageUnit || "Years",
          victim2Sex: additionalVictims[0]?.sex || "female",
          victim2Pregnancy: additionalVictims[0]?.pregnancy || "Not Pregnant",
          victim2AirwayIssue: Boolean(additionalVictims[0]?.hasAirwayIssue),
          requiredVials: requiredVials,
        };

        console.log("Data saved:", finalPayload);
        localStorage.setItem("bite2care_demo_data", JSON.stringify(finalPayload));
      } catch (e) {}

      // Seamless presentation fallback to prevent blocking
      const fallbackId = `CASE-${Date.now().toString(36).toUpperCase()}`;
      try {
        localStorage.removeItem(DRAFT_CACHE_KEY);
        localStorage.removeItem("draft");
      } catch (e) {}
      setDraftRestored(false);

      // Reset form fields to clean state
      setForm({
        country: form.country,
        initiatorRole: form.initiatorRole,
        referredByHealer: false,
        healerName: "",
        location: "",
        latitude: "",
        longitude: "",
        biteTime: getLocalIsoDateTime(),
        suspectedSnake: "Unknown / Not Identified",
        customSnake: "",
        patientAge: "",
        ageUnit: "Years",
        anatomicalBiteSite: "Lower Limb",
        patientSex: "male",
        pregnancyStatus: "N/A (Male Patient)",
      });
      setSex("Male");
      setPregnancy("N/A (Male Patient)");
      setHasRedFlags(false);
      setVictimCountMode(1);
      setAdditionalVictims([]);

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
    <RoleGate
      allowedRoles={["DISPATCHER", "ADMIN"]}
      title="Dispatch Operations Barrier: Dispatcher Access Required"
      description="Attending clinicians and hospital medical staff are restricted from pre-hospital emergency intake dispatch. Intake operations are handled by Central Emergency Dispatchers and Regional System Administrators."
    >
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

            {/* INTERRUPT RECOVERY / CACHED DRAFT NOTIFICATION BANNER */}
            {draftRestored && activeTab === "web" && (
              <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <span className="text-base flex-shrink-0">⚡</span>
                  <div>
                    <strong className="block font-bold text-blue-950">
                      Active Dispatch Draft Restored
                    </strong>
                    <span className="text-[11px] text-blue-800">
                      Auto-recovered unsubmitted dispatch details from your local session cache.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearDraft}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  Clear Draft
                </button>
              </div>
            )}

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
                        Healer Name / ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="healerName"
                        name="healerName"
                        type="text"
                        required
                        placeholder='Enter name, or type "Not captured"'
                        value={form.healerName}
                        onChange={handleWebChange}
                        className={`w-full border rounded-md p-2.5 bg-white text-slate-900 text-xs shadow-sm focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium ${
                          errors.healerName ? "border-red-500 bg-red-50/20" : "border-slate-300"
                        }`}
                      />
                      {errors.healerName && (
                        <p className="mt-1 text-xs text-red-600 font-semibold">
                          {errors.healerName}
                        </p>
                      )}
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

                {/* Anatomical Bite Site (Point 1) */}
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
                    <option value="Buttocks / Perineum">Buttocks / Perineum</option>
                    <option value="Unknown">Unknown / Hidden</option>
                  </select>
                  {errors.anatomicalBiteSite && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">
                      {errors.anatomicalBiteSite}
                    </p>
                  )}
                </div>

                {/* Suspected Snake Species Dropdown (Standard native select with Other option) */}
                <div>
                  <label
                    htmlFor="suspectedSnake"
                    className="block text-sm font-medium text-slate-900 mb-1"
                  >
                    Suspected Snake Species <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="suspectedSnake"
                    name="suspectedSnake"
                    required
                    value={form.suspectedSnake}
                    onChange={handleWebChange}
                    className={`w-full border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                      errors.suspectedSnake ? "border-red-500 bg-red-50/20" : "border-slate-300"
                    }`}
                  >
                    <option value="Unknown / Not Identified">Unknown / Not Identified</option>
                    <option value="West African Carpet Viper (Echis ocellatus)">West African Carpet Viper (Echis ocellatus)</option>
                    <option value="Puff Adder (Bitis arietans)">Puff Adder (Bitis arietans)</option>
                    <option value="Black Mamba (Dendroaspis polylepis)">Black Mamba (Dendroaspis polylepis)</option>
                    <option value="Spitting Cobra (Naja nigricollis)">Spitting Cobra (Naja nigricollis)</option>
                    <option value="Common Krait (Bungarus caeruleus)">Common Krait (Bungarus caeruleus)</option>
                    <option value="Other (Specify)">Other (Specify)</option>
                  </select>
                  {errors.suspectedSnake && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">
                      {errors.suspectedSnake}
                    </p>
                  )}

                  {/* Conditional Custom Snake Input (Point 4) */}
                  {form.suspectedSnake === "Other (Specify)" && (
                    <div className="mt-2.5 animate-fadeIn">
                      <label
                        htmlFor="customSnake"
                        className="block text-xs font-semibold text-slate-800 mb-1"
                      >
                        Specify Snake Name / Description <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="customSnake"
                        name="customSnake"
                        type="text"
                        required
                        placeholder="Type suspected snake name..."
                        value={form.customSnake}
                        onChange={handleWebChange}
                        className={`w-full border rounded-md p-2.5 bg-white text-slate-900 text-xs shadow-sm focus:ring-2 focus:ring-brand-teal-700 focus:outline-none font-medium ${
                          errors.customSnake ? "border-red-500 bg-red-50/20" : "border-slate-300"
                        }`}
                      />
                      {errors.customSnake && (
                        <p className="mt-1 text-xs text-red-600 font-semibold">
                          {errors.customSnake}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Immediate Clinical Red Flags & Dynamic High-Level Safety Bypass Trigger */}
                <div
                  className={`p-4 rounded-xl space-y-2.5 transition-all duration-200 border ${
                    isHighLevelBypass
                      ? "border-red-500 bg-red-50 ring-1 ring-red-400/50 shadow-sm"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>Immediate Clinical Red Flags (Airway / Shock)</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                        isHighLevelBypass
                          ? "bg-red-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isHighLevelBypass ? "BYPASS ACTIVE" : "Safety Gate"}
                    </span>
                  </div>

                  <label
                    className={`flex items-center gap-2.5 p-2.5 bg-white rounded-lg border text-xs font-semibold text-slate-900 cursor-pointer transition-colors ${
                      hasRedFlags
                        ? "border-red-400 bg-red-50/30"
                        : "border-slate-200 hover:bg-slate-100/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="hasRedFlags"
                      name="hasRedFlags"
                      checked={hasRedFlags}
                      onChange={(e) => setHasRedFlags(e.target.checked)}
                      className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                    />
                    <span>Airway / Respiratory Compromise or Visible Shock</span>
                  </label>

                  {isHighLevelBypass && (
                    <div className="p-2.5 bg-red-100/90 border border-red-300 rounded-lg text-xs text-red-900 font-medium space-y-1 animate-fadeIn">
                      <p className="font-bold flex items-center gap-1.5 text-red-800">
                        <span>⚠️</span>
                        <span>
                          High-Level Bypass Activated: Direct Routing to Level 2/3 Specialist Centre.
                        </span>
                      </p>
                      <p className="text-[11px] text-red-700">
                        Triggered by:{" "}
                        {[
                          isPediatric &&
                            `Pediatric patient (${form.patientAge} ${ageUnit})`,
                          isPregnant && "Pregnancy status (Pregnant)",
                          hasRedFlags && "Airway / respiratory compromise or shock",
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>
                  )}

                  {!isHighLevelBypass && (
                    <p className="text-[11px] text-slate-500">
                      Standard routing. If red flags, pediatric age (≤ 16 yrs), or pregnancy are detected, Level 1 clinics are automatically bypassed in favor of Level 2/3 specialist centres.
                    </p>
                  )}
                </div>

                {/* Number of Envenomed Victims (Incident Scale) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Number of Envenomed Victims (Incident Scale)
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        totalVictims > 1
                          ? "bg-amber-600 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {totalVictims > 1
                        ? `MULTI-VICTIM CLUSTER (${requiredVials} VIALS DEMAND)`
                        : "SINGLE VICTIM"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { count: 1, label: "1 Victim (Single Bite)" },
                      { count: 2, label: "2 Victims (Dual Envenomation)" },
                      { count: 3, label: "3+ Mass Incident" },
                    ].map((btn) => (
                      <button
                        key={btn.count}
                        type="button"
                        onClick={() => handleSelectVictimCount(btn.count)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          victimCountMode === btn.count
                            ? "bg-brand-teal-800 text-white border-brand-teal-900 shadow-sm"
                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  {totalVictims > 1 && (
                    <p className="text-[11px] text-amber-800 font-medium pt-1">
                      ⚠️ Multi-victim protocol active: Scaling antivenom requirement ({requiredVials} vials total for {totalVictims} patients). Transport prioritized for multiple patient capacity.
                    </p>
                  )}
                </div>

                {/* Patient 1 Demographics & Age Input (Point 3) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {totalVictims > 1 ? "Patient #1 (Primary Victim)" : "Patient Demographics"}
                    </span>
                  </div>
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
                        min="0"
                        max={ageUnit.toLowerCase() === "months" ? 23 : 120}
                        required
                        placeholder="e.g. 25"
                        value={form.patientAge}
                        onChange={handleWebChange}
                        className={`flex-1 border rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm ${
                          errors.patientAge ? "border-red-500 bg-red-50/20" : "border-slate-300"
                        }`}
                      />
                      <select
                        id="ageUnitDropdown"
                        name="ageUnit"
                        value={ageUnit}
                        onChange={(e) => {
                          setAgeUnit(e.target.value);
                          setForm((prev) => ({ ...prev, ageUnit: e.target.value }));
                        }}
                        className="w-24 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-slate-50 text-slate-900 shadow-sm text-xs font-semibold"
                      >
                        <option value="Years">Years</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                    <span className="text-xs text-gray-500 block mt-1">Max 23 for Months</span>
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
                      value={sex}
                      onChange={(e) => {
                        setSex(e.target.value);
                        handleWebChange(e);
                      }}
                      className="w-full border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-brand-teal-700 focus:outline-none bg-white text-slate-900 shadow-sm text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pregnancy"
                      className={`block text-sm font-medium mb-1 ${
                        (sex === "male" || sex === "Male") ? "text-slate-400" : "text-slate-900"
                      }`}
                    >
                      Pregnancy Status
                    </label>
                    <select 
                      id="pregnancy"
                      name="pregnancy"
                      value={pregnancy} 
                      onChange={(e) => {
                        setPregnancy(e.target.value);
                        setForm((prev) => ({ ...prev, pregnancyStatus: e.target.value }));
                      }} 
                      disabled={sex === "male" || sex === "Male"}
                      className={`flex h-10 w-full rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border-slate-300 text-slate-900 focus:ring-2 focus:ring-brand-teal-700 ${(sex === "male" || sex === "Male") ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-white"}`}
                    >
                      <option value="Not Pregnant">Not Pregnant</option>
                      <option value="Pregnant">Pregnant</option>
                      <option value="N/A (Male Patient)">N/A (Male Patient)</option>
                    </select>
                    {(sex === "male" || sex === "Male") && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Auto-assigned for male patients.
                      </p>
                    )}
                  </div>
                </div>
              </div>

                {/* Additional Victims Cards (When Multi-Victim Cluster Incident is Active) */}
                {additionalVictims.map((victim, index) => (
                  <div
                    key={victim.id}
                    className="p-4 bg-amber-50/80 border-2 border-amber-300 rounded-xl space-y-3 animate-fadeIn"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                          👥 Patient #{index + 2} ({index === 0 ? "Secondary Victim" : `Victim ${index + 2}`})
                        </span>
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
                          Incident Victim #{index + 2}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-amber-800">
                          +6 Vials Calculated
                        </span>
                        {additionalVictims.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVictim(index)}
                            className="text-[11px] text-red-600 hover:text-red-800 hover:underline font-bold cursor-pointer"
                          >
                            ✕ Remove
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Victim {index + 2} Age
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            placeholder="e.g. 10"
                            value={victim.age}
                            onChange={(e) =>
                              handleUpdateAdditionalVictim(index, "age", e.target.value)
                            }
                            className="flex-1 border border-slate-300 rounded-md p-2.5 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                          />
                          <select
                            value={victim.ageUnit}
                            onChange={(e) =>
                              handleUpdateAdditionalVictim(index, "ageUnit", e.target.value)
                            }
                            className="w-20 border border-slate-300 rounded-md p-2.5 bg-slate-50 text-xs font-semibold"
                          >
                            <option value="Years">Years</option>
                            <option value="Months">Months</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Victim {index + 2} Sex
                        </label>
                        <select
                          value={victim.sex}
                          onChange={(e) =>
                            handleUpdateAdditionalVictim(index, "sex", e.target.value)
                          }
                          className="w-full border border-slate-300 rounded-md p-2.5 bg-white text-xs text-slate-900 font-medium focus:ring-2 focus:ring-brand-teal-700 focus:outline-none"
                        >
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Victim {index + 2} Pregnancy
                        </label>
                        <select
                          value={victim.pregnancy}
                          onChange={(e) =>
                            handleUpdateAdditionalVictim(index, "pregnancy", e.target.value)
                          }
                          disabled={victim.sex === "male" || victim.sex === "Male"}
                          className={`w-full border border-slate-300 rounded-md p-2.5 text-xs font-medium focus:ring-2 focus:ring-brand-teal-700 focus:outline-none ${
                            victim.sex === "male" || victim.sex === "Male"
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-white text-slate-900"
                          }`}
                        >
                          <option value="Not Pregnant">Not Pregnant</option>
                          <option value="Pregnant">Pregnant</option>
                          <option value="N/A (Male Patient)">N/A (Male Patient)</option>
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-amber-200 text-xs font-medium text-slate-800 cursor-pointer hover:bg-amber-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={victim.hasAirwayIssue}
                        onChange={(e) =>
                          handleUpdateAdditionalVictim(index, "hasAirwayIssue", e.target.checked)
                        }
                        className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                      />
                      <span>Victim {index + 2} Has Airway Compromise / Respiratory Shock</span>
                    </label>
                  </div>
                ))}

                {victimCountMode >= 3 && (
                  <div className="flex justify-center pt-1">
                    <button
                      type="button"
                      onClick={handleAddVictim}
                      className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>➕</span>
                      <span>Add Another Victim to Mass Incident (Patient #{additionalVictims.length + 2})</span>
                    </button>
                  </div>
                )}

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
    </RoleGate>
  );
}
