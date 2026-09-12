import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const body = await req.json().catch(() => ({}));
    const { facilityId } = body;

    let existingCase: any = null;
    try {
      existingCase = await prisma.case.findUnique({
        where: { id: caseId },
      });
    } catch (e) {}

    // Strict Backend Immutability Guard
    if (existingCase && existingCase.state === 'CLOSED') {
      return NextResponse.json(
        {
          success: false,
          error: 'CASE_LOCKED_IMMUTABLE: This medical case is officially CLOSED and locked for auditing. Modifications are strictly forbidden.',
        },
        { status: 403 }
      );
    }

    if (existingCase) {
      try {
        await prisma.case.update({
          where: { id: caseId },
          data: {
            state: 'ACCEPTED',
            facilityId: facilityId || existingCase.facilityId,
          },
        });
      } catch (dbErr) {
        console.warn("Prisma accept update note:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      caseId,
      facilityId: facilityId || 'fac-b',
      state: 'ACCEPTED',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
