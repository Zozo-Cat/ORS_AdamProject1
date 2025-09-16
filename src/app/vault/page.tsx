"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BankPanel, { type BankItem } from "@/components/BankPanel";

const X_URL  = process.env.NEXT_PUBLIC_X_URL  || "https://x.com/OSRSvault";
const pump_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://pump.fun/board";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL || "/#buy";
const DEX_URL = process.env.NEXT_PUBLIC_DEXSCREENER_URL || "https://dexscreener.com/";

type AdminItems = { tbow?: number; scythe?: number; staff?: number };
type AdminState = { items: AdminItems; updatedAt?: string | null };
const ICONS = { tbow: "/drops/tbow.png", scythe: "/drops/scythe.png", staff: "/drops/staff.png" } as const;

type PricesPayload = {
    generatedAt: string;
    source: "osrs-wiki";
    items: Array<{ id: number; name: string; qty: number; priceGp: number; subtotalGp: number }>;
    totalGp: number;
};

// item-ids vi bruger i /api/prices
const ITEM_IDS = {
    tbow: 20997,
    scythe: 22486, // uncharged
    staff: 27277,  // shadow uncharged
};

// tiny formatter to keep title short (k, m, b)
function fmtGpShort(n: number | null | undefined): string {
    if (!n || !Number.isFinite(n)) return "0";
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}b`;
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}m`;
    if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${Math.round(n)}`;
}

export default function VaultPage() {
    const [state, setState] = useState<AdminState | null>(null);

    // map af itemId -> priceGp (fra /api/prices)
    const [priceMap, setPriceMap] = useState<Record<number, number>>({});

    // hent state + priser og hold dem friske
    useEffect(() => {
        let alive = true;

        const loadState = async () => {
            try {
                const res = await fetch(`/api/state?r=${Date.now()}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as AdminState;
                if (alive) setState(json);
            } catch {
                if (alive) setState({ items: {} });
            }
        };

        const loadPrices = async () => {
            try {
                const res = await fetch(`/api/prices?r=${Date.now()}`, { cache: "no-store" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = (await res.json()) as PricesPayload;
                if (!alive) return;
                const m: Record<number, number> = {};
                for (const it of json.items || []) m[it.id] = Number(it.priceGp) || 0;
                setPriceMap(m);
            } catch {
                if (alive) setPriceMap({});
            }
        };

        const refreshAll = () => {
            loadState();
            loadPrices();
        };

        refreshAll();

        // Poll (10s)
        const id = setInterval(refreshAll, 10_000);

        // Refresh when tab becomes active
        const onVis = () => { if (!document.hidden) refreshAll(); };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            alive = false;
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    // Build items for panelet fra state
    const items: BankItem[] = [];
    const counts = state?.items || {};
    if ((counts.tbow ?? 0) > 0) items.push({ id: "tbow", icon: ICONS.tbow, qty: counts.tbow! });
    if ((counts.scythe ?? 0) > 0) items.push({ id: "scythe", icon: ICONS.scythe, qty: counts.scythe! });
    if ((counts.staff ?? 0) > 0) items.push({ id: "staff", icon: ICONS.staff, qty: counts.staff! });

    // Beregn titelværdi = (counts i UI) * (seneste wiki-pris)
    const vaultValue = useMemo(() => {
        const tbowVal   = (counts.tbow   || 0) * (priceMap[ITEM_IDS.tbow]   || 0);
        const scytheVal = (counts.scythe || 0) * (priceMap[ITEM_IDS.scythe] || 0);
        const staffVal  = (counts.staff  || 0) * (priceMap[ITEM_IDS.staff]  || 0);
        return tbowVal + scytheVal + staffVal;
    }, [counts.tbow, counts.scythe, counts.staff, priceMap]);

    const title = `OSRS Vault${vaultValue != null ? ` (${fmtGpShort(vaultValue)} GP)` : ""}`;

    return (
        <div className="min-h-screen bg-[#0e0c0a] text-white">
            <header className="border-b border-[#2b2520] bg-[#0f0c0a]/90">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
                    <Link
                        href="/"
                        className="rounded-md border border-[#3a2f25] bg-[#1b1a1a] px-3 py-1.5 text-sm text-[#f1e7c6] shadow-[0_0_0_1px_#000_inset] hover:bg-[#2b1f1a] transition-colors"
                        style={{ textShadow: "0 1px 0 #000" }}
                    >
                        ← Back
                    </Link>
                    <div className="flex-1" />
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
                {/* Bank-panel + usynligt H-hotspot i øverste højre hjørne */}
                <div className="relative">
                    <BankPanel title={title} items={items} />
                    <Link
                        href="/admin?from=vault"
                        aria-label="admin"
                        title=""
                        className="
              absolute top-2 right-2
              h-7 w-7
              opacity-0 hover:opacity-20 focus:opacity-20
              rounded
              outline-none
            "
                    />
                </div>

                {/* SoMe + CTA */}
                <section className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-[#2b2520] bg-[#0f0c0a]/90 px-4 py-3 shadow-[0_0_0_1px_#000_inset]">
                    <div className="flex items-center gap-3">
                        <SocialIcon href={X_URL}  src="/social/x.svg" alt="X" />
                        <SocialIcon href={pump_URL} src="/social/pumpfun.svg" alt="Pumpfun" />
                        {/* Dexscreener (sort ikon) */}
                        <SocialIcon href={DEX_URL} src="/social/dexscreener.svg" alt="Dexscreener" />
                    </div>
                    <a
                        href={BUY_URL}
                        target={BUY_URL.startsWith("http") ? "_blank" : undefined}
                        rel={BUY_URL.startsWith("http") ? "noreferrer" : undefined}
                        className="rounded-md border border-[#3a2f25] bg-[#2b1f1a] px-4 py-2 text-[#F8E7A1] shadow-[0_0_0_1px_#000_inset] hover:bg-[#3a2a20] transition-colors"
                        style={{ textShadow: "0 1px 0 #000", letterSpacing: "0.5px" }}
                    >
                        Buy $OSRS
                    </a>
                </section>
            </main>
        </div>
    );
}

function SocialIcon({ href, src, alt }: { href: string; src: string; alt: string }) {
    const external = href.startsWith("http");
    return (
        <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="h-9 w-9 grid place-items-center rounded-full border border-[#2b2520] bg-white/5 hover:bg-white/10 transition-colors shadow-[0_0_0_1px_#000_inset]"
            aria-label={alt}
            title={alt}
        >
            <img src={src} alt={alt} className="h-5 w-5" />
        </a>
    );
}
