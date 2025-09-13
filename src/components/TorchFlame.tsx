"use client";
import React, { useEffect, useRef } from "react";

/**
 * Procedural OSRS-lignende fakkel:
 * - Bred "ember bed" + midterkrop + tunge toppe
 * - Farvecyklus orange -> lilla -> grøn
 * - Styrket intensitet ift. tidligere (tydeligt på mørk baggrund)
 */

type TorchProps = {
    xPct: number;          // vandret position i %
    yPct: number;          // lodret position i %
    scale?: number;        // visuel skalering (1 = default)
    zIndex?: number;       // lag
};

export default function TorchFlame({ xPct, yPct, scale = 1, zIndex = 3 }: TorchProps) {
    const ref = useRef<HTMLCanvasElement | null>(null);
    const raf = useRef<number | null>(null);

    useEffect(() => {
        const canvas = ref.current!;
        const ctx = canvas.getContext("2d", { alpha: true })!;

        // Skarphed på retina
        const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const W = Math.round(220 * scale);
        const H = Math.round(260 * scale);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        // ---------- lille value-noise ----------
        const hash = (x: number, y: number) => {
            let t = x * 374761393 + y * 668265263;
            t = (t ^ (t >>> 13)) * 1274126177;
            return ((t ^ (t >>> 16)) >>> 0) / 4294967295;
        };
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const smooth = (t: number) => t * t * (3 - 2 * t);
        const vnoise = (x: number, y: number) => {
            const xi = Math.floor(x), yi = Math.floor(y);
            const xf = x - xi,      yf = y - yi;
            const h00 = hash(xi, yi);
            const h10 = hash(xi + 1, yi);
            const h01 = hash(xi, yi + 1);
            const h11 = hash(xi + 1, yi + 1);
            const u = smooth(xf), v = smooth(yf);
            return lerp(lerp(h00, h10, u), lerp(h01, h11, u), v);
        };

        // ---------- parametre (skru bare her) ----------
        const P = {
            speed: 0.75,          // tempo (0.6–1.0)
            baseWidth: 180,       // glødebund
            bodyWidth: 140,
            topWidth: 95,
            height: H - 8,        // flammehøjde
            step: 1.5,            // sampling (lavere = blødere/flottere)
            chaos: 1.45,          // “tunger”
            noiseX: 0.018,
            noiseY: 0.028,
            intensity: 2.4,       // *** samlet styrke (var 1.0 før) ***
            glow: 1.35,           // ambient glow
            hueCycleSec: 16,      // farveskift-hastighed (sek pr. cyklus)
        };

        const emberDots = Array.from({ length: 140 }, () => ({
            x: (Math.random() - 0.5) * P.baseWidth * 0.9,
            y: -6 + Math.random() * 10,
            r: 1 + Math.random() * 1.6,
            p: Math.random(),
        }));

        ctx.globalCompositeOperation = "lighter";

        const profile = (yy: number) => {
            const v = 1 - yy / P.height;        // 1 i bunden -> 0 i toppen
            return Math.max(0, Math.pow(v, 0.55));
        };
        const widthAt = (yy: number) => {
            const v = 1 - yy / P.height;
            if (v > 0.85) return P.baseWidth;
            if (v > 0.45) return lerp(P.baseWidth, P.bodyWidth, (0.85 - v) / 0.40);
            return lerp(P.bodyWidth, P.topWidth, (0.45 - v) / 0.45);
        };

        let last = performance.now();
        const loop = (now: number) => {
            raf.current = requestAnimationFrame(loop);
            const t = now / 1000;

            ctx.clearRect(0, 0, W, H);

            // --- farvecyklus: orange -> lilla -> grøn ---
            const cyc = (t / P.hueCycleSec) % 1;
            let hue = 35;
            if (cyc < 1 / 3) hue = lerp(35, 285, cyc * 3);
            else if (cyc < 2 / 3) hue = lerp(285, 135, (cyc - 1 / 3) * 3);
            else hue = lerp(135, 35, (cyc - 2 / 3) * 3);

            // Ambient glow ved skålen
            const g = ctx.createRadialGradient(W / 2, P.height - 14, 2, W / 2, P.height - 14, 90);
            g.addColorStop(0, `hsla(${hue},85%,65%,${0.38 * P.glow})`);
            g.addColorStop(1, `hsla(${hue},85%,65%,0)`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(W / 2, P.height - 14, 95, 70, 0, 0, Math.PI * 2);
            ctx.fill();

            // --- hovedvolumen ---
            for (let yy = 0; yy < P.height; yy += P.step) {
                const band = profile(yy);
                if (band <= 0.001) continue;

                const w = widthAt(yy);
                const nx = P.noiseX, ny = P.noiseY;
                const ts = t * P.speed;

                for (let xx = -w; xx <= w; xx += P.step) {
                    const u = xx / Math.max(1, w);
                    const n =
                        vnoise(xx * nx + 50, (P.height - yy) * ny + ts * 0.8) * 0.7 +
                        vnoise((xx + 200) * nx * 0.7, (P.height - yy) * ny * 1.6 - ts * 0.6) * 0.3;

                    // gør “tunge”-udskæringer tydeligere
                    const cutoff = 0.50 - Math.abs(u) * 0.26 + (1 - band) * 0.15;
                    let a = (n - cutoff) * 3.9 * band * P.chaos;
                    if (a <= 0) continue;
                    a = Math.min(1, a);

                    const light = 54 + band * 40;
                    const sat = 88 + band * 10;

                    // *** stærkere pixels ***
                    ctx.fillStyle = `hsla(${hue},${sat}%,${light}%,${0.08 * P.intensity * a})`;
                    ctx.fillRect(W / 2 + xx, P.height - yy, P.step + 1, P.step + 1);
                }
            }

            // --- gul "bed" der flimrer ved kanten ---
            for (const d of emberDots) {
                const flick = 0.5 + 0.5 * Math.sin(t * 10 + d.p * Math.PI * 2);
                ctx.fillStyle = `hsla(${hue},95%,65%,${0.32 * flick})`;
                ctx.beginPath();
                ctx.arc(W / 2 + d.x, P.height - 8 + d.y, d.r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Diskret wisp ovenover
            const oy = -64 + Math.sin(t * 0.8) * 12;
            const ox = Math.cos(t * 0.6) * 8;
            const wisp = ctx.createRadialGradient(W / 2 + ox, P.height + oy, 2, W / 2 + ox, P.height + oy, 60);
            wisp.addColorStop(0, `hsla(${hue},85%,70%,0.10)`);
            wisp.addColorStop(1, `hsla(${hue},85%,70%,0)`);
            ctx.fillStyle = wisp;
            ctx.beginPath();
            ctx.ellipse(W / 2 + ox, P.height + oy, 68, 105, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        raf.current = requestAnimationFrame(loop);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }, [scale]);

    return (
        <canvas
            ref={ref}
            aria-hidden
            style={{
                position: "absolute",
                left: `${xPct}%`,
                top: `${yPct}%`,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                mixBlendMode: "screen",  // kan ændres til "normal" til debug
                zIndex,
            }}
        />
    );
}
