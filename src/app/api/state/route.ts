import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---- Supabase client (server only) ----
const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

// ---- Item mapping (verify these IDs later) ----
const ITEM_IDS = {
    tbow: 20997,          // Twisted bow
    scytheUncharged: 22486, // Scythe of vitur (uncharged)  <-- verify
    shadowUncharged: 27277, // Tumeken's shadow (uncharged) <-- verify
};

type VaultState = {
    items: { tbow: number; scythe: number; staff: number }; // staff = Tumeken's Shadow
    updatedAt: string | null;
};

const DEFAULT_STATE: VaultState = {
    items: { tbow: 0, scythe: 0, staff: 0 },
    updatedAt: null,
};

function toInt(v: any) {
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

// ---- GET: læs aggregeret holdings fra DB og returnér for de 3 udvalgte ----
export async function GET() {
    try {
        // Hent seneste approved snapshot pr. konto (med created_at for "updatedAt")
        const { data: latest, error: latestErr } = await sb
            .from("latest_approved_snapshot")
            .select("snapshot_id, created_at");

        if (latestErr) {
            return NextResponse.json({ error: latestErr.message }, { status: 500 });
        }
        if (!latest?.length) {
            return NextResponse.json(DEFAULT_STATE, { headers: { "Cache-Control": "no-store" } });
        }

        const ids = latest.map((r: any) => r.snapshot_id);
        const { data: rows, error: rowsErr } = await sb
            .from("snapshot_items")
            .select("item_id, qty, snapshot_id")
            .in("snapshot_id", ids);

        if (rowsErr) {
            return NextResponse.json({ error: rowsErr.message }, { status: 500 });
        }

        // Sum pr item
        const sums = new Map<number, bigint>();
        for (const r of (rows ?? []) as any[]) {
            const cur = sums.get(r.item_id) ?? 0n;
            sums.set(r.item_id, cur + BigInt(r.qty));
        }

        // Map kun til de tre vi viser i admin/vault state
        const tbow = Number(sums.get(ITEM_IDS.tbow) ?? 0n);
        const scythe = Number(sums.get(ITEM_IDS.scytheUncharged) ?? 0n);
        const staff = Number(sums.get(ITEM_IDS.shadowUncharged) ?? 0n);

        // "Sidst opdateret" = nyeste created_at blandt de snapshots vi bruger
        const updatedAt =
            latest.map((r: any) => r.created_at).sort().slice(-1)[0] ?? null;

        const state: VaultState = {
            items: { tbow, scythe, staff },
            updatedAt,
        };

        return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
    } catch (err: any) {
        console.error("GET /api/state error:", err?.message ?? err);
        return NextResponse.json(DEFAULT_STATE, { headers: { "Cache-Control": "no-store" } });
    }
}

// ---- POST: accepter simpel state ELLER fuld items[], og skriv som approved snapshot ----
// Auth: ADMIN_TOKEN via Authorization: Bearer <token> ELLER x-admin-token header
export async function POST(req: NextRequest) {
    try {
        // Auth
        const authHeader = req.headers.get("authorization") ?? "";
        const xHeader = req.headers.get("x-admin-token") ?? "";
        let provided = "";

        if (authHeader.toLowerCase().startsWith("bearer ")) {
            provided = authHeader.slice(7).trim();
        } else if (xHeader) {
            provided = xHeader.trim();
        }

        const expected = (process.env.ADMIN_TOKEN ?? "").trim();
        if (!expected) {
            return NextResponse.json({ error: "Admin token not configured" }, { status: 500 });
        }
        if (provided !== expected) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Body
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // Understøt to formater:
        // A) { items: { tbow, scythe, staff } }
        // B) { items: [ { id, qty }, ... ] }
        let itemsArray: Array<{ id: number; qty: number }> = [];

        if (Array.isArray(body?.items)) {
            // format B – brug som det er
            itemsArray = (body.items as any[]).map((r) => ({
                id: Number(r.id),
                qty: toInt(r.qty),
            }));
        } else {
            // format A – map counts til rigtige item_id'er
            const counts = body?.items ?? body ?? {};
            const tbow = toInt(counts.tbow);
            const scythe = toInt(counts.scythe);
            const staff = toInt(counts.staff);

            itemsArray = [
                { id: ITEM_IDS.tbow, qty: tbow },
                { id: ITEM_IDS.scytheUncharged, qty: scythe },
                { id: ITEM_IDS.shadowUncharged, qty: staff },
            ].filter((r) => r.qty > 0);
        }

        // Find konto (seed: demo-hash – kan ændres senere)
        const { data: acc, error: accErr } = await sb
            .from("accounts")
            .select("id")
            .eq("account_hash", "demo-hash")
            .single();

        if (accErr || !acc) {
            return NextResponse.json({ error: "No account with account_hash=demo-hash" }, { status: 500 });
        }

        // Byg raw_json til historik/audit (gemmer de værdier vi fik)
        const raw_json = { items: itemsArray };

        // Indsæt snapshot (approved=true så vault opdaterer straks)
        const ts = Math.floor(Date.now() / 1000);
        const nonce = crypto.randomUUID();
        const payloadHash = crypto.createHash("sha256").update(JSON.stringify(raw_json)).digest("hex");

        const { data: snap, error: snapErr } = await sb
            .from("snapshots")
            .insert({
                account_id: acc.id,
                ts_unix: ts,
                nonce,
                payload_hash: payloadHash,
                raw_json,
                approved: true,
            })
            .select("id")
            .single();

        if (snapErr || !snap) {
            return NextResponse.json({ error: snapErr?.message ?? "snapshot insert failed" }, { status: 500 });
        }

        // Indsæt items
        if (itemsArray.length) {
            const rows = itemsArray.map((r) => ({
                snapshot_id: snap.id,
                item_id: r.id,
                qty: r.qty,
            }));
            const { error: itemsErr } = await sb.from("snapshot_items").insert(rows);
            if (itemsErr) {
                return NextResponse.json({ error: itemsErr.message }, { status: 500 });
            }
        }

        return NextResponse.json({ ok: true, snapshotId: snap.id }, { headers: { "Cache-Control": "no-store" } });
    } catch (err: any) {
        console.error("POST /api/state error:", err?.message ?? err);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
