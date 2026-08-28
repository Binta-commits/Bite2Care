import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  try {
    const cases = await prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        clinicalAssessments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    return NextResponse.json({ success: true, cases })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Only accept the minimum fields
    const { location, biteTime, suspectedSnake, patientAge, patientSex, pregnancyStatus, channel } = data

    const created = await prisma.case.create({
      data: {
        location,
        biteTime: biteTime ? new Date(biteTime) : undefined,
        suspectedSnake: suspectedSnake ?? null,
        patientAge: Number(patientAge),
        patientSex,
        pregnancyStatus: pregnancyStatus ?? null,
        state: 'ACTIVATED',
        channel: channel || 'WEB',
      },
    })

    return NextResponse.json({ success: true, id: created.id, channel: created.channel })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

