import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params

    // find an available transport provider
    const provider = await prisma.transportProvider.findFirst({ where: { available: true } })
    if (!provider) return NextResponse.json({ success: false, error: 'No transport providers available' }, { status: 404 })

    // assign to case and mark provider unavailable
    await prisma.transportProvider.update({ where: { id: provider.id }, data: { available: false } })
    await prisma.case.update({ where: { id: caseId }, data: { transportProviderId: provider.id, state: 'TRANSPORT_COORDINATION' } })

    return NextResponse.json({ success: true, provider: { id: provider.id, name: provider.name, phone: provider.phone } })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
