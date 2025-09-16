// src/app/api/state/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

type VaultState = {
    items: { tbow: number; scythe: number; staff: number };
    updatedAt: string | null;
};

const DEFAULT_STATE: VaultState = {
    items: { tbow: 0, scythe: 0, staff: 0 },
    updatedAt: null,
};

const ITEM_IDS = { tbow: 20997, scythe: 22486, staff: 27277 };

function normalize(raw: any): VaultState {
    const r = raw ?? {};
    const i = r.items ?? {};
    const num = (v: any) =>
        typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    return {
        items: { tbow: num(i.tbow), scythe: num(i.scythe), staff: num(i.staff) },
        updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null,
    };
}

/** GET – læs seneste approved snapshot via RPC-funktionen */
export async function GET() {
    try {
        const { data, error } = await sb.rpc("latest_approved_snapshot_totals");
        if (error) throw error;

        const r: any =
            Array.isArray(data) && data.length ? data[0] : (data as any) ?? null;
        if (!r) {
            return NextResponse.json(DEFAULT_STATE, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        const state: VaultState = {
            items: {
                tbow: Number(r.tbow) || 0,
                scythe: Number(r.scythe) || 0,
                staff: Number(r.staff) || 0,
            },
            updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
        };

        return NextResponse.json(state, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (err) {
        console.error("GET /api/state RPC failed:", err);
        return NextResponse.json(DEFAULT_STATE, {
            headers: { "Cache-Control": "no-store" },
        });
    }
}

/** POST – gem ny state som snapshot (+ snapshot_items) */
export async function POST(req: NextRequest) {
    try {
        // auth
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
            return NextResponse.json(
                { error: "Admin token not configured" },
                { status: 500 }
            );
        }
        if (provided !== expected) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // payload
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const merged = normalize({ items: (body?.items ?? body) as any });
        const payload: VaultState = {
            items: merged.items,
            updatedAt: new Date().toISOString(),
        };

        const nowSec = Math.floor(Date.now() / 1000);
        const nonce = crypto.randomUUID();
        const payloadJson = JSON.stringify(payload);
        const payloadHash = crypto
            .createHash("sha256")
            .update(payloadJson)
            .digest("hex");

        // find account
        const accountHash = (process.env.ADMIN_ACCOUNT_HASH ?? "demo-hash").trim();
        const { data: acc, error: accErr } = await sb
            .from("accounts")
            .select("id")
            .eq("account_hash", accountHash)
            .single();

        if (accErr || !acc) {
            return NextResponse.json(
                { error: `No account with account_hash=${accountHash}` },
                { status: 500 }
            );
        }

        const autoApprove =
            String(process.env.AUTO_APPROVE_SNAPSHOTS ?? "true").toLowerCase() ===
            "true";

        // insert snapshot
        const { data: snap, error: snapErr } = await sb
            .from("snapshots")
            .insert({
                account_id: acc.id,
                ts_unix: nowSec,
                nonce,
                payload_hash: payloadHash,
                raw_json: payload, // hele payload
                approved: autoApprove,
            })
            .select("id")
            .single();

        if (snapErr || !snap) {
            return NextResponse.json(
                { error: snapErr?.message ?? "snapshot insert failed" },
                { status: 500 }
            );
        }

        // insert tre rækker i snapshot_items
        const rows = [
            { snapshot_id: snap.id, item_id: ITEM_IDS.tbow, qty: payload.items.tbow },
            {
                snapshot_id: snap.id,
                item_id: ITEM_IDS.scythe,
                qty: payload.items.scythe,
            },
            { snapshot_id: snap.id, item_id: ITEM_IDS.staff, qty: payload.items.staff },
        ];
        const { error: itemsErr } = await sb.from("snapshot_items").insert(rows);
        if (itemsErr) {
            return NextResponse.json({ error: itemsErr.message }, { status: 500 });
        }

        return NextResponse.json(
            { ok: true, snapshotId: snap.id },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (err: any) {
        console.error("POST /api/state error:", err?.message || err);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
