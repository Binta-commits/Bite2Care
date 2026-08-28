export function checkFacilityStaleness(facilityReadiness: { lastUpdated: Date | string | null }) {
  if (!facilityReadiness || !facilityReadiness.lastUpdated) return { isStale: true, penalty: true }
  const last = typeof facilityReadiness.lastUpdated === 'string' ? new Date(facilityReadiness.lastUpdated) : facilityReadiness.lastUpdated
  const now = new Date()
  const diffMs = now.getTime() - last.getTime()
  const HOUR = 1000 * 60 * 60
  const threshold = 48 * HOUR
  if (diffMs > threshold) return { isStale: true, penalty: true }
  return { isStale: false, penalty: false }
}
