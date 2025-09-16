import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------- Konstanter ----------
const TTL_MS = 10 * 60 * 1000; // 10 min cache
const UA = process.env.OSRS_WIKI_UA || "OSRS Vault (prices)";

const ITEM_DEFS = [
  { id: 20997, key: "tbow", name: "Twisted bow" },
  { id: 22486, key: "scytheUncharged", name: "Scythe of Vitur (uncharged)" },
  { id: 27277, key: "shadowUncharged", name: "Tumeken's Shadow (uncharged)" },
] as const;

// ---------- Cache (in-memory pr. lambda instans) ----------
type PriceRow = {
  id: number;
  name: string;
  qty: number;
  priceGp: number;     // valgt pris (mid af avgHigh/avgLow, fallback latest)
  priceLow?: number | null;
  priceHigh?: number | null;
  avgLow?: number | null;
  avgHigh?: number | null;
  subtotalGp: number;
};
type PricePayload = {
  generatedAt: string;
  source: "osrs-wiki";
  items: PriceRow[];
  totalGp: number;
};
let CACHE: { at: number; data: PricePayload } | null = null;

// ---------- Supabase client ----------
const sb = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

// ---------- Hjælpere ----------
const toInt = (v: any) => (Number.isFinite(Number(v)) ? Math.floor(Number(v)) : 0);
const nowIso = () => new Date().toISOString();

// Seneste beholdning (samlet på tværs af konti: seneste approved snapshot pr. konto)
async function getLatestCounts(): Promise<Record<number, number>> {
  const { data: latest, error: latestErr } = await sb
      .from("latest_approved_snapshot")
      .select("snapshot_id");
  if (latestErr || !latest?.length) return {};

  const ids = latest.map((r: any) => r.snapshot_id);
  const { data: rows, error: rowsErr } = await sb
      .from("snapshot_items")
      .select("item_id, qty, snapshot_id")
      .in("snapshot_id", ids);
  if (rowsErr || !rows?.length) return {};

  const sums = new Map<number, number>();
  for (const r of rows as any[]) {
    const cur = sums.get(r.item_id) ?? 0;
    sums.set(r.item_id, cur + Number(r.qty ?? 0));
  }
  const out: Record<number, number> = {};
  for (const [k, v] of sums.entries()) out[k] = v;
  return out;
}

// Hent priser fra OSRS Wiki (seneste + 5min averages)
type LatestMap = Record<string, { high: number | null; low: number | null; highTime: number; lowTime: number }>;
type FiveMap   = Record<string, { avgHighPrice: number | null; avgLowPrice: number | null }>;
async function fetchWiki(): Promise<{ latest: LatestMap; five: FiveMap }> {
  const base = "https://prices.runescape.wiki/api/v1/osrs";
  const headers = { "User-Agent": UA };

  const [latestRes, fiveRes] = await Promise.all([
    fetch(`${base}/latest`, { headers, cache: "no-store" }),
    fetch(`${base}/5m`,    { headers, cache: "no-store" }),
  ]);

  if (!latestRes.ok || !fiveRes.ok) {
    throw new Error(`wiki fetch failed latest=${latestRes.status} five=${fiveRes.status}`);
  }

  const latestJson = (await latestRes.json()) as { data: LatestMap };
  const fiveJson   = (await fiveRes.json())   as { data: FiveMap };
  return { latest: latestJson.data ?? {}, five: fiveJson.data ?? {} };
}

// ---------- Handler ----------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    // Cache-hit?
    if (!force && CACHE && Date.now() - CACHE.at < TTL_MS) {
      return NextResponse.json(CACHE.data, { headers: { "Cache-Control": "no-store" } });
    }

    // 1) Beholdning
    const counts = await getLatestCounts();

    // 2) Priser
    const { latest, five } = await fetchWiki();

    const items: PriceRow[] = ITEM_DEFS.map(def => {
      const qty = counts[def.id] ?? 0;

      const l = latest[String(def.id)];
      const f = five[String(def.id)];

      const priceLow  = l?.low ?? null;
      const priceHigh = l?.high ?? null;
      const avgLow    = f?.avgLowPrice ?? null;
      const avgHigh   = f?.avgHighPrice ?? null;

      // Vælg en “pæn” pris:
      // 1) mid af 5m average (hvis begge findes)
      // 2) ellers den af averages der findes
      // 3) ellers mid af latest high/low
      // 4) ellers 0
      let priceGp = 0;
      if (avgLow && avgHigh) priceGp = Math.round((avgLow + avgHigh) / 2);
      else if (avgLow)       priceGp = Math.round(avgLow);
      else if (avgHigh)      priceGp = Math.round(avgHigh);
      else if (priceLow && priceHigh) priceGp = Math.round((priceLow + priceHigh) / 2);
      else priceGp = 0;

      const subtotalGp = qty * priceGp;

      return {
        id: def.id,
        name: def.name,
        qty,
        priceGp,
        priceLow,
        priceHigh,
        avgLow,
        avgHigh,
        subtotalGp,
      };
    });

    const totalGp = items.reduce((sum, r) => sum + r.subtotalGp, 0);

    const payload: PricePayload = {
      generatedAt: nowIso(),
      source: "osrs-wiki",
      items,
      totalGp,
    };

    CACHE = { at: Date.now(), data: payload };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // Blød fallback (0’er), så UI aldrig får 500
    const payload: PricePayload = {
      generatedAt: nowIso(),
      source: "osrs-wiki",
      items: ITEM_DEFS.map(d => ({
        id: d.id, name: d.name, qty: 0, priceGp: 0, subtotalGp: 0,
        priceLow: null, priceHigh: null, avgLow: null, avgHigh: null,
      })),
      totalGp: 0,
    };
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  }
}
