import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params

    // Simulated network delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    return NextResponse.json({
      success: true,
      provider: {
        id: "trans-1",
        name: "Musa Ibrahim (Plateau Emergency Transport Unit)",
        phone: "+234 803 123 4567",
      },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
