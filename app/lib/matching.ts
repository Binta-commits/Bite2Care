import { checkFacilityStaleness } from './readiness'

export type Facility = {
  id: string
  name?: string
  capabilityLevel: number
  hasIcuHdu: boolean
  facilityReadiness?: { antivenomStatus?: string; quantity?: number; lastUpdated?: string | Date }
  distanceKm?: number
}

export function rankFacilities(caseId: string, facilities: Facility[], clinicalAssessment: any) {
  // If immediate bypass triggered, restrict to ICU/HDU facilities only
  const immediateBypass = !!(clinicalAssessment && clinicalAssessment.layer1 && clinicalAssessment.layer1.immediateBypass)

  let candidates = facilities.slice()
  if (immediateBypass) {
    candidates = candidates.filter(f => f.hasIcuHdu)
  }

  // Score facilities and detect reverse logistics opportunities
  const scored = candidates.map(f => {
    const readiness = f.facilityReadiness || {}
    const status = readiness.antivenomStatus || 'OUT_OF_STOCK'
    let score = (f.capabilityLevel || 0) * 100
    if (status === 'IN_STOCK') score += 50
    else if (status === 'LOW') score += 10
    score += (readiness.quantity || 0)

    const staleness = checkFacilityStaleness({ lastUpdated: readiness.lastUpdated ?? null })
    if (staleness.isStale) score -= 10000

    return { facility: f, score, staleness }
  })

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)

  // Build ranking output with Option A and Option B suggestions
  const results: any[] = []

  for (const s of scored) {
    const f = s.facility
    const readiness = f.facilityReadiness || {}
    const isInStock = (readiness.antivenomStatus || 'OUT_OF_STOCK') === 'IN_STOCK'

    const optionA = {
      type: 'Option A',
      mode: 'Direct Transport',
      facilityId: f.id,
      facilityName: f.name,
      capabilityLevel: f.capabilityLevel,
      hasIcuHdu: f.hasIcuHdu,
      antivenomStatus: readiness.antivenomStatus,
      quantity: readiness.quantity,
      distanceKm: f.distanceKm ?? null,
      staleness: s.staleness,
    }

    results.push({ option: optionA, score: s.score })

    // Reverse logistics: if this facility is high-capability but OUT_OF_STOCK, find a donor
    if (f.capabilityLevel >= 3 && !isInStock) {
      const donor = scored.find(x => (x.facility.facilityReadiness || {}).antivenomStatus === 'IN_STOCK')
      if (donor) {
        const optionB = {
          type: 'Option B',
          mode: 'Reverse Logistics',
          destinationFacilityId: f.id,
          destinationFacilityName: f.name,
          donorFacilityId: donor.facility.id,
          donorFacilityName: donor.facility.name,
          donorQuantity: (donor.facility.facilityReadiness || {}).quantity || 0,
          donorDistanceKm: donor.facility.distanceKm ?? null,
        }
        results.push({ option: optionB, score: s.score - 1 })
      }
    }
  }

  return results
}
