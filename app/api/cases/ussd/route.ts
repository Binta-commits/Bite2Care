import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const text: string = (body.text || body.ussdString || '').trim()
    const phoneNumber: string = body.phoneNumber || '0803XXXXXXX'

    // Check if direct format e.g. *999*LOCATION*AGE*SEX*SNAKE#
    if (text.startsWith('*') && text.endsWith('#')) {
      const parts = text.replace(/^\*/, '').replace(/#$/, '').split('*')
      // parts[0] is service code (e.g. 999), parts[1] is location, parts[2] is age, parts[3] is sex, parts[4] is snake
      const location = parts[1] || 'Rural Community Node'
      const patientAge = parseInt(parts[2], 10) || 25
      const sexRaw = (parts[3] || 'M').toUpperCase()
      const patientSex = sexRaw.startsWith('F') ? 'female' : 'male'
      const snakeMap: Record<string, string> = {
        '1': 'Carpet Viper (Echis ocellatus)',
        '2': 'Black Mamba',
        '3': 'Spitting Cobra',
        '4': 'Unknown',
        'VIPER': 'Carpet Viper (Echis ocellatus)',
        'MAMBA': 'Black Mamba',
        'COBRA': 'Spitting Cobra',
      }
      const suspectedSnake = snakeMap[parts[4]?.toUpperCase()] || parts[4] || 'Carpet Viper (Echis ocellatus)'

      const created = await prisma.case.create({
        data: {
          location,
          biteTime: new Date(),
          patientAge,
          patientSex,
          suspectedSnake,
          pregnancyStatus: 'unknown',
          state: 'ACTIVATED',
          channel: 'USSD',
        },
      })

      const shortId = created.id.slice(0, 8).toUpperCase()
      return NextResponse.json({
        success: true,
        type: 'END',
        message: `END [Bite2Care] Emergency Case Activated! Ref #${shortId}. Location: ${location}. Pre-arrival routing underway.`,
        caseId: created.id,
      })
    }

    // Multi-step session flow (standard Africa's Talking / Twilio USSD format)
    const steps = text === '' ? [] : text.split('*')
    const stepCount = steps.length

    if (stepCount === 0) {
      return NextResponse.json({
        success: true,
        type: 'CON',
        message: `CON Bite2Care Emergency Response\n1. Activate Snakebite Incident\n2. Check Hospital Antivenom Stock\n3. Emergency Dispatch Hotline`,
      })
    }

    if (steps[0] === '2') {
      return NextResponse.json({
        success: true,
        type: 'END',
        message: `END Central Hub: 50 vials (IN STOCK)\nGen Hospital A: 20 vials (IN STOCK)\nRural Clinic B: 0 vials (OUT OF STOCK)`,
      })
    }

    if (steps[0] === '3') {
      return NextResponse.json({
        success: true,
        type: 'END',
        message: `END Emergency Dispatch Hotline: 0800-BITE2CARE (+234 800 248 3222)`,
      })
    }

    if (steps[0] === '1') {
      if (stepCount === 1) {
        return NextResponse.json({
          success: true,
          type: 'CON',
          message: `CON Enter Incident Location / Community Name:`,
        })
      }
      if (stepCount === 2) {
        return NextResponse.json({
          success: true,
          type: 'CON',
          message: `CON Enter Patient Age in Years:`,
        })
      }
      if (stepCount === 3) {
        return NextResponse.json({
          success: true,
          type: 'CON',
          message: `CON Patient Sex:\n1. Male\n2. Female\n3. Other`,
        })
      }
      if (stepCount === 4) {
        return NextResponse.json({
          success: true,
          type: 'CON',
          message: `CON Suspected Snake (if seen):\n1. Carpet Viper (Echis)\n2. Spitting Cobra (Naja)\n3. Black Mamba\n4. Unknown`,
        })
      }
      if (stepCount === 5) {
        return NextResponse.json({
          success: true,
          type: 'CON',
          message: `CON Pregnancy Status:\n1. Not Pregnant\n2. Pregnant\n3. Unknown / NA`,
        })
      }

      if (stepCount === 6) {
        const location = steps[1] || 'Community Ward'
        const patientAge = parseInt(steps[2], 10) || 30
        const sexCode = steps[3]
        const patientSex = sexCode === '2' ? 'female' : 'male'
        const snakeMap: Record<string, string> = {
          '1': 'Carpet Viper (Echis ocellatus)',
          '2': 'Spitting Cobra (Naja)',
          '3': 'Black Mamba',
          '4': 'Unknown',
        }
        const suspectedSnake = snakeMap[steps[4]] || 'Unknown'
        const pregCode = steps[5]
        const pregnancyStatus = pregCode === '2' ? 'pregnant' : pregCode === '1' ? 'not_pregnant' : 'unknown'

        const created = await prisma.case.create({
          data: {
            location,
            biteTime: new Date(),
            patientAge,
            patientSex,
            suspectedSnake,
            pregnancyStatus,
            state: 'ACTIVATED',
            channel: 'USSD',
          },
        })

        const shortId = created.id.slice(0, 8).toUpperCase()
        return NextResponse.json({
          success: true,
          type: 'END',
          message: `END Bite2Care Case Activated! Ref #${shortId}. Nearest verified hospital matching initiated. Keep patient calm and immobilized.`,
          caseId: created.id,
        })
      }
    }

    return NextResponse.json({
      success: true,
      type: 'END',
      message: `END Invalid input. Please redial *999#.`,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
