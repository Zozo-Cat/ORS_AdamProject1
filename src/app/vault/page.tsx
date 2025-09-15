"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BankPanel, { type BankItem } from "@/components/BankPanel";

const X_URL = process.env.NEXT_PUBLIC_X_URL || "https://x.com/";
const TG_URL = process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL || "/#buy";

type AdminItems = { tbow?: number; scythe?: number; staff?: number };
type AdminState = { items: AdminItems; updatedAt?: string | null };
const ICONS = { tbow: "/drops/tbow.png", scythe: "/drops/scythe.png", staff: "/drops/staff.png" } as const;

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
    const [vaultValue, setVaultValue] = useState<number | null>(null);

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
                const json = await res.json();
                if (alive) setVaultValue(Number(json?.totalGp) || 0);
            } catch {
                if (alive) setVaultValue(0);
            }
        };

        const refreshAll = () => {
            loadState();
            loadPrices();
        };

        refreshAll();

        // Poll faster (10s)
        const id = setInterval(refreshAll, 10_000);

        // Refresh when tab becomes active again
        const onVis = () => {
            if (!document.hidden) refreshAll();
        };
        document.addEventListener("visibilitychange", onVis);

        return () => {
            alive = false;
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, []);

    // Build items from counts
    const items: BankItem[] = [];
    const counts = state?.items || {};
    if ((counts.tbow ?? 0) > 0) items.push({ id: "tbow", icon: ICONS.tbow, qty: counts.tbow! });
    if ((counts.scythe ?? 0) > 0) items.push({ id: "scythe", icon: ICONS.scythe, qty: counts.scythe! });
    if ((counts.staff ?? 0) > 0) items.push({ id: "staff", icon: ICONS.staff, qty: counts.staff! });

    // Title shows value (no layout change)
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
                <BankPanel title={title} items={items} />

                <section className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-[#2b2520] bg-[#0f0c0a]/90 px-4 py-3 shadow-[0_0_0_1px_#000_inset]">
                    <div className="flex items-center gap-3">
                        <SocialIcon href={X_URL} src="/social/x.svg" alt="X" />
                        <SocialIcon href={TG_URL} src="/social/telegram.svg" alt="Telegram" />
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
