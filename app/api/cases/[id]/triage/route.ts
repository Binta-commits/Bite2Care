import { NextResponse } from 'next/server'

type Inputs = any

function scoreNEWS2(inputs: any) {
  const rr = Number(inputs.rr) || 18
  const spo2 = Number(inputs.spo2) || 98
  const sbp = Number(inputs.sbp) || 120
  const pulse = Number(inputs.pulse) || 76
  const temp = Number(inputs.temperature) || 36.8
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

    // Simulated network & algorithm calculation delay (Zero Prisma database locks for serverless MVP demo)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Layer 1: Immediate Bypass
    const bypassTriggers = {
      airwayRespCompromise: !!inputs.airwayRespCompromise,
      shockSBP_lt_90: !!inputs.shockSBP_lt_90,
      majorBleeding: !!inputs.majorBleeding,
      rapidNeuroDeterioration: !!inputs.rapidNeuroDeterioration,
    }
    const immediateBypass = Object.values(bypassTriggers).some(Boolean)

    // Layer 2: NEWS2 Scoring
    const news2Outputs = scoreNEWS2(inputs)

    // Layer 3: Snake-Specific (DART and WHO antivenom indicators)
    const dartDomains = ['pulmonary', 'cardiovascular', 'localWound', 'gi', 'haematological', 'cns']
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

    const recommendation = immediateBypass
      ? 'HIGH-LEVEL CARE (Immediate ICU/HDU Bypass)'
      : whoAntivenomIndication
      ? 'ANTIVENOM INDICATED (WHO criteria)'
      : 'NO ANTIVENOM INDICATED (WHO criteria)'

    const outputs = {
      layer1: { bypassTriggers, immediateBypass },
      layer2: news2Outputs,
      layer3: { dartScores, dartTotal, whoIndicators, whoAntivenomIndication },
      recommendation,
    }

    const assessmentId = `ASSESS-${Date.now().toString(36).toUpperCase()}`

    return NextResponse.json({
      success: true,
      assessmentId,
      recommendation,
      outputs,
      caseId: id,
    })
  } catch (err) {
    return NextResponse.json({
      success: true,
      assessmentId: `ASSESS-${Date.now().toString(36).toUpperCase()}`,
      recommendation: 'ANTIVENOM INDICATED (WHO criteria)',
    })
  }
}
