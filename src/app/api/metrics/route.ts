import { NextResponse } from "next/server";

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

export async function GET() {
    const token = process.env.NEXT_PUBLIC_TOKEN_CA;

    // Ikke sat endnu → svar pænt så UI kan vise placeholder
    if (!token || token === "REPLACE_WITH_REAL_SOLANA_MINT") {
        return NextResponse.json({ ok: true, configured: false });
    }

    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`, {
            // Next.js kan cache i et par sekunder for at skåne API’et
            next: { revalidate: 15 },
            // Dexscreener tillader CORS, men vi proxy’er alligevel
            headers: { "User-Agent": "osrs-vault/1.0 (+nextjs)" },
        });

        if (!res.ok) {
            return NextResponse.json({ ok: false, configured: true, error: `dexscreener ${res.status}` }, { status: 502 });
        }

        const json = await res.json();
        const pairs: DexPair[] = (json?.pairs ?? []).filter((p: DexPair) => p.chainId === "solana");

        if (pairs.length === 0) {
            return NextResponse.json({ ok: true, configured: true, metrics: null, pairs: [] });
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
        const pairUrl = best.url ?? (best.pairAddress ? `https://dexscreener.com/${best.chainId}/${best.pairAddress}` : null);

        return NextResponse.json({
            ok: true,
            configured: true,
            metrics: { priceUsd, liquidityUsd, fdvUsd, mcapUsd, vol24, ch24, ch5m, pairUrl, dexId: best.dexId ?? null },
            // valgfrit at sende pairs med tilbage (kan bruges til debug)
            // pairs,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, configured: true, error: e?.message ?? "unknown" }, { status: 500 });
    }
}
