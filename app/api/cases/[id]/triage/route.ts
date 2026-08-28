import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

type Inputs = any

function scoreNEWS2(inputs: any) {
  // Calculate NEWS2 component scores (no composite aggregation beyond components if avoid is desired)
  const rr = Number(inputs.rr)
  const spo2 = Number(inputs.spo2)
  const sbp = Number(inputs.sbp)
  const pulse = Number(inputs.pulse)
  const temp = Number(inputs.temperature)
  const suppO2 = !!inputs.supplementalO2
  const acvpu = inputs.acvpu || 'A'

  const rrScore = rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3
  const spo2Score = spo2 >= 96 ? 0 : spo2 >= 94 ? 1 : spo2 >= 92 ? 2 : 3
  const sbpScore = sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3
  const pulseScore = pulse <= 40 ? 3 : pulse <= 50 ? 1 : pulse <= 90 ? 0 : pulse <= 110 ? 1 : pulse <= 130 ? 2 : 3
  const tempScore = temp <= 35 ? 3 : temp <= 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2
  const acvpuScore = acvpu === 'A' ? 0 : 3
  const suppO2Score = suppO2 ? 2 : 0

  return {
    components: {
      rr: rrScore,
      spo2: spo2Score,
      sbp: sbpScore,
      pulse: pulseScore,
      temperature: tempScore,
      acvpu: acvpuScore,
      supplementalO2: suppO2Score,
    },
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const inputs: Inputs = await req.json()

    // Fetch case to check age and pregnancy status
    const caseRecord = await prisma.case.findUnique({ where: { id } })
    if (!caseRecord) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 })

    // Layer 1: Immediate Bypass
    const bypassTriggers = {
      airwayRespCompromise: !!inputs.airwayRespCompromise,
      shockSBP_lt_90: !!inputs.shockSBP_lt_90,
      majorBleeding: !!inputs.majorBleeding,
      rapidNeuroDeterioration: !!inputs.rapidNeuroDeterioration,
    }
    const immediateBypass = Object.values(bypassTriggers).some(Boolean)
    if (immediateBypass) {
      const outputs = { layer: 1, recommendation: 'HIGH-LEVEL CARE', bypassTriggers }

      const created = await prisma.clinicalAssessment.create({
        data: {
          caseId: id,
          rawInputs: JSON.stringify(inputs),
          calculatedOutputs: JSON.stringify(outputs),
        },
      })

      await prisma.case.update({ where: { id }, data: { state: 'MATCHING' } })

      return NextResponse.json({ success: true, recommendation: 'HIGH-LEVEL CARE', assessmentId: created.id })
    }

    // Layer 2: NEWS2 (bypass if age <=16 or pregnant)
    const age = caseRecord.patientAge ?? null
    const pregnant = (caseRecord.pregnancyStatus || '').toLowerCase() === 'pregnant'
    let news2Outputs: any = { bypassed: false }
    if (age !== null && Number(age) <= 16) {
      news2Outputs.bypassed = true
      news2Outputs.reason = 'Age <= 16'
    }
    if (pregnant) {
      news2Outputs.bypassed = true
      news2Outputs.reason = news2Outputs.reason ? news2Outputs.reason + '; pregnant' : 'pregnant'
    }
    if (!news2Outputs.bypassed) {
      news2Outputs = { ...news2Outputs, ...scoreNEWS2(inputs) }
    }

    // Layer 3: Snake-Specific (DART and WHO antivenom indicators)
    const dartDomains = ['pulmonary','cardiovascular','localWound','gi','haematological','cns']
    const dartScores: any = {}
    let dartTotal = 0
    for (const d of dartDomains) {
      const v = Number(inputs[d] ?? 0)
      dartScores[d] = v
      dartTotal += v
    }

    const whoIndicators = {
      wbctBleeding: !!inputs.wbctBleeding,
      neurotoxicity: !!inputs.neurotoxicity,
      cardiovascularAbnormality: !!inputs.cardiovascularAbnormality,
      swellingHalfLimb: !!inputs.swellingHalfLimb,
      rapidProgression: !!inputs.rapidProgression,
    }
    const whoAntivenomIndication = Object.values(whoIndicators).some(Boolean)

    const outputs = {
      layer1: { bypassTriggers, immediateBypass },
      layer2: news2Outputs,
      layer3: { dartScores, dartTotal, whoIndicators, whoAntivenomIndication },
    }

    // Layer 4: Storage
    const created = await prisma.clinicalAssessment.create({
      data: {
        caseId: id,
        rawInputs: JSON.stringify(inputs),
        calculatedOutputs: JSON.stringify(outputs),
      },
    })

    await prisma.case.update({ where: { id }, data: { state: 'MATCHING' } })

    return NextResponse.json({ success: true, assessmentId: created.id, recommendation: whoAntivenomIndication ? 'ANTIVENOM INDICATED (WHO criteria)' : 'NO ANTIVENOM INDICATED (WHO criteria)' })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
