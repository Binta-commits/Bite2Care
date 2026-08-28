import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: facilityId } = await params
    const data = await req.json()
    const { antivenomStatus, quantity } = data

    const now = new Date()

    const upserted = await prisma.facilityReadiness.upsert({
      where: { facilityId },
      update: { antivenomStatus, quantity: quantity ?? 0, lastUpdated: now },
      create: { facilityId, antivenomStatus, quantity: quantity ?? 0, lastUpdated: now },
    })

    return NextResponse.json({ success: true, readinessId: upserted.id })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
