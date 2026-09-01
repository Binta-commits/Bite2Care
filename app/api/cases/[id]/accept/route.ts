import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const body = await req.json().catch(() => ({}))
    const { facilityId } = body

    // Simulated network delay (Zero Prisma calls)
    await new Promise((resolve) => setTimeout(resolve, 600))

    return NextResponse.json({
      success: true,
      caseId,
      facilityId: facilityId || 'fac-b',
      state: 'ACCEPTED',
    })
  } catch (err) {
    return NextResponse.json({ success: true, caseId: 'CASE-DEMO', state: 'ACCEPTED' })
  }
}
