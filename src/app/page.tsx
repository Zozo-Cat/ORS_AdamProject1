'use client';

import { useEffect, useRef } from 'react';

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-black text-white overflow-hidden">
            {/* HERO baggrund */}
            <section
                className="relative w-full h-screen overflow-hidden"
                style={{
                    backgroundImage: "url('/rs-bg-clean-hero_1.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* FAKLER */}
                <Torch x="9%"  y="33%" scale={1.0} />
                <Torch x="82%" y="33%" scale={1.0} />

                {/* Logo + knapper (midten) */}
                <div className="absolute left-1/2 bottom-8 -translate-x-1/2 flex flex-col items-center gap-4">
                    <img
                        src="/OSRSvaultlogo.png"
                        alt="OSRS Vault"
                        className="w-[280px] md:w-[360px] drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]"
                    />
                    <div className="flex items-center gap-3">
                        <StoneButton onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
                            Enter
                        </StoneButton>
                        <StoneButton onClick={() => window.open('https://dexscreener.com', '_blank')}>
                            Buy $OSRS
                        </StoneButton>
                    </div>
                </div>
            </section>

            {/* Metrics placeholder – kan du udfylde senere */}
            <section className="bg-[#0b0b0b] py-10">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Metric label="Price" />
                    <Metric label="24h Vol" />
                    <Metric label="Liquidity" />
                    <Metric label="FDV / MC" />
                    <Metric label="Change 24h" />
                </div>
            </section>

            {/* Global CSS til fakler, knapper osv. */}
            <style jsx global>{`
        /* Farve-cyklus: orange -> lilla -> grøn -> tilbage */
        @keyframes colorCycle {
          0%   { filter: hue-rotate(0deg)    saturate(1.0) brightness(1.0); }
          33%  { filter: hue-rotate(265deg)  saturate(1.5) brightness(1.05); }
          66%  { filter: hue-rotate(140deg)  saturate(1.4) brightness(1.0); }
          100% { filter: hue-rotate(0deg)    saturate(1.0) brightness(1.0); }
        }

        /* Blød puls i gløden */
        @keyframes glowPulse {
          0%,100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.00); }
          50%     { opacity: 0.55; transform: translate(-50%, -50%) scale(1.08); }
        }

        /* Små gnister */
        @keyframes emberFloat {
          0%   { transform: translateY(0) scale(1);   opacity: 0; }
          30%  { opacity: 0.5; }
          100% { transform: translateY(-40px) scale(0.9); opacity: 0; }
        }
      `}</style>
        </div>
    );
}

/* -------- Faklens video + glow + mask ---------- */
function Torch({ x, y, scale = 1 }: { x: string; y: string; scale?: number }) {
    const ref = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        v.playbackRate = 0.85; // lidt roligere
        const onCanPlay = () => v.play().catch(() => {});
        v.addEventListener('canplay', onCanPlay);
        return () => v.removeEventListener('canplay', onCanPlay);
    }, []);

    return (
        <div
            className="pointer-events-none absolute"
            style={{
                left: x,
                top: y,
                transform: `translate(-50%, -45%) scale(${scale})`,
                width: '14vw',           // basisbredde (skalerer med viewport)
                maxWidth: 260,           // cap på desktop
                minWidth: 120,           // cap på mobil
                aspectRatio: '9 / 16',   // lodret flamme
            }}
        >
            {/* GLØDEKUGLE der lyser væggen (add/screen) */}
            <div
                className="absolute -z-10 mix-blend-screen"
                style={{
                    left: '50%',
                    top: '55%',
                    width: '38vw',
                    maxWidth: 520,
                    aspectRatio: '1 / 1',
                    transform: 'translate(-50%, -50%)',
                    background:
                        'radial-gradient(closest-side, rgba(255,180,60,0.55), rgba(255,160,40,0.25) 35%, rgba(255,130,20,0.05) 65%, transparent 70%)',
                    filter: 'blur(12px)',
                    animation: 'glowPulse 4.5s ease-in-out infinite',
                }}
            />

            {/* SELVE FLAMMEN — WebM med alpha */}
            <video
                ref={ref}
                src="/flames/flame-alpha.webm"
                autoPlay
                muted
                loop
                playsInline
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    /* Fade kanter en smule + skær underkanten væk, så den "sidder" i skålen */
                    WebkitMaskImage:
                        'linear-gradient(to top, transparent -6%, black 12%, black 92%, transparent 104%)',
                    maskImage:
                        'linear-gradient(to top, transparent -6%, black 12%, black 92%, transparent 104%)',
                    /* Farveskift (orange -> lilla -> grøn) */
                    animation: 'colorCycle 12s ease-in-out infinite',
                    /* lidt ekstra udglød */
                    mixBlendMode: 'screen',
                }}
            />

            {/* Et par gnister der stiger tilfældigt (meget subtile) */}
            <div
                className="absolute left-1/2"
                style={{
                    top: '10%',
                    width: 2,
                    height: 2,
                    borderRadius: 9999,
                    background: 'rgba(255,200,120,0.9)',
                    boxShadow:
                        '0 0 8px rgba(255,200,120,0.9), 0 0 16px rgba(255,180,80,0.6)',
                    transform: 'translateX(-50%)',
                    animation: 'emberFloat 1.8s linear infinite',
                }}
            />
            <div
                className="absolute left-1/2"
                style={{
                    top: '18%',
                    width: 2,
                    height: 2,
                    borderRadius: 9999,
                    background: 'rgba(255,210,140,0.9)',
                    boxShadow:
                        '0 0 8px rgba(255,210,140,0.9), 0 0 16px rgba(255,180,80,0.5)',
                    transform: 'translateX(-50%)',
                    animation: 'emberFloat 2.1s linear infinite',
                    animationDelay: '0.4s',
                }}
            />
        </div>
    );
}

/* --------- Små hjælpe-komponenter ---------- */
function StoneButton({
                         children,
                         onClick,
                     }: {
    children: React.ReactNode;
    onClick?: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="relative px-7 py-3 text-lg tracking-wide"
            style={{
                fontFamily: 'serif',
                color: '#f4f1e8',
                textShadow:
                    '0 1px 0 rgba(0,0,0,0.55), 0 0 6px rgba(0,0,0,0.35)',
                backgroundImage: "url('/stone-panel-blank.png')",
                backgroundSize: '100% 100%',
                filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.45))',
            }}
        >
            {children}
        </button>
    );
}

function Metric({ label }: { label: string }) {
    return (
        <div className="bg-[#161616] rounded-xl border border-[#2a2a2a] px-4 py-3 text-center">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#c1b08a]">
                {label}
            </div>
            <div className="text-xl font-semibold mt-1 text-[#f3efe5]">—</div>
        </div>
    );
}
