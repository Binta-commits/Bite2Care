"use server";

import { prisma } from "@/app/lib/prisma";
import { validateRolePermission, UserRole } from "@/app/lib/rbac";
import { revalidatePath } from "next/cache";

export interface CreateCaseInput {
  location: string;
  latitude?: number;
  longitude?: number;
  biteTime?: string;
  suspectedSnake?: string;
  patientAge?: number;
  patientSex?: string;
  pregnancyStatus?: string;
  channel?: string;
  initiatorRole?: string;
  healerName?: string | null;
  hasRedFlags?: boolean;
  hasAirwayIssue?: boolean;
}

/**
 * Server Action 1: Create Case Mutation
 * Persists the case directly into the database and revalidates the case archive.
 */
export async function createCaseAction(
  input: CreateCaseInput,
  userRole: UserRole = "DISPATCHER"
) {
  try {
    // 1. RBAC Validation
    const authCheck = validateRolePermission(userRole, ["DISPATCHER", "ADMIN", "PHYSICIAN"]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.reason };
    }

    const newId = `CASE-${Date.now().toString(36).toUpperCase()}`;

    // 2. Data Sanitization
    const location = input.location?.trim() || "Yam farm 2km north of Keffi market, Nasarawa";
    const suspectedSnake = input.suspectedSnake?.trim() || "Unknown / Not Identified";
    const patientSex = input.patientSex?.trim() || "male";
    const pregnancy =
      input.pregnancyStatus ||
      (patientSex.toLowerCase() === "male" ? "N/A (Male Patient)" : "Not Pregnant");
    const channel = input.channel || "WEB";

    let parsedAge: number | null = null;
    if (input.patientAge !== undefined && input.patientAge !== null && !isNaN(Number(input.patientAge))) {
      parsedAge = Math.round(Number(input.patientAge));
    }

    let parsedBiteTime: Date | undefined = undefined;
    if (input.biteTime) {
      const d = new Date(input.biteTime);
      if (!isNaN(d.getTime())) {
        parsedBiteTime = d;
      }
    }

    // 3. Database Persistence Mutation via Prisma
    const newCase = await prisma.case.create({
      data: {
        id: newId,
        location,
        biteTime: parsedBiteTime || new Date(),
        suspectedSnake,
        patientAge: parsedAge,
        patientSex,
        pregnancyStatus: pregnancy,
        state: "ACTIVATED",
        channel,
      },
    });

    // Revalidate cases registry page
    revalidatePath("/cases");
    revalidatePath("/activate");

    return {
      success: true,
      case: newCase,
      caseId: newCase.id,
    };
  } catch (err: any) {
    console.error("Prisma Case Create Error:", err);
    return {
      success: false,
      error: err.message || "Failed to persist case to database.",
    };
  }
}

/**
 * Server Action 2: Update Case State Mutation
 * Enforces strict Backend Immutability Lock: If case is CLOSED, modifications are rejected.
 */
export async function updateCaseStateAction(
  caseId: string,
  targetState: string,
  details: {
    facilityId?: string;
    transportProviderId?: string;
    vialsAdministered?: number;
    clinicalOutcome?: string;
    outcomeNotes?: string;
    escalationReason?: string;
  } = {},
  userRole: UserRole = "DISPATCHER"
) {
  try {
    // 1. RBAC Validation
    const authCheck = validateRolePermission(userRole, ["DISPATCHER", "PHYSICIAN", "ADMIN"]);
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.reason };
    }

    // 2. Query Current Case from DB (Backend Immutability Lock)
    const existing = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!existing) {
      return { success: false, error: `Case ${caseId} not found in registry.` };
    }

    // STRICT BACKEND IMMUTABILITY GUARD
    if (existing.state === "CLOSED") {
      return {
        success: false,
        error: "CASE_LOCKED_IMMUTABLE: This medical case is officially CLOSED and locked for auditing. Modifications are strictly forbidden.",
      };
    }

    // 3. Perform Mutation
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: {
        state: targetState,
        facilityId: details.facilityId ?? existing.facilityId,
        transportProviderId: details.transportProviderId ?? existing.transportProviderId,
        vialsAdministered: details.vialsAdministered ?? existing.vialsAdministered,
        clinicalOutcome: details.clinicalOutcome ?? existing.clinicalOutcome,
        outcomeNotes: details.outcomeNotes ?? existing.outcomeNotes,
        escalationReason: details.escalationReason ?? existing.escalationReason,
      },
    });

    revalidatePath(`/cases/${caseId}/manage`);
    revalidatePath(`/cases/${caseId}/match`);
    revalidatePath(`/triage/${caseId}`);
    revalidatePath("/cases");

    return { success: true, case: updated };
  } catch (err: any) {
    console.error("Prisma Case State Update Error:", err);
    return {
      success: false,
      error: err.message || "Failed to update case state.",
    };
  }
}

