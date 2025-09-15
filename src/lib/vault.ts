export type VaultState = {
    items: { tbow: number; scythe: number; staff: number };
    updatedAt: string | null;
};

export const DEFAULT_STATE: VaultState = {
    items: { tbow: 0, scythe: 0, staff: 0 },
    updatedAt: null,
};

export function normalize(raw: any): VaultState {
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
