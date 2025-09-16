// no "use client" needed here (no hooks)
import Link from "next/link";

export default function BackToVaultButton() {
    return (
        <Link
            href="/vault"
            className="inline-flex items-center gap-2 rounded-md border border-[#3a2f25] bg-[#1b1a1a] px-3 py-1.5 text-sm text-[#f1e7c6] shadow-[0_0_0_1px_#000_inset] hover:bg-[#2b1f1a] transition-colors"
            style={{ textShadow: "0 1px 0 #000" }}
            aria-label="Back to Vault"
            title="Back to Vault"
        >
            ← Back
        </Link>
    );
}