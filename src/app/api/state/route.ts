import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

type Counts = { tbow: number; scythe: number; staff: number };
type VaultState = { items: Counts; updatedAt: string | null };

const ZERO: Counts = { tbow: 0, scythe: 0, staff: 0 };
const ITEM_IDS = { tbow: 20997, scythe: 22486, staff: 27277 };

function toInt(v: any) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
function normCounts(raw: any): Counts {
    const i = raw ?? {};
    return { tbow: toInt(i.tbow), scythe: toInt(i.scythe), staff: toInt(i.staff) };
}

async function ensureAccountId(): Promise<number> {
    const hash = (process.env.ADMIN_ACCOUNT_HASH ?? "demo-hash").trim();
    const label = (process.env.ADMIN_ACCOUNT_LABEL ?? "Vault").trim();

    let { data: acc, error } = await sb
        .from("accounts")
        .select("id")
        .eq("account_hash", hash)
        .maybeSingle();

    if (acc?.id) return acc.id;

    const { data: ins, error: insErr } = await sb
        .from("accounts")
        .insert({ account_hash: hash, label })
        .select("id")
        .single();

    if (ins?.id) return ins.id;

    const { data: acc2 } = await sb
        .from("accounts")
        .select("id")
        .eq("account_hash", hash)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (acc2?.id) return acc2.id;

    throw new Error(insErr?.message || error?.message || "Failed to ensure account");
}

/** GET: return latest approved state (or zeros) */
export async function GET() {
    try {
        const { data, error } = await sb
            .from("snapshots")
            .select("raw_json")
            .eq("approved", true)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;

        const raw = (data as any)?.raw_json ?? {};
        const items = normCounts(raw.items);
        const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : null;

        return NextResponse.json(
            { items, updatedAt } as VaultState,
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch {
        return NextResponse.json(
            { items: ZERO, updatedAt: null } as VaultState,
            { headers: { "Cache-Control": "no-store" } }
        );
    }
}

/** POST: save state (admin) + increment cumulative items_acquired on positive deltas */
export async function POST(req: NextRequest) {
    // auth
    const authHeader = req.headers.get("authorization") ?? "";
    const xHeader = req.headers.get("x-admin-token") ?? "";
    let provided = "";
    if (authHeader.toLowerCase().startsWith("bearer ")) provided = authHeader.slice(7).trim();
    else if (xHeader) provided = xHeader.trim();

    const expected = (process.env.ADMIN_TOKEN ?? "").trim();
    if (!expected) return NextResponse.json({ error: "Admin token not configured" }, { status: 500 });
    if (provided !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // body
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const newCounts = normCounts(body?.items ?? body);
    const payload: VaultState = { items: newCounts, updatedAt: new Date().toISOString() };

    try {
        // sidste approved til delta
        const { data: last } = await sb
            .from("snapshots")
            .select("raw_json")
            .eq("approved", true)
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

        const prevCounts = normCounts((last as any)?.raw_json?.items);

        const inc =
            Math.max(0, newCounts.tbow - prevCounts.tbow) +
            Math.max(0, newCounts.scythe - prevCounts.scythe) +
            Math.max(0, newCounts.staff - prevCounts.staff);

        // konto-id (NOT NULL fix)
        const accountId = await ensureAccountId();

        // hash af payload (NOT NULL fix for payload_hash)
        const payloadJson = JSON.stringify(payload);
        const payloadHash = crypto.createHash("sha256").update(payloadJson).digest("hex");

        // skriv snapshot
        const { data: snap, error: snapErr } = await sb
            .from("snapshots")
            .insert({
                account_id: accountId,
                ts_unix: Math.floor(Date.now() / 1000),
                nonce: crypto.randomUUID(),
                payload_hash: payloadHash,
                raw_json: payload,
                approved: true,
            })
            .select("id")
            .single();
        if (snapErr || !snap) throw new Error(snapErr?.message ?? "snapshot insert failed");

        // snapshot_items (tre rækker)
        const itemRows = [
            { snapshot_id: snap.id, item_id: ITEM_IDS.tbow,   qty: newCounts.tbow },
            { snapshot_id: snap.id, item_id: ITEM_IDS.scythe, qty: newCounts.scythe },
            { snapshot_id: snap.id, item_id: ITEM_IDS.staff,  qty: newCounts.staff },
        ];
        const { error: itemsErr } = await sb.from("snapshot_items").insert(itemRows);
        if (itemsErr) throw new Error(itemsErr.message);

        // opdater kumulativ counter
        if (inc > 0) {
            const { data: ctr } = await sb
                .from("counters")
                .select("count")
                .eq("key", "items_acquired")
                .maybeSingle();

            if (ctr) {
                await sb
                    .from("counters")
                    .update({ count: Number(ctr.count || 0) + inc, updated_at: new Date().toISOString() })
                    .eq("key", "items_acquired");
            } else {
                await sb.from("counters").insert({ key: "items_acquired", count: inc });
            }
        }

        return NextResponse.json(
            { ok: true, snapshotId: snap.id },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (err: any) {
        return NextResponse.json({ error: err?.message ?? "Failed to save" }, { status: 500 });
    }
}
