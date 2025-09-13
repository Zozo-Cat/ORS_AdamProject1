"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Metrics = {
    priceUsd: number | null;
    liquidityUsd: number | null;
    fdvUsd: number | null;
    mcapUsd: number | null;
    vol24: number | null;
    ch24: number | null;
    ch5m: number | null;
    pairUrl: string | null;
    dexId: string | null;
} | null;

function formatUSD(n: number | null, opts?: Intl.NumberFormatOptions) {
    if (n == null || Number.isNaN(n)) return "—";
    const abs = Math.abs(n);
    const maximumFractionDigits =
        abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6; // mere præcision for små priser
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits,
        ...opts,
    }).format(n);
}

function formatPct(n: number | null) {
    if (n == null || Number.isNaN(n)) return "—";
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
}

export default function VaultPage() {
    const [data, setData] = useState<{ ok: boolean; configured: boolean; metrics: Metrics } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch("/api/metrics", { cache: "no-store" });
                const json = await res.json();
                if (!cancelled) {
                    setData(json);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        const id = setInterval(load, 20_000); // opdatér hvert 20. sekund
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, []);

    const m = data?.metrics ?? null;

    // Placeholder “bank” items (kan erstattes med rigtige sprites senere)
    const items = Array.from({ length: 28 }).map((_, i) => ({
        id: i + 1,
        color: ["#ffd36b", "#9ad17b", "#7bd3ff", "#ff9bd3"][i % 4],
    }));

    return (
        <div className="min-h-screen bg-[#0e0c0a] text-white">
            <header className="border-b border-[#2b2520] bg-[#0f0c0a]/90">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                    <h1 className="text-[#F8E7A1] drop-shadow-[0_2px_0_#000]">OSRS Vault</h1>
                    <Link href="/" className="text-xs underline opacity-80 hover:opacity-100">
                        Back
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6">
                {/* Metrics */}
                <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <MetricCard label="Price" value={loading ? "…" : formatUSD(m?.priceUsd)} />
                    <MetricCard label="24h Vol" value={loading ? "…" : formatUSD(m?.vol24)} />
                    <MetricCard label="Liquidity" value={loading ? "…" : formatUSD(m?.liquidityUsd)} />
                    <MetricCard label="FDV / MC" value={loading ? "…" : formatUSD(m?.mcapUsd ?? m?.fdvUsd)} />
                    <MetricCard
                        label="Change 24h"
                        value={
                            loading ? "…" : (
                                <span className={m?.ch24 != null && m.ch24 >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {formatPct(m?.ch24)}
                </span>
                            )
                        }
                    />
                </section>

                {/* Dex link / status */}
                <section className="rounded-lg border border-[#2b2520] bg-[#14100e]/70 p-3 text-sm">
                    {!data?.configured ? (
                        <div className="opacity-80">
                            <b>Token not configured.</b> Sæt <code>NEXT_PUBLIC_TOKEN_CA</code> i <code>.env.local</code> for at aktivere live metrics.
                        </div>
                    ) : m ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="opacity-80">Data via Dexscreener</span>
                            {m.pairUrl && (
                                <a
                                    href={m.pairUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline decoration-dotted hover:opacity-100 opacity-80"
                                >
                                    View pair
                                </a>
                            )}
                            {m.dexId && <span className="opacity-60">({m.dexId})</span>}
                        </div>
                    ) : (
                        <div className="opacity-80">Ingen Solana-par fundet for den angivne token endnu.</div>
                    )}
                </section>

                {/* Bank panel */}
                <section className="rounded-xl border border-[#2b2520] bg-[#191513]/80 shadow-[0_0_0_1px_#000_inset]">
                    <div className="flex items-center justify-between rounded-t-xl border-b border-[#2b2520] bg-[#0f0c0a]/80 px-4 py-2">
                        <div className="text-[#F8E7A1]">OSRS Vault</div>
                        <div className="text-xs opacity-70">?</div>
                    </div>

                    <div className="grid grid-cols-[56px_1fr] gap-0">
                        {/* Sidebar tabs */}
                        <aside className="border-r border-[#2b2520] bg-[#15110f]/70 p-2 space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-10 w-10 rounded bg-[#2a221a] border border-[#3a2f25] mx-auto" />
                            ))}
                        </aside>

                        {/* Items grid */}
                        <div className="p-3">
                            <div className="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-10 gap-2">
                                {items.map((it) => (
                                    <div
                                        key={it.id}
                                        className="aspect-square rounded border border-[#3a2f25] bg-[#0e0b09] flex items-center justify-center"
                                    >
                                        <div className="h-7 w-7 rounded-sm" style={{ background: it.color }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="rounded-b-xl border-t border-[#2b2520] bg-[#0f0c0a]/80 px-3 py-2 text-[11px] text-[#f1e7c6]">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-[#2b1f1a] border border-[#3a2f25]">Swap</span>
                                <span className="px-2 py-1 rounded bg-[#1b1a1a] border border-[#3a2f25] opacity-70">Insert</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded bg-[#2b1f1a] border border-[#3a2f25]">Item</span>
                                <span className="px-2 py-1 rounded bg-[#1b1a1a] border border-[#3a2f25] opacity-70">Note</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>Quantity:</span>
                                {["1", "5", "10", "X", "All"].map((q) => (
                                    <span
                                        key={q}
                                        className={`px-2 py-1 rounded border border-[#3a2f25] ${
                                            q === "All" ? "bg-[#2b1f1a]" : "bg-[#1b1a1a] opacity-80"
                                        }`}
                                    >
                    {q}
                  </span>
                                ))}
                            </div>
                            <div className="ml-auto opacity-70">🔒</div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-[#2b2520] bg-[#14100e]/70 p-3 text-center">
            <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
            <div className="mt-1 text-sm text-[#f1e7c6]">{value}</div>
        </div>
    );
}
