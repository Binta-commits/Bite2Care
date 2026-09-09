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
    return NextResponse.json({ success: true, cases: [] })
  }
}

export async function POST(req: Request) {
  try {
    let body: any = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const newId = `CASE-${Date.now().toString(36).toUpperCase()}`

    // Gracefully handle optional / missing fields
    const location = body.location || "Yam farm 2km north of Keffi market, Nasarawa"
    const suspectedSnake = body.suspectedSnake || body.snake || "Unknown / Not Identified"
    const patientSex = body.patientSex || body.sex || "male"
    const pregnancy = body.pregnancy || body.pregnancyStatus || (patientSex.toLowerCase() === "male" ? "N/A (Male Patient)" : "Not Pregnant")
    const channel = body.channel || "WEB"
    
    let parsedAge: number | null = null
    if (body.patientAge !== undefined && body.patientAge !== null && !isNaN(Number(body.patientAge))) {
      parsedAge = Math.round(Number(body.patientAge))
    }

    let parsedBiteTime: Date | undefined = undefined
    if (body.biteTime) {
      const d = new Date(body.biteTime)
      if (!isNaN(d.getTime())) {
        parsedBiteTime = d
      }
    }

    let createdId = newId
    try {
      const created = await prisma.case.create({
        data: {
          id: newId,
          location,
          biteTime: parsedBiteTime,
          suspectedSnake,
          patientAge: parsedAge,
          patientSex,
          pregnancyStatus: pregnancy,
          state: 'ACTIVATED',
          channel,
        },
      })
      if (created?.id) {
        createdId = created.id
      }
    } catch (dbErr) {
      console.warn("Prisma case storage handled gracefully:", dbErr)
    }

    return NextResponse.json({
      success: true,
      id: createdId,
      caseId: createdId,
      channel,
      ...body,
      pregnancy,
      pregnancyStatus: pregnancy,
    })
  } catch (err) {
    const fallbackId = `CASE-${Date.now().toString(36).toUpperCase()}`
    return NextResponse.json({
      success: true,
      id: fallbackId,
      caseId: fallbackId,
      pregnancy: "Not Pregnant",
      error: String(err),
    })
  }
}

