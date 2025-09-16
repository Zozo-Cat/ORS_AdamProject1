// src/components/BankPanel.tsx
"use client";

import { useMemo, useRef } from "react";

/* ---------------- helpers ---------------- */
export function formatWithDots(n: number): string {
    const sign = n < 0 ? "-" : "";
    const s = Math.floor(Math.abs(n)).toString();
    return sign + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function formatOsrsNumber(n: number, opts?: { abbrFrom?: number }) {
    const abbrFrom = opts?.abbrFrom ?? 100_000_000;
    if (n >= abbrFrom) {
        if (n >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)}B`;
        return `${Math.round(n / 1_000_000)}M`;
    }
    return formatWithDots(n);
}

/* ---------------- types ---------------- */
export type BankItem = { id: string | number; icon: string; qty: number };

/* shared classes for little beveled tiles */
const tileClass =
    "rounded-md border border-[#2b2520] bg-[#1a1411]/80 shadow-[0_0_0_1px_#000_inset]";

/* ---------------- component ---------------- */
export default function BankPanel({
                                      title,
                                      capacity, // optional & ignored (kept for compatibility)
                                      items,
                                  }: {
    title: string;
    capacity?: number;
    items: BankItem[];
}) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const tileStyle = useMemo<React.CSSProperties>(
        () => ({
            backgroundImage:
                "url('/ui/bgs/bank-tile.webp'), url('/ui/bgs/bank-tile.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
            backgroundPosition: "0 0",
        }),
        []
    );

    const scrollBy = (dy: number) => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ top: dy, behavior: "smooth" });
    };

    return (
        <section className="rounded-2xl border border-[#2b2520] bg-[#120f0c] shadow-[0_0_0_1px_#000_inset]">
            {/* Topbar */}
            <div className="relative border-b border-[#2b2520] bg-[#1a1411]/85 px-5 py-3">
                {/* left cluster (∞ +) — same size as sidebar tiles */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <ImgBtn src="/ui/icons/tab-all.png" alt="All" size={52} imgH={28} />
                    <ImgBtn src="/ui/icons/tab-add.png" alt="Add" size={52} imgH={28} />
                </div>

                {/* centered title (capacity removed) */}
                <h2
                    className="text-center text-[#F8E7A1]"
                    style={{ fontSize: "32px", letterSpacing: "1px", textShadow: "0 2px 0 #000" }}
                >
                    {title}
                </h2>

                {/* right cluster (help/lock) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <ImgBtn src="/ui/icons/btn-help.png" alt="Help" />
                    <ImgBtn src="/ui/icons/btn-lock.png" alt="Lock" />
                </div>
            </div>

            {/* content with sidebar + paper area */}
            <div className="relative">
                {/* Sidebar (left) */}
                <aside className="absolute left-3 top-4 z-[2] flex w-[56px] flex-col gap-3">
                    {[
                        "/ui/icons/tab-leaf.png",
                        "/ui/icons/tab-chest.png",
                        "/ui/icons/tab-unicorn.png",
                        "/ui/icons/tab-dagger.png",
                        "/ui/icons/tab-armour.png",
                    ].map((src, i) => (
                        <div key={i} className={`h-[52px] w-[52px] ${tileClass} grid place-items-center`}>
                            <img src={src} alt="" className="h-9 w-auto pointer-events-none" />
                        </div>
                    ))}
                </aside>

                {/* scrollable paper */}
                <div
                    ref={scrollRef}
                    className="relative ml-[72px] mr-[56px] min-h-[360px] max-h-[420px] overflow-y-auto overscroll-contain rounded-xl border border-[#2b2520] bg-[#0f0c0a]/60 p-6"
                    style={tileStyle}
                >
                    <div className="flex flex-wrap items-end justify-between gap-y-10">
                        {items.map((it) => (
                            <div key={it.id} className="flex flex-col items-center text-[#F8E7A1]">
                                <img src={it.icon} alt="" className="h-16 w-auto drop-shadow-[0_2px_0_#000]" />
                                {/* ↓ Viser KUN tal, hvis qty > 0 og ikke spacer */}
                                {it.id !== "_spacer" && Number.isFinite(it.qty) && it.qty > 0 && (
                                    <div className="mt-2" style={{ textShadow: "0 2px 0 #000", fontSize: "22px" }}>
                                        {formatOsrsNumber(it.qty, { abbrFrom: 100_000_000 })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll rail (right) */}
                <div className="absolute right-3 top-4 z-[2] flex w-[32px] flex-col items-center gap-2">
                    <ImgBtn src="/ui/icons/tab-chevron-up.png" alt="Up" onClick={() => scrollBy(-220)} />
                    <div className={`h-[220px] w-[26px] ${tileClass}`} />
                    <ImgBtn src="/ui/icons/tab-chevron-down.png" alt="Down" onClick={() => scrollBy(220)} />
                </div>
            </div>

            {/* Bottom bar — closer to OSRS */}
            <div className="flex flex-wrap items-center gap-4 border-t border-[#2b2520] bg-[#1a1411]/85 px-4 py-3 text-[#f1e7c6]">
                <Label>Rearrange mode:</Label>
                <Pill active>Swap</Pill>
                <Pill>Insert</Pill>

                <Divider />

                <Label>Withdraw as:</Label>
                <Pill active>Item</Pill>
                <Pill>Note</Pill>

                <Divider />

                <Label>Quantity:</Label>
                <Pill small active>1</Pill>
                <Pill small>5</Pill>
                <Pill small>10</Pill>
                <Pill small>X</Pill>

                <div className="ml-auto" />

                {/* tools at far right like reference */}
                <ToolTile src="/ui/icons/tool-search.png" alt="Search" />
                <ToolTile src="/ui/icons/tool-pack.png" alt="Pack" />
                <ToolTile src="/ui/icons/tool-options.png" alt="Options" />

                {/* red “All” */}
                <Pill strongRed>All</Pill>
            </div>
        </section>
    );
}

/* ---------------- tiny UI atoms ---------------- */

function ImgBtn({
                    src,
                    alt,
                    onClick,
                    size = 28,
                    imgH = 18,
                }: {
    src: string;
    alt: string;
    onClick?: () => void;
    size?: number;
    imgH?: number;
}) {
    return (
        <button
            onClick={onClick}
            className={`${tileClass} grid place-items-center`}
            style={{ width: size, height: size }}
            aria-label={alt}
        >
            <img src={src} alt="" className="pointer-events-none" style={{ height: imgH }} />
        </button>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <span className="opacity-80" style={{ textShadow: "0 1px 0 #000", letterSpacing: "0.5px" }}>
      {children}
    </span>
    );
}

function Divider() {
    return <div className="mx-2 h-4 w-px bg-[#2b2520]" />;
}

function Pill({
                  children,
                  active,
                  strong,
                  strongRed,
                  small,
              }: {
    children: React.ReactNode;
    active?: boolean;
    strong?: boolean;
    strongRed?: boolean;
    small?: boolean;
}) {
    const base = [
        "inline-flex items-center justify-center rounded-md border px-3",
        small ? "h-7 text-sm" : "h-8",
        "shadow-[0_0_0_1px_#000_inset]",
    ];
    let theme = "border-[#2b2520] bg-[#1b1a1a] text-[#f1e7c6]/90";
    if (active) theme = "border-[#2b2520] bg-[#2b1f1a] text-[#f1e7c6]";
    if (strong) theme = "border-[#3a2f25] bg-[#2b1f1a] text-[#f1e7c6]";
    if (strongRed) theme = "border-[#5b140e] bg-[#8e2014] text-[#ffe7b0]";
    return (
        <span className={[...base, theme].join(" ")} style={{ textShadow: "0 1px 0 #000" }}>
      {children}
    </span>
    );
}

function ToolTile({ src, alt }: { src: string; alt: string }) {
    return (
        <span className={`${tileClass} grid h-9 w-9 place-items-center`}>
      <img src={src} alt={alt} className="h-5 w-auto pointer-events-none" />
    </span>
    );
}