/**
 * Server Action 3: Record Clinical Triage & Authorize Antivenom
 * Enforces Physician RBAC and Immutability Lock.
 */
export async function recordTriageAssessmentAction(
  caseId: string,
  assessment: {
    rawInputs: any;
    calculatedOutputs: any;
    recommendation: string;
    clinicalOutcome?: string;
    outcomeNotes?: string;
    vialsAdministered?: number;
    closeCase?: boolean;
  },
  userRole: UserRole = "PHYSICIAN"
) {
  try {
    // 1. RBAC Clinical Access Enforcement
    const authCheck = validateRolePermission(userRole, ["PHYSICIAN", "ADMIN"]);
    if (!authCheck.authorized) {
      return {
        success: false,
        error: "CLINICAL_ACCESS_DENIED: Only Attending Physicians or Administrators may authorize antivenom release and record clinical triage.",
      };
    }

    // 2. Query Current Case from DB (Backend Immutability Lock)
    const existing = await prisma.case.findUnique({
      where: { id: caseId },
    });

    if (!existing) {
      return { success: false, error: `Case ${caseId} not found in database.` };
    }

    if (existing.state === "CLOSED") {
      return {
        success: false,
        error: "CASE_LOCKED_IMMUTABLE: Case is CLOSED and locked for auditing. Triage assessment cannot be modified.",
      };
    }

    const nextState = assessment.closeCase
      ? "CLOSED"
      : assessment.clinicalOutcome === "Admitted Inpatient"
      ? "ADMITTED_INPATIENT"
      : "ACCEPTED";

    // 3. Create Clinical Assessment Record
    const createdAssessment = await prisma.clinicalAssessment.create({
      data: {
        caseId,
        rawInputs: JSON.stringify(assessment.rawInputs),
        calculatedOutputs: JSON.stringify(assessment.calculatedOutputs),
      },
    });

    // 4. Update Case Record
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: {
        state: nextState,
        clinicalOutcome: assessment.clinicalOutcome ?? existing.clinicalOutcome,
        outcomeNotes: assessment.outcomeNotes ?? existing.outcomeNotes,
        vialsAdministered: assessment.vialsAdministered ?? existing.vialsAdministered,
      },
    });

    revalidatePath(`/triage/${caseId}`);
    revalidatePath(`/cases/${caseId}/manage`);
    revalidatePath("/cases");

    return {
      success: true,
      assessment: createdAssessment,
      case: updatedCase,
    };
  } catch (err: any) {
    console.error("Clinical Triage Assessment Action Error:", err);
    return {
      success: false,
      error: err.message || "Failed to record clinical assessment.",
    };
  }
}

/**
 * Server Action 4: 24-Hour Showcase Case Cleanup
 * Enforces the 24-Hour Rule to keep the demonstration environment clean.
 * Query: DELETE FROM "Case" WHERE "createdAt" < NOW() - INTERVAL '1 day';
 */
export async function cleanupExpiredCasesAction(userRole: UserRole = "ADMIN") {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Delete associated assessments first (or cascade)
    const expiredCases = await prisma.case.findMany({
      where: {
        createdAt: {
          lt: oneDayAgo,
        },
      },
      select: { id: true },
    });

    const expiredIds = expiredCases.map((c) => c.id);

    if (expiredIds.length > 0) {
      await prisma.clinicalAssessment.deleteMany({
        where: {
          caseId: {
            in: expiredIds,
          },
        },
      });

      const deleteResult = await prisma.case.deleteMany({
        where: {
          id: {
            in: expiredIds,
          },
        },
      });

      revalidatePath("/cases");
      return {
        success: true,
        deletedCount: deleteResult.count,
        cleanedIds: expiredIds,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: true,
      deletedCount: 0,
      cleanedIds: [],
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error("Cleanup Expired Cases Error:", err);
    return {
      success: false,
      error: err.message || "Failed to execute 24-hour cleanup.",
    };
  }
}
