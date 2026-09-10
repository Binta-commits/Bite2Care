import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params

    try {
      const caseItem = await prisma.case.findUnique({
        where: { id: caseId },
        include: {
          clinicalAssessments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
      if (caseItem) {
        return NextResponse.json({ success: true, case: caseItem })
      }
    } catch (dbErr) {
      console.warn("Prisma lookup note:", dbErr)
    }

    return NextResponse.json({
      success: true,
      case: null,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
