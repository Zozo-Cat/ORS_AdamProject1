import { NextRequest, NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "nodejs"; // explicit runtime

const KEY = "vault/state.json";

type VaultState = {
    items: { tbow: number; scythe: number; staff: number }; // Tumeken's Shadow -> staff
    updatedAt: string | null;
};

const DEFAULT_STATE: VaultState = {
    items: { tbow: 0, scythe: 0, staff: 0 },
    updatedAt: null,
};

function num(v: any) {
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

function normalize(raw: any): VaultState {
    const r = raw ?? {};
    const i = r.items ?? {};
    return {
        items: {
            tbow: num(i.tbow),
            scythe: num(i.scythe),
            staff: num(i.staff),
        },
        updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null,
    };
}

/** GET: return current state (or default if none) */
export async function GET() {
    try {
        // Find den præcise nøgle (ikke bare første blob med prefix)
        const { blobs } = await list({ prefix: KEY, limit: 100 });
        const exact = blobs.find((b: any) => b.pathname === KEY) ?? blobs[0];

        if (!exact) {
            return NextResponse.json(DEFAULT_STATE, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        const res = await fetch(exact.url, { cache: "no-store" });

        if (!res.ok) {
            console.warn("state blob fetch not ok:", res.status, res.statusText);
            return NextResponse.json(DEFAULT_STATE, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (!ct.includes("application/json")) {
            const peek = (await res.text()).slice(0, 200);
            console.warn("state blob unexpected content-type:", ct, peek);
            return NextResponse.json(DEFAULT_STATE, {
                headers: { "Cache-Control": "no-store" },
            });
        }

        const json = await res.json();
        return NextResponse.json(normalize(json), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (err) {
        console.error("GET /api/state error:", err);
        // Vær yndefuld overfor UI'et
        return NextResponse.json(DEFAULT_STATE, {
            headers: { "Cache-Control": "no-store" },
        });
    }
}

/** POST: save new state (requires ADMIN_TOKEN) */
export async function POST(req: NextRequest) {
    try {
        // --- auth (bearer eller x-admin-token) ---
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

        // --- payload ---
        let body: any;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        // acceptér enten fuld state eller { items }
        const merged = normalize({
            items: (body?.items ?? body)?.items ?? body?.items ?? body,
            updatedAt: null,
        });

        const payload: VaultState = {
            items: merged.items,
            updatedAt: new Date().toISOString(),
        };

        // --- skriv blob (overskriv samme nøgle) ---
        await put(KEY, JSON.stringify(payload), {
            access: "public",
            contentType: "application/json",
            addRandomSuffix: false,
            allowOverwrite: true, // vigtigt for at undgå "already exists"
        });

        return NextResponse.json(
            { ok: true, state: payload },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (err: any) {
        console.error("POST /api/state error:", err?.message || err);
        return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }
}
