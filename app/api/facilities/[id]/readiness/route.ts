import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: facilityId } = await params
    const data = await req.json().catch(() => ({}))
    const { antivenomStatus, quantity } = data

    // Simulated network delay (Zero Prisma locks for Vercel demo)
    await new Promise((resolve) => setTimeout(resolve, 600))

    return NextResponse.json({
      success: true,
      readinessId: `READY-${facilityId.slice(0, 6)}`,
      facilityId,
      antivenomStatus: antivenomStatus || 'IN_STOCK',
      quantity: quantity ?? 20,
    })
  } catch (err) {
    return NextResponse.json({ success: true, readinessId: 'READY-DEMO' })
  }
}
