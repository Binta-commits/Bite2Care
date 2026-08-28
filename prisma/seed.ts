import { PrismaClient, AntivenomStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Facility A
  const fa = await prisma.facility.create({ data: { name: 'General Hospital A', capabilityLevel: 3, hasIcuHdu: true, canDo20WBCT: true } })
  await prisma.facilityReadiness.create({ data: { facilityId: fa.id, antivenomStatus: AntivenomStatus.IN_STOCK, quantity: 20, lastUpdated: new Date() } })

  // Facility B
  const fb = await prisma.facility.create({ data: { name: 'Rural Clinic B', capabilityLevel: 2, hasIcuHdu: false, canDo20WBCT: true } })
  await prisma.facilityReadiness.create({ data: { facilityId: fb.id, antivenomStatus: AntivenomStatus.OUT_OF_STOCK, quantity: 0, lastUpdated: new Date() } })

  // Facility C
  const fc = await prisma.facility.create({ data: { name: 'Central Medical Hub', capabilityLevel: 3, hasIcuHdu: true, canDo20WBCT: true } })
  await prisma.facilityReadiness.create({ data: { facilityId: fc.id, antivenomStatus: AntivenomStatus.IN_STOCK, quantity: 50, lastUpdated: new Date() } })

  // Transport providers
  await prisma.transportProvider.create({ data: { name: 'Motorcycle/Tricycle (Keke)', phone: '0803 XXX XXXX', available: true } })
  await prisma.transportProvider.create({ data: { name: 'Formal Ambulance', phone: '0805 XXX XXXX', available: true } })

  console.log('Seeding complete')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
