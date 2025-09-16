'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BackToVaultButton({ fallback = '/vault' }: { fallback?: string }) {
    const router = useRouter();
    const sp = useSearchParams();
    const from = sp.get('from') || fallback;
    return (
        <button
            onClick={() => router.push(from)}
            className="px-3 py-2 rounded-xl border text-sm hover:bg-neutral-100 text-black bg-white"
        >
            ← Back to Vault
        </button>
    );
}
