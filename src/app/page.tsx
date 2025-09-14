'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const ENTER_LINK = "/vault";
const BUY_LINK = "https://dexscreener.com";

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-black text-white overflow-hidden">
            {/* ── HERO ─────────────────────────────────────────────────────────────── */}
            <section
                className="relative w-full h-screen overflow-hidden"
                style={{
                    backgroundImage: "url('/rs-bg-clean-hero_1.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            >
                {/* Torches (flames later) */}
                <Torch x="9%" y="33%" scale={1.0} />
                <Torch x="82%" y="33%" scale={1.0} />

                {/* Logo */}
                <div className="absolute left-1/2 top-[6vh] -translate-x-1/2 z-10">
                    <Image
                        src="/OSRSvaultlogo.png"
                        alt="OSRS Vault"
                        width={520}
                        height={180}
                        priority
                        className="h-auto w-[260px] md:w-[420px] select-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
                    />
                </div>

                {/* Stone panel with buttons */}
                <div
                    style={{
                        backgroundImage: "url('/stone-panel-blank.png')",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "100% 100%",
                    }}
                    className="absolute left-1/2 top-[41%] -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-[880px] rounded-[18px] px-6 py-8 sm:px-8 sm:py-10 z-10 shadow-none"
                >
                    <p className="mt-10 text-center text-[16px] sm:text-[17px] tracking-[0.10em] text-[#d4c27c] drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]">
                        Welcome to <span className="whitespace-nowrap">OSRS Vault</span>
                    </p>

                    {/* Mobile: stack */}
                    <div className="mt-6 grid grid-cols-1 gap-2 sm:hidden">
                        <StoneButton href={ENTER_LINK}>ENTER</StoneButton>
                        <StoneButton href={BUY_LINK} external className="px-[9rem]">
                            BUY&nbsp;$OSRS
                        </StoneButton>
                    </div>

                    {/* Desktop: ultra-tight gap via negative spacing + ENTER offset */}
                    <div className="mt-6 hidden sm:flex w-full items-stretch justify-center gap-0 -space-x-[88px]">
                        <StoneButton href={ENTER_LINK} className="ml-[24px]">
                            ENTER
                        </StoneButton>
                        <StoneButton
                            href={BUY_LINK}
                            external
                            className="px-[10.5rem] sm:px-[11.5rem] md:px-[12.5rem] lg:px-[13rem]"
                        >
                            BUY&nbsp;$OSRS
                        </StoneButton>
                    </div>
                </div>

                {/* Subtle bottom fade to declutter the edge */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent pointer-events-none z-[5]" />

                {/* Scroll cue (chevron; auto-hides) */}
                <ScrollCue />

                {/* Metrics pinned at hero bottom (lifted a bit) */}
                <div className="absolute left-1/2 bottom-[10vh] md:bottom-[9vh] -translate-x-1/2 w-full px-4 z-10">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {/* CHANGED LABELS ONLY */}
                            <Metric label="Vault value" />
                            <Metric label="Streamer donations" />
                            <Metric label="Market cap" />
                            <Metric label="24h volume" />
                            <Metric label="Items acquired" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── INTRO ─────────────────────────────────────────────────────────────── */}
            <section className="relative bg-[#0b0b0b] py-14 md:py-16">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <h2 className="text-[22px] sm:text-[26px] tracking-widest text-[#f4f1e8]">
                        What is OSRS Vault?
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-[#d6d0c5]/90 max-w-3xl mx-auto">
                        OSRS Vault is a community-driven “bank”. When people trade
                        <span className="mx-1 font-semibold">$OSRS</span>, a small share of fees flows
                        into a shared treasury. We use those funds to buy desirable Old School RuneScape items, donate to streamers & host massive drop parties.
                    </p>
                    <p className="mt-3 text-[12px] text-[#b7aa8b]/80">
                        Items will be swept, price will increase. ALL EYES ON US.
                    </p>
                </div>
            </section>

            {/* ── HOW IT WORKS (4 steps) ───────────────────────────────────────────── */}
            <section className="relative bg-[#0b0b0b] py-4 pb-16">
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                    <StepCard
                        step="Step 1"
                        title="You Buy $OSRS"
                        text="Every trade sends a small share of fees into the Vault."
                        iconWebp="/icons/gp-sparkle.webp"
                        iconPng="/icons/gp-sparkle.png"
                    />
                    <StepCard
                        step="Step 2"
                        title="Fees Fill The Vault"
                        text="The treasury grows — everything is transparent."
                        iconWebp="/icons/stones-shimmer.webp"
                        iconPng="/icons/stones-shimmer.png"
                    />
                    <StepCard
                        step="Step 3"
                        title="We Buy Items"
                        text="We buy popular OSRS items in-game."
                        iconWebp="/icons/bow-sway.webp"
                        iconPng="/icons/bow-sway.png"
                    />
                    {/* CHANGED: Step 4 copy only */}
                    <StepCard
                        step="Step 4"
                        title="Supply shock"
                        text="Vault value goes up"
                        iconWebp="/icons/scythe-sway.webp"
                        iconPng="/icons/scythe-sway.png"
                    />
                </div>
            </section>

            {/* ── DROP TABLE (teaser) ──────────────────────────────────────────────── */}
            <section className="relative bg-[#0b0b0b] py-10 pb-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h3 className="text-center text-[20px] tracking-widest text-[#f4f1e8]">
                        Items we will aquire
                    </h3>
                    <p className="mt-3 text-center text-[13px] text-[#d6d0c5]/90 max-w-3xl mx-auto">
                        We systematically sweep the market, buying every Mega-rare item we can find. As circulating supply shrink, a price shock is inevitable — sending these valuable items to new all-time highs.
                        <span className="block mt-2">
    The items we sweep off the markets are extremely valuable and they are necessary to complete end game content efficiently.
  </span>
                    </p>

                    {/* CHANGED: only the 3 requested items */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-8">
                        <DropItemCard
                            name="Twisted Bow"
                            rarity="Ultra rare"
                            srcWebp="/drops/tbow.webp"
                            srcPng="/drops/tbow.png"
                        />
                        <DropItemCard
                            name="Scythe of Vitur"
                            rarity="Very rare"
                            srcPng="/drops/scythe.png"
                        />
                        <DropItemCard
                            name="Tumeken's Shadow"
                            rarity="Very rare"
                            srcPng="/drops/staff.png"
                        />
                    </div>
                </div>
            </section>

            {/* ── SOCIAL DOCK (X + Telegram; bottom-right) ─────────────────────────── */}
            <SocialDock />

            {/* Global keyframes */}
            <style jsx global>{`
        @keyframes colorCycle {
          0% { filter: hue-rotate(0deg) saturate(1) brightness(1); }
          33% { filter: hue-rotate(265deg) saturate(1.5) brightness(1.05); }
          66% { filter: hue-rotate(140deg) saturate(1.4) brightness(1); }
          100% { filter: hue-rotate(0deg) saturate(1) brightness(1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes emberFloat {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          30% { opacity: 0.5; }
          100% { transform: translateY(-40px) scale(0.9); opacity: 0; }
        }
        @keyframes cue {
          0%, 100% { transform: translate(-50%, 0); opacity: .9; }
          50% { transform: translate(-50%, 6px); opacity: .6; }
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-soft, .anim-loop, .scroll-cue { animation: none !important; }
          video.anim-loop { display: none !important; }
        }
      `}</style>
        </div>
    );
}

/* ── Torch ─────────────────────────────────────────────────────────────────── */
function Torch({ x, y, scale = 1 }: { x: string; y: string; scale?: number }) {
    const ref = useRef<HTMLVideoElement | null>(null);
    useEffect(() => {
        const v = ref.current;
        if (!v) return;
        v.playbackRate = 0.85;
        const onCanPlay = () => v.play().catch(() => {});
        v.addEventListener("canplay", onCanPlay);
        return () => v.removeEventListener("canplay", onCanPlay);
    }, []);
    return (
        <div
            className="pointer-events-none absolute"
            style={{
                left: x,
                top: y,
                transform: `translate(-50%, -45%) scale(${scale})`,
                width: "14vw",
                maxWidth: 260,
                minWidth: 120,
                aspectRatio: "9 / 16",
            }}
        >
            <div
                className="absolute -z-10 mix-blend-screen anim-soft"
                style={{
                    left: "50%",
                    top: "55%",
                    width: "38vw",
                    maxWidth: 520,
                    aspectRatio: "1 / 1",
                    transform: "translate(-50%, -50%)",
                    background:
                        "radial-gradient(closest-side, rgba(255,180,60,0.55), rgba(255,160,40,0.25) 35%, rgba(255,130,20,0.05) 65%, transparent 70%)",
                    filter: "blur(12px)",
                    animation: "glowPulse 4.5s ease-in-out infinite",
                }}
            />
            <video
                ref={ref}
                src="/flames/flame-alpha.webm"
                autoPlay
                muted
                loop
                playsInline
                className="anim-loop"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    WebkitMaskImage:
                        "linear-gradient(to top, transparent -6%, black 12%, black 92%, transparent 104%)",
                    maskImage:
                        "linear-gradient(to top, transparent -6%, black 12%, black 92%, transparent 104%)",
                    animation: "colorCycle 12s ease-in-out infinite",
                    mixBlendMode: "screen",
                }}
            />
        </div>
    );
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function StoneButton({
                         children,
                         href,
                         external = false,
                         onClick,
                         className = "",
                     }: {
    children: React.ReactNode;
    href?: string;
    external?: boolean;
    onClick?: () => void;
    className?: string;
}) {
    const base = `
    relative inline-flex items-center justify-center text-center leading-none
    px-[5.5rem] py-[3.9rem] sm:px-[5.75rem] sm:py-[4.1rem]
    text-[20px] sm:text-[22px]
    tracking-[0.06em] uppercase
    rounded-[12px]
    text-[#f4f1e8]
    drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]
    select-none
    min-w-[260px] sm:min-w-[280px]
  `;
    const style = {
        backgroundImage: "url('/rs-button-shell.png')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "106% 100%",
        backgroundPosition: "center",
        textShadow: "0 1px 0 rgba(0,0,0,0.55), 0 0 6px rgba(0,0,0,0.35)",
    } as const;

    if (href) {
        if (external) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${base} ${className}`}
                    style={style}
                >
                    {children}
                </a>
            );
        }
        return (
            <Link href={href} className={`${base} ${className}`} style={style}>
                {children}
            </Link>
        );
    }
    return (
        <button onClick={onClick} className={`${base} ${className}`} style={style}>
            {children}
        </button>
    );
}

function Metric({ label }: { label: string }) {
    return (
        <div className="bg-[#161616]/80 rounded-xl border border-[#2a2a2a] px-4 py-3 text-center backdrop-blur-[2px]">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#c1b08a]">{label}</div>
            <div className="text-xl font-semibold mt-1 text-[#f3efe5]">—</div>
        </div>
    );
}

/* STEP CARD – taller, breathing room, stable icon */
function StepCard({
                      step,
                      title,
                      text,
                      iconWebp,
                      iconPng,
                  }: {
    step: string;
    title: string;
    text: string;
    iconWebp?: string;
    iconPng: string;
}) {
    return (
        <div
            className="rounded-2xl h-full min-h-[340px] md:min-h-[360px] px-6 py-6 border border-black/40 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
            style={{
                backgroundImage: "url('/stone-panel-blank.png')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
            }}
        >
            <div className="flex flex-col items-center text-center pb-3">
                <div className="text-[11px] tracking-widest text-[#d4c27c] bg-black/40 px-3 py-1 rounded-full border border-black/40">
                    {step}
                </div>

                <div className="mt-8 h-[72px] w-[72px] flex items-center justify-center">
                    <picture>
                        {iconWebp ? <source srcSet={iconWebp} type="image/webp" /> : null}
                        <img
                            src={iconPng}
                            alt=""
                            className="max-h-[64px] max-w-[64px] object-contain"
                            style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.35))" }}
                        />
                    </picture>
                </div>

                <div className="mt-3 text-[17px] leading-tight tracking-[0.06em] text-[#f4f1e8]">
                    {title}
                </div>
                <p className="mt-2 text-[13px] leading-[1.35] text-[#d6d0c5]/90 px-1 break-words">
                    {text}
                </p>
            </div>
        </div>
    );
}

function DropItemCard({
                          name,
                          rarity,
                          srcWebp,
                          srcPng,
                      }: {
    name: string;
    rarity: string;
    srcWebp?: string;
    srcPng: string;
}) {
    return (
        <div
            className="rounded-2xl p-10 border border-black/40 text-center shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
            style={{
                backgroundImage: "url('/stone-panel-blank.png')",
                backgroundRepeat: "no-repeat",
                backgroundSize: "100% 100%",
            }}
        >
            <div className="h-16 flex items-center justify-center">
                <picture>
                    {srcWebp ? <source srcSet={srcWebp} type="image/webp" /> : null}
                    <img src={srcPng} alt={name} className="max-h-16 object-contain" />
                </picture>
            </div>
            <div className="mt-3 text-[15px] tracking-widest text-[#f4f1e8]">{name}</div>
            <div className="mt-1 text-[11px] tracking-widest text-[#d4c27c]">{rarity}</div>
        </div>
    );
}

/* SOCIAL DOCK – X + Telegram; bottom-right; force icons white */
function SocialDock() {
    const items = [
        { href: "https://twitter.com/", src: "/social/x.svg", label: "X" },
        { href: "https://t.me/", src: "/social/telegram.svg", label: "Telegram" },
    ];
    return (
        <div className="fixed bottom-3 right-3 md:bottom-6 md:right-6 z-[60]">
            <div className="flex items-center gap-3 rounded-full bg-[#14110c]/75 backdrop-blur-[2px] px-3 py-2 border border-black/40 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
                {items.map((it) => (
                    <a
                        key={it.href}
                        href={it.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition"
                        aria-label={it.label}
                        title={it.label}
                    >
                        <img
                            src={it.src}
                            alt={it.label}
                            className="h-4 w-4 md:h-5 md:w-5 opacity-90 group-hover:opacity-100 filter brightness-0 invert"
                        />
                    </a>
                ))}
            </div>
        </div>
    );
}

/* ── Scroll Cue (chevron, hides after a small scroll) ─────────────────────── */
function ScrollCue() {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const onScroll = () => setHidden(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <div
            className={`scroll-cue pointer-events-none absolute left-1/2 bottom-[44px] -translate-x-1/2 z-20 transition-opacity duration-300 ${hidden ? "opacity-0" : "opacity-100"}`}
            aria-hidden="true"
            style={{ animation: "cue 1.8s ease-in-out infinite" }}
        >
            <svg width="22" height="14" viewBox="0 0 22 14" className="opacity-85 drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
                <path d="M2 2l9 9 9-9" stroke="#d4c27c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}
