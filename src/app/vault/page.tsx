"use client";

import Link from "next/link";
import BankPanel, {
    formatOsrsNumber,
    formatWithDots,
    type BankItem,
} from "@/components/BankPanel";

/* ---------- Config (safe to leave as-is) ---------- */
const CAPACITY = 2_000;

// Social/CTA links (override with env if you have them)
const X_URL =
    process.env.NEXT_PUBLIC_X_URL ||
    "https://x.com/"; // e.g. https://x.com/yourhandle
const TG_URL =
    process.env.NEXT_PUBLIC_TELEGRAM_URL ||
    "https://t.me/"; // e.g. https://t.me/yourgroup
const BUY_URL =
    process.env.NEXT_PUBLIC_BUY_URL || "/#buy"; // point to your DEX/purchase link

/* ---------- Placeholder vault items (icons in /public/drops) ---------- */
const ITEMS: BankItem[] = [
    { id: "gp-1", icon: "/drops/gp.png", qty: 125_000_000 },
    { id: "tbow-1", icon: "/drops/tbow.png", qty: 1 },
    { id: "scythe-1", icon: "/drops/scythe.png", qty: 1 },
    { id: "stones-1", icon: "/drops/stones.png", qty: 142 },
    { id: "tbow-2", icon: "/drops/tbow.png", qty: 11 },
    { id: "stones-2", icon: "/drops/stones.png", qty: 48 },
    { id: "gp-2", icon: "/drops/gp.png", qty: 27_420 },
];

/* ---------- Small helpers for the metric row ---------- */
function totalGp(items: BankItem[]) {
    return items
        .filter((it) => it.icon.includes("gp.png"))
        .reduce((sum, it) => sum + (it.qty || 0), 0);
}

function totalQty(items: BankItem[]) {
    return items.reduce((sum, it) => sum + (it.qty || 0), 0);
}

export default function VaultPage() {
    // Fake stats (replace with backend when ready)
    const itemsBought = totalQty(ITEMS);
    const boughtValue = totalGp(ITEMS);
    const itemsDropped: number | null = null;
    const droppedValue: number | null = null;

    return (
        <div className="min-h-screen bg-[#0e0c0a] text-white">
            {/* Top bar with Back */}
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
                {/* Vault panel (unchanged) */}
                <BankPanel title={`OSRS Vault`} capacity={CAPACITY} items={ITEMS} />

                {/* Social + CTA bar */}
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

/* ----- little metric tile ----- */
function MetricCard({
                        label,
                        value,
                    }: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-[#2b2520] bg-[#14100e]/80 p-3 text-center shadow-[0_0_0_1px_#000_inset]">
            <div
                className="text-[11px] uppercase tracking-widest opacity-80"
                style={{ textShadow: "0 1px 0 #000", letterSpacing: "1px" }}
            >
                {label}
            </div>
            <div
                className="mt-1 text-lg text-[#F8E7A1]"
                style={{ textShadow: "0 2px 0 #000" }}
            >
                {value}
            </div>
        </div>
    );
}

/* ----- social icon pill ----- */
function SocialIcon({
                        href,
                        src,
                        alt,
                    }: {
    href: string;
    src: string;
    alt: string;
}) {
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
            {/* svgs are white; no styling so they stay crisp */}
            <img src={src} alt={alt} className="h-5 w-5" />
        </a>
    );
}
