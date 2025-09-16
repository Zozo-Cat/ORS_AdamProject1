// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import BackToVaultButton from "@/components/BackToVaultButton";

// Make sure this page is not statically rendered
export const dynamic = "force-dynamic";

/* ---------- types & defaults ---------- */
type VaultState = {
    items: { tbow: number; scythe: number; staff: number }; // Tumeken's Shadow == staff
    updatedAt: string | null;
};

const DEFAULT_STATE: VaultState = {
    items: { tbow: 0, scythe: 0, staff: 0 },
    updatedAt: null,
};

/** Gør vilkårlig JSON sikker at bruge i UI */
function normalize(raw: any): VaultState {
    const r = raw ?? {};
    const i = r.items ?? {};
    const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    return {
        items: {
            tbow: num(i.tbow),
            scythe: num(i.scythe),
            staff: num(i.staff),
        },
        updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : null,
    };
}

/* ===================================================================== */

export default function AdminPage() {
    // simpelt “login” – vi gemmer token lokalt og sender det i header til API’et
    const [token, setToken] = useState("");
    const [authed, setAuthed] = useState(false);

    const [state, setState] = useState<VaultState>(DEFAULT_STATE);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    // Når vi er logget ind, hent nuværende state (GET er public i vores setup)
    useEffect(() => {
        if (!authed) return;
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/state", { cache: "no-store" });
                if (res.ok) {
                    const json = await res.json();
                    if (alive) setState(normalize(json));
                } else {
                    if (alive) setMsg(`Failed to load state (HTTP ${res.status})`);
                }
            } catch {
                if (alive) setMsg("Failed to load state.");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [authed]);

    const updatedLabel = useMemo(() => {
        if (!state.updatedAt) return "never";
        try {
            const d = new Date(state.updatedAt);
            return d.toLocaleString();
        } catch {
            return state.updatedAt;
        }
    }, [state.updatedAt]);

    async function save() {
        setSaving(true);
        setMsg(null);
        try {
            const res = await fetch("/api/state", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": token, // API validerer dette imod ADMIN_TOKEN
                },
                body: JSON.stringify(state),
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                setMsg(`Save failed (HTTP ${res.status})${t ? " - " + t : ""}`);
            } else {
                setMsg("Saved ✓");
            }
        } catch {
            setMsg("Save failed.");
        } finally {
            setSaving(false);
        }
    }

    // —— Reset “Items Acquired” tælleren (landing page metric) ——
    async function resetItemsAcquired() {
        setResetting(true);
        setMsg(null);
        try {
            const res = await fetch("/api/metrics/reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": token, // samme access code som til Save
                },
            });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                setMsg(`Reset failed (HTTP ${res.status})${t ? " - " + t : ""}`);
            } else {
                setMsg("Items acquired reset ✓");
            }
        } catch {
            setMsg("Reset failed.");
        } finally {
            setResetting(false);
        }
    }

    // —— Verificér login ved at POST'e nuværende state tilbage (no-op write) ——
    async function verifyAndLogin() {
        const code = token.trim();
        if (!code) {
            setMsg("Please enter the access code.");
            return;
        }
        setVerifying(true);
        setMsg(null);
        try {
            // 1) Hent aktuel state (public)
            const getRes = await fetch("/api/state", { cache: "no-store" });
            if (!getRes.ok) {
                const t = await getRes.text().catch(() => "");
                setMsg(`Login failed: cannot read state (HTTP ${getRes.status})${t ? " - " + t : ""}`);
                return;
            }
            const current = await getRes.json();

            // 2) POST samme state med token som auth-check (skal give 200 ved korrekt kode)
            const postRes = await fetch("/api/state", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-token": code,
                },
                body: JSON.stringify(current),
            });

            if (postRes.ok) {
                setAuthed(true);
                setMsg(null);
            } else {
                const t = await postRes.text().catch(() => "");
                setMsg(`Access denied (HTTP ${postRes.status})${t ? " - " + t : ""}`);
            }
        } catch {
            setMsg("Login failed.");
        } finally {
            setVerifying(false);
        }
    }

    /* ---- Login view ---- */
    if (!authed) {
        return (
            <div className="min-h-screen bg-[#0e0c0a] text-white grid place-items-center px-4">
                {/* Tilbage-knap øverst til venstre */}
                <div className="fixed top-4 left-4 z-50">
                    <BackToVaultButton />
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault(); // undgå page reload
                        verifyAndLogin();
                    }}
                    className="w-full max-w-sm rounded-lg border border-[#2b2520] bg-[#14100e]/90 p-4 shadow-[0_0_0_1px_#000_inset]"
                >
                    <h1 className="text-lg mb-3" style={{ textShadow: "0 1px 0 #000" }}>
                        Admin Login
                    </h1>

                    <label className="block text-sm mb-1 opacity-80">Access code</label>
                    <input
                        type="password"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        autoFocus
                        disabled={verifying}
                        className="w-full rounded-md border border-[#3a2f25] bg-[#0f0c0a] px-3 py-2 outline-none focus:border-[#5a4635] disabled:opacity-60"
                    />

                    <button
                        type="submit"
                        disabled={verifying}
                        className="mt-3 w-full rounded-md border border-[#3a2f25] bg-[#2b1f1a] px-3 py-2 text-[#F8E7A1] hover:bg-[#3a2a20] transition-colors disabled:opacity-50"
                        style={{ textShadow: "0 1px 0 #000" }}
                    >
                        {verifying ? "Checking…" : "Enter"}
                    </button>

                    {msg && <p className="mt-2 text-sm opacity-80">{msg}</p>}
                    <p className="mt-3 text-xs opacity-60">
                        The code will be controlled before access is granted.
                    </p>
                </form>
            </div>
        );
    }

    /* ---- Editor view ---- */
    return (
        <div className="min-h-screen bg-[#0e0c0a] text-white px-4 py-6">
            <div className="mx-auto max-w-2xl space-y-4">
                {/* Tilbage-knap øverst */}
                <BackToVaultButton />

                <h1 className="text-xl" style={{ textShadow: "0 1px 0 #000" }}>
                    Admin – OSRS Vault Items
                </h1>

                <div className="rounded-lg border border-[#2b2520] bg-[#14100e]/90 p-4 shadow-[0_0_0_1px_#000_inset]">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ItemField
                            label="Twisted Bow"
                            value={state.items.tbow}
                            onChange={(v) =>
                                setState((s) => ({ ...s, items: { ...s.items, tbow: v } }))
                            }
                        />
                        <ItemField
                            label="Scythe of Vitur"
                            value={state.items.scythe}
                            onChange={(v) =>
                                setState((s) => ({ ...s, items: { ...s.items, scythe: v } }))
                            }
                        />
                        <ItemField
                            label="Tumeken's Shadow"
                            value={state.items.staff}
                            onChange={(v) =>
                                setState((s) => ({ ...s, items: { ...s.items, staff: v } }))
                            }
                        />
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={save}
                            disabled={saving}
                            className="rounded-md border border-[#3a2f25] bg-[#2b1f1a] px-4 py-2 text-[#F8E7A1] hover:bg-[#3a2a20] transition-colors disabled:opacity-50"
                            style={{ textShadow: "0 1px 0 #000" }}
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>

                        <span className="text-sm opacity-70">
              Last updated: {loading ? "loading…" : updatedLabel}
            </span>
                    </div>

                    {/* Reset sektion – kun Items Acquired tælleren */}
                    <div className="mt-6 pt-4 border-t border-[#2b2520]">
                        <div className="text-sm opacity-80 mb-2">Items acquired counter</div>
                        <button
                            onClick={resetItemsAcquired}
                            disabled={resetting}
                            className="rounded-md border border-[#3a2f25] bg-[#1d2014] px-3 py-2 text-[#E6F4A1] hover:bg-[#262a1b] transition-colors disabled:opacity-50"
                            style={{ textShadow: "0 1px 0 #000" }}
                        >
                            {resetting ? "Resetting…" : "Reset Items Acquired"}
                        </button>
                    </div>

                    {msg && <p className="mt-3 text-sm opacity-80">{msg}</p>}
                </div>
            </div>
        </div>
    );
}

/* ---------- small number field ---------- */
function ItemField({
                       label,
                       value,
                       onChange,
                   }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <label className="block">
            <div className="mb-1 text-sm opacity-80">{label}</div>
            <input
                type="number"
                inputMode="numeric"
                value={Number.isFinite(value) ? value : 0}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
                className="w-full rounded-md border border-[#3a2f25] bg-[#0f0c0a] px-3 py-2 outline-none focus:border-[#5a4635]"
            />
        </label>
    );
}
