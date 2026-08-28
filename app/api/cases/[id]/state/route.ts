import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

const allowedTransitions: Record<string, string[]> = {
  ACTIVATED: ['TRIAGING', 'MATCHING', 'ESCALATION_REQUIRED'],
  TRIAGING: ['MATCHING', 'ESCALATION_REQUIRED'],
  MATCHING: ['AWAITING_ACCEPTANCE', 'ACCEPTED', 'ESCALATION_REQUIRED'],
  AWAITING_ACCEPTANCE: ['ACCEPTED', 'MATCHING', 'ESCALATION_REQUIRED'],
  ACCEPTED: ['TRANSPORT_COORDINATION', 'EN_ROUTE', 'ESCALATION_REQUIRED'],
  TRANSPORT_COORDINATION: ['EN_ROUTE', 'ESCALATION_REQUIRED'],
  EN_ROUTE: ['ARRIVED', 'ESCALATION_REQUIRED'],
  ARRIVED: ['CLOSED', 'ESCALATION_REQUIRED'],
  ESCALATION_REQUIRED: ['MATCHING', 'TRANSPORT_COORDINATION', 'ARRIVED', 'CLOSED'],
  CLOSED: [],
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const body = await req.json()
    const {
      action,
      facilityId,
      escalationReason,
      vialsAdministered,
      clinicalOutcome,
      outcomeNotes,
    } = body

    if (!action) {
      return NextResponse.json({ success: false, error: 'action required' }, { status: 400 })
    }

    const caseRec = await prisma.case.findUnique({ where: { id: caseId } })
    if (!caseRec) {
      return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })
    }

    let targetState = ''
    const updateData: any = {}

    if (action === 'start_triage') {
      targetState = 'TRIAGING'
    } else if (action === 'start_matching') {
      targetState = 'MATCHING'
    } else if (action === 'alert_facility') {
      targetState = 'AWAITING_ACCEPTANCE'
      if (facilityId) updateData.facilityId = facilityId
    } else if (action === 'accept_facility') {
      targetState = 'ACCEPTED'
      if (facilityId) updateData.facilityId = facilityId
    } else if (action === 'decline_facility') {
      targetState = 'MATCHING'
    } else if (action === 'start_transport') {
      targetState = 'TRANSPORT_COORDINATION'
    } else if (action === 'dispatch') {
      targetState = 'EN_ROUTE'
    } else if (action === 'arrived') {
      targetState = 'ARRIVED'
    } else if (action === 'escalate') {
      targetState = 'ESCALATION_REQUIRED'
      updateData.escalationReason = escalationReason || 'Emergency escalation triggered by operator.'
    } else if (action === 'close') {
      targetState = 'CLOSED'
      updateData.vialsAdministered = Number(vialsAdministered) || 0
      updateData.clinicalOutcome = clinicalOutcome || 'DISCHARGED_STABLE'
      updateData.outcomeNotes = outcomeNotes || 'Clinical handover and treatment completed.'
      updateData.cscFeedbackSent = true
    } else {
      return NextResponse.json({ success: false, error: `unknown action: ${action}` }, { status: 400 })
    }

    const current = caseRec.state || 'ACTIVATED'
    const allowed = allowedTransitions[current] || []
    if (!allowed.includes(targetState)) {
      return NextResponse.json(
        { success: false, error: 'invalid state transition', from: current, to: targetState },
        { status: 400 }
      )
    }

    // Apply state change
    updateData.state = targetState
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: updateData,
    })

    // If closing, free transport provider if assigned
    if (targetState === 'CLOSED' && caseRec.transportProviderId) {
      await prisma.transportProvider.updateMany({
        where: { id: caseRec.transportProviderId },
        data: { available: true },
      })
    }

    return NextResponse.json({
      success: true,
      state: targetState,
      case: updated,
      cscFeedbackNotification:
        targetState === 'CLOSED'
          ? `[CSC Feedback Loop] Case #${caseId.slice(0, 8)} successfully resolved. Outcome: ${updated.clinicalOutcome}. ${updated.vialsAdministered} vials administered.`
          : null,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

