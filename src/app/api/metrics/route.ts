import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type DexPair = {
    chainId: string;
    dexId?: string;
    url?: string;
    pairAddress?: string;
    priceUsd?: string;
    fdv?: number;
    marketCap?: number;
    liquidity?: { usd?: number };
    volume?: { h24?: number };
    priceChange?: { h24?: number; m5?: number; h1?: number };
};

type DexMetrics = {
    priceUsd: number | null;
    liquidityUsd: number | null;
    fdvUsd: number | null;
    mcapUsd: number | null;
    vol24: number | null;
    ch24: number | null;
    ch5m: number | null;
    pairUrl: string | null;
    dexId: string | null;
};

async function fetchDexMetrics(): Promise<{
    configured: boolean;
    metrics: DexMetrics | null;
    error?: string;
    statusCode?: number;
}> {
    const token = process.env.NEXT_PUBLIC_TOKEN_CA;

    // Ikke sat endnu → svar pænt så UI kan vise placeholder
    if (!token || token === "REPLACE_WITH_REAL_SOLANA_MINT") {
        return { configured: false, metrics: null };
    }

    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
            next: { revalidate: 15 }, // skån API’et en smule
            headers: { "User-Agent": "osrs-vault/1.0 (+nextjs)" },
        });

        if (!res.ok) {
            return {
                configured: true,
                metrics: null,
                error: `dexscreener ${res.status}`,
                statusCode: 502,
            };
        }

        const json = await res.json();
        const pairs: DexPair[] = (json?.pairs ?? []).filter((p: DexPair) => p.chainId === "solana");

        if (pairs.length === 0) {
            return { configured: true, metrics: null };
        }

        // Vælg den “bedste” pair = højest likviditet
        const best = pairs.reduce((a, b) => ((b.liquidity?.usd ?? 0) > (a.liquidity?.usd ?? 0) ? b : a));

        const priceUsd = best.priceUsd ? Number(best.priceUsd) : null;
        const liquidityUsd = best.liquidity?.usd ?? null;
        const fdvUsd = best.fdv ?? null;
        const mcapUsd = best.marketCap ?? best.fdv ?? null;
        const vol24 = best.volume?.h24 ?? null;
        const ch24 = best.priceChange?.h24 ?? null;
        const ch5m = best.priceChange?.m5 ?? null;
        const pairUrl =
            best.url ?? (best.pairAddress ? `https://dexscreener.com/${best.chainId}/${best.pairAddress}` : null);

        return {
            configured: true,
            metrics: { priceUsd, liquidityUsd, fdvUsd, mcapUsd, vol24, ch24, ch5m, pairUrl, dexId: best.dexId ?? null },
        };
    } catch (e: any) {
        return {
            configured: true,
            metrics: null,
            error: e?.message ?? "unknown",
            statusCode: 500,
        };
    }
}

async function fetchItemsAcquired(): Promise<{ configured: boolean; itemsAcquired: number }> {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const configured = Boolean(url && key);

    if (!configured) {
        // Supabase ikke konfigureret endnu → returnér 0
        return { configured: false, itemsAcquired: 0 };
    }

    const sb = createClient(url!, key!, { auth: { persistSession: false } });

    try {
        const { data, error } = await sb
            .from("counters")
            .select("count")
            .eq("key", "items_acquired")
            .maybeSingle();

        if (error) {
            // Fall back til 0, men markér som konfigureret
            return { configured: true, itemsAcquired: 0 };
        }

        return { configured: true, itemsAcquired: Number((data as any)?.count ?? 0) };
    } catch {
        return { configured: true, itemsAcquired: 0 };
    }
}

export async function GET() {
    const [dex, counter] = await Promise.all([fetchDexMetrics(), fetchItemsAcquired()]);

    // Hvis Dex er konfigureret men fejlede, returnér samme semantik som før (502/500) — men med itemsAcquired med i body.
    if (dex.configured && dex.error) {
        return NextResponse.json(
            {
                ok: false,
                configured: true,
                configuredParts: { dex: dex.configured, supabase: counter.configured },
                error: dex.error,
                metrics: null,
                itemsAcquired: counter.itemsAcquired,
            },
            { status: dex.statusCode ?? 500 }
        );
    }

    // Success eller ikke konfigureret
    return NextResponse.json(
        {
            ok: true,
            configured: dex.configured, // for backwards compatibility (betyder “dex token sat”)
            configuredParts: { dex: dex.configured, supabase: counter.configured },
            metrics: dex.metrics,        // kan være null hvis ikke konfigureret
            itemsAcquired: counter.itemsAcquired,
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}
