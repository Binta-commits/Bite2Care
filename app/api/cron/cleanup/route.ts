import { NextResponse } from "next/server";
import { cleanupExpiredCasesAction } from "@/app/actions/cases";

/**
 * 24-Hour Showcase Case Retention Cleanup Handler
 * Triggered automatically by Vercel Cron, Supabase pg_cron, or Admin maintenance.
 *
 * Supabase pg_cron Setup SQL:
 * SELECT cron.schedule(
 *   'cleanup-24h-showcase-cases',
 *   '0 0 * * *',
 *   $$DELETE FROM "Case" WHERE "createdAt" < NOW() - INTERVAL '1 day';$$
 * );
 */
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional secret check if configured in production
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.warn("Unauthorized cleanup cron call attempt");
    }

    const result = await cleanupExpiredCasesAction("ADMIN");

    return NextResponse.json({
      message: `24-Hour Showcase retention cleanup executed. Cleaned ${result.deletedCount || 0} expired cases.`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "24-Hour cleanup failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
