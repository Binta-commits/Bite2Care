import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params
    const caseRec = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        clinicalAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    if (!caseRec) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })
    return NextResponse.json({ success: true, case: caseRec })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
