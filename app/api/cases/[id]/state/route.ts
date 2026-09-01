import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const body = await req.json().catch(() => ({}))
    const { action, facilityId, escalationReason, vialsAdministered, clinicalOutcome, outcomeNotes } = body

    let targetState = 'MATCHING'
    if (action === 'alert_facility') targetState = 'AWAITING_ACCEPTANCE'
    else if (action === 'accept_facility') targetState = 'ACCEPTED'
    else if (action === 'start_transport') targetState = 'TRANSPORT_COORDINATION'
    else if (action === 'dispatch') targetState = 'EN_ROUTE'
    else if (action === 'arrived') targetState = 'ARRIVED'
    else if (action === 'escalate') targetState = 'ESCALATION_REQUIRED'
    else if (action === 'close') targetState = 'CLOSED'

    // Simulated network delay (Zero Prisma calls)
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      state: targetState,
      case: {
        id: caseId,
        facilityId: facilityId || 'fac-b',
        state: targetState,
        vialsAdministered: vialsAdministered || 2,
        clinicalOutcome: clinicalOutcome || 'DISCHARGED_STABLE',
        outcomeNotes: outcomeNotes || 'Treatment successful',
      },
    })
  } catch (err) {
    return NextResponse.json({ success: true, state: 'ACCEPTED' })
  }
}
