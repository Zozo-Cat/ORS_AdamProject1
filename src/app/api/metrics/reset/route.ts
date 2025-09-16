import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization") ?? "";
    const xHeader = req.headers.get("x-admin-token") ?? "";
    let provided = "";
    if (authHeader.toLowerCase().startsWith("bearer ")) {
        provided = authHeader.slice(7).trim();
    } else if (xHeader) {
        provided = xHeader.trim();
    }
    const expected = (process.env.ADMIN_TOKEN ?? "").trim();
    if (!expected) return NextResponse.json({ error: "Admin token not configured" }, { status: 500 });
    if (provided !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { data } = await sb
            .from("counters")
            .select("count")
            .eq("key", "items_acquired")
            .maybeSingle();

        if (data) {
            const { error: upErr } = await sb
                .from("counters")
                .update({ count: 0, updated_at: new Date().toISOString() })
                .eq("key", "items_acquired");
            if (upErr) throw upErr;
        } else {
            const { error: insErr } = await sb
                .from("counters")
                .insert({ key: "items_acquired", count: 0 });
            if (insErr) throw insErr;
        }
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Reset failed" }, { status: 500 });
    }
}
