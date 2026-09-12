import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

type Inputs = any;

function scoreNEWS2(inputs: any) {
  const rr = Number(inputs.rr) || 18;
  const spo2 = Number(inputs.spo2) || 98;
  const sbp = Number(inputs.sbp) || 120;
  const pulse = Number(inputs.pulse) || 76;
  const temp = Number(inputs.temperature) || 36.8;
  const suppO2 = !!inputs.supplementalO2;
  const acvpu = inputs.acvpu || 'A';

  const rrScore = rr <= 8 ? 3 : rr <= 11 ? 1 : rr <= 20 ? 0 : rr <= 24 ? 2 : 3;
  const spo2Score = spo2 >= 96 ? 0 : spo2 >= 94 ? 1 : spo2 >= 92 ? 2 : 3;
  const sbpScore = sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : sbp <= 219 ? 0 : 3;
  const pulseScore = pulse <= 40 ? 3 : pulse <= 50 ? 1 : pulse <= 90 ? 0 : pulse <= 110 ? 1 : pulse <= 130 ? 2 : 3;
  const tempScore = temp <= 35 ? 3 : temp <= 36 ? 1 : temp <= 38 ? 0 : temp <= 39 ? 1 : 2;
  const acvpuScore = acvpu === 'A' ? 0 : 3;
  const suppO2Score = suppO2 ? 2 : 0;

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
    total: rrScore + spo2Score + sbpScore + pulseScore + tempScore + acvpuScore + suppO2Score,
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const inputs: Inputs = await req.json();

    // Check Immutability Lock
    let existingCase: any = null;
    try {
      existingCase = await prisma.case.findUnique({
        where: { id: caseId },
      });
    } catch (e) {}

    if (existingCase && existingCase.state === 'CLOSED') {
      return NextResponse.json(
        {
          success: false,
          error: 'CASE_LOCKED_IMMUTABLE: This medical case is officially CLOSED and locked for auditing. Modifications are strictly forbidden.',
        },
        { status: 403 }
      );
    }

    // Layer 1: Immediate Bypass
    const bypassTriggers = {
      airwayRespCompromise: !!inputs.airwayRespCompromise,
      shockSBP_lt_90: !!inputs.shockSBP_lt_90,
      majorBleeding: !!inputs.majorBleeding,
      rapidNeuroDeterioration: !!inputs.rapidNeuroDeterioration,
      pediatricAge: !!inputs.pediatricAge,
      pregnancy: !!inputs.pregnancy,
      ocularInjury: !!inputs.ocularInjury,
    };
    const immediateBypass = Object.values(bypassTriggers).some(Boolean);

    // Layer 2: NEWS2 Scoring
    const news2Outputs = scoreNEWS2(inputs);

    // Layer 3: Snake-Specific (WHO antivenom indicators)
    const whoIndicators = {
      wbctBleeding: !!inputs.wbctBleeding,
      neurotoxicity: !!inputs.neurotoxicity,
      cardiovascularAbnormality: !!inputs.cardiovascularAbnormality,
      acuteRenalFailure: !!inputs.acuteRenalFailure,
      swellingHalfLimb: !!inputs.swellingHalfLimb,
      swellingDigits: !!inputs.swellingDigits,
      rapidProgression: !!inputs.rapidProgression,
      childNonMinor: !!inputs.childNonMinor,
    };
    const whoAntivenomIndication = Object.values(whoIndicators).some(Boolean);

    const recommendation = immediateBypass
      ? 'IMMEDIATE TRANSFER → ANTIVENOM + HIGH-LEVEL CARE (ICU/HDU)'
      : whoAntivenomIndication
      ? 'ANTIVENOM AUTHORIZED (WHO criteria satisfied)'
      : 'OBSERVATION ONLY (Repeat 20WBCT in 30 minutes)';

    const outputs = {
      layer1: { bypassTriggers, immediateBypass },
      layer2: news2Outputs,
      layer3: { whoIndicators, whoAntivenomIndication },
      recommendation,
    };

    const assessmentId = `ASSESS-${Date.now().toString(36).toUpperCase()}`;

    // Persist assessment into Prisma
    if (existingCase) {
      try {
        await prisma.clinicalAssessment.create({
          data: {
            id: assessmentId,
            caseId,
            rawInputs: JSON.stringify(inputs),
            calculatedOutputs: JSON.stringify(outputs),
          },
        });
      } catch (dbErr) {
        console.warn("Prisma assessment storage note:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      assessmentId,
      recommendation,
      outputs,
      caseId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
