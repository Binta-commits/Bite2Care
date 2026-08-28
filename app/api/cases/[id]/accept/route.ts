import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const body = await req.json()
    const { facilityId } = body
    if (!facilityId) return NextResponse.json({ success: false, error: 'facilityId required' }, { status: 400 })

    // Ensure facility exists
    const facility = await prisma.facility.findUnique({ where: { id: facilityId } })
    if (!facility) return NextResponse.json({ success: false, error: 'Facility not found' }, { status: 404 })

    const updated = await prisma.case.update({ where: { id: caseId }, data: { state: 'ACCEPTED', facilityId } })

    return NextResponse.json({ success: true, caseId: updated.id })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
