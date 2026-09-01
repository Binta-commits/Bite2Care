import { NextResponse } from 'next/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params

    return NextResponse.json({
      success: true,
      case: {
        id: caseId,
        location: "Keffi Ward 3, Nasarawa State (GPS: 8.8471, 7.8932)",
        biteTime: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        suspectedSnake: "West African Carpet Viper (Echis ocellatus)",
        patientAge: 28,
        patientSex: "male",
        pregnancyStatus: "N/A",
        facilityId: "fac-b",
        state: "ACCEPTED",
        channel: "WEB",
        vialsAdministered: null,
        clinicalOutcome: null,
        createdAt: new Date().toISOString(),
        clinicalAssessments: [
          {
            id: `ASSESS-${caseId.slice(0, 6)}`,
            caseId,
            rawInputs: JSON.stringify({
              rr: "18",
              spo2: "98",
              sbp: "120",
              pulse: "76",
              wbctBleeding: true,
            }),
            calculatedOutputs: JSON.stringify({
              recommendation: "ANTIVENOM INDICATED (WHO criteria)",
              layer1: { immediateBypass: false },
              layer3: { whoAntivenomIndication: true },
            }),
            createdAt: new Date().toISOString(),
          },
        ],
      },
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
