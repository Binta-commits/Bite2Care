import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { rankFacilities } from '@/app/lib/matching'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const caseRecord = await prisma.case.findUnique({ where: { id: caseId } })
    if (!caseRecord) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })

    const clinicalAssessment = await prisma.clinicalAssessment.findFirst({ where: { caseId }, orderBy: { createdAt: 'desc' } })

    // Fetch facilities with readiness info
    const facilities = await prisma.facility.findMany({ include: { facilityReadiness: true } })

    // Map to expected structure
    const facilitiesForMatching = facilities.map(f => ({
      id: f.id,
      name: f.name,
      capabilityLevel: f.capabilityLevel,
      hasIcuHdu: f.hasIcuHdu,
      facilityReadiness: f.facilityReadiness
        ? { antivenomStatus: f.facilityReadiness.antivenomStatus, quantity: f.facilityReadiness.quantity, lastUpdated: f.facilityReadiness.lastUpdated }
        : undefined,
      distanceKm: null,
    }))

    const ranked = rankFacilities(caseId, facilitiesForMatching as any, clinicalAssessment ? JSON.parse(clinicalAssessment.calculatedOutputs) : null)

    await prisma.case.update({ where: { id: caseId }, data: { state: 'MATCHING' } })

    return NextResponse.json({ success: true, ranked })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
