import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params

    // Simulated network delay (Zero Prisma SQLite database calls for serverless Vercel demo)
    await new Promise((resolve) => setTimeout(resolve, 300))

    const { searchParams } = new URL(req.url)
    const ageParam = searchParams.get('age') || undefined
    const ageUnitParam = searchParams.get('ageUnit') || undefined

    const isPediatric = ageParam
      ? ageParam.toLowerCase().includes('month') ||
        ageParam.toLowerCase().includes('mo') ||
        ageUnitParam?.toLowerCase() === 'months' ||
        parseFloat(ageParam) <= 16
      : false

    // Stratified ranking respecting the 16-Year Pediatric Clinical Safety Gate
    const ranked = isPediatric
      ? [
          {
            score: 98,
            isPediatricRecommended: true,
            option: {
              type: 'Option A',
              mode: 'Direct Referral to Level 3 Specialist Centre (Pediatric Protocol)',
              facilityId: 'fac-a',
              facilityName: 'Federal Medical Centre (Central Specialist Hospital)',
              capabilityLevel: 3,
              hasIcuHdu: true,
              antivenomStatus: 'IN_STOCK',
              quantity: 14,
              distanceKm: 68,
              etaMinutes: 78,
              staleness: { isStale: false },
            },
          },
          {
            score: 82,
            isPediatricRecommended: false,
            option: {
              type: 'Option B',
              mode: 'Secondary Referral to Level 2 Regional Hospital',
              facilityId: 'fac-d',
              facilityName: 'State General Hospital & Emergency Centre',
              capabilityLevel: 2,
              hasIcuHdu: true,
              antivenomStatus: 'IN_STOCK',
              quantity: 8,
              distanceKm: 42,
              etaMinutes: 49,
              staleness: { isStale: false },
            },
          },
        ]
      : [
          {
            score: 95,
            option: {
              type: 'Option B',
              mode: 'Dynamic Treatment Rendezvous (Recommended)',
              destinationFacilityId: 'fac-b',
              destinationFacilityName: 'Facility B (Primary Healthcare Centre)',
              capabilityLevel: 1,
              hasIcuHdu: false,
              antivenomStatus: 'IN_TRANSIT (6 Vials arriving in 38m)',
              quantity: 6,
              distanceKm: 19,
              patientEtaMinutes: 35,
              rendezvousEtaMinutes: 41,
              donorFacilityId: 'fac-c',
              donorFacilityName: 'Regional Antivenom Depository (Hub C)',
              donorQuantity: 6,
              donorEtaMinutes: 38,
              courierStatus: 'Courier Dispatched - ETA to Facility B: 38m',
              staleness: { isStale: false },
            },
          },
          {
            score: 72,
            option: {
              type: 'Option A',
              mode: 'Direct Transit to Stocked Hospital',
              facilityId: 'fac-a',
              facilityName: 'Federal Medical Centre (Central Specialist Hospital)',
              capabilityLevel: 3,
              hasIcuHdu: true,
              antivenomStatus: 'IN_STOCK',
              quantity: 14,
              distanceKm: 68,
              etaMinutes: 78,
              staleness: { isStale: false },
            },
          },
        ]

    return NextResponse.json({ success: true, ranked, caseId })
  } catch (err) {
    return NextResponse.json({
      success: true,
      ranked: [],
    })
  }
}
