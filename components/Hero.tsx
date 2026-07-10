"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { HeroIllustration } from "./HeroIllustration";
import { dictionary, type Locale } from "@/lib/i18n";

type Stats = { today: number; year: number; total: number; yearNumber: number };

export function Hero({ locale, stats, survival }: { locale: Locale; stats: Stats; survival: Stats }) {
  const t = dictionary[locale];
  const rootRef = useRef<HTMLElement>(null);
  const words = t.heroTitle.split(" ");
  const signalFrames = useMemo(
    () =>
      locale === "ru"
        ? ["Startups / Verdicts", "Data / No hype", "Risk / Market / Money", "Signal / Not noise"]
        : ["Startaplar / Verdict", "Data / Hype emas", "Risk / Bozor / Pul", "Signal / Shovqin emas"],
    [locale]
  );
  const [signalText, setSignalText] = useState(signalFrames[0]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const introEls = [
      root.querySelector(".kicker"),
      root.querySelector(".signal-pill"),
      root.querySelector(".hero-copy"),
      ...root.querySelectorAll(".hero-actions .button")
    ].filter(Boolean) as Element[];
    const wordEls = root.querySelectorAll(".word-mask .word");
    const illustrationEls = root.querySelectorAll(".hero-illustration-card, .hero-illustration-stat");

    // Belt-and-suspenders: if anything below throws (a bad selector, a
    // missing SVG node after a markup edit), the hero text must never be
    // left stuck at opacity:0 forever — that's the one failure mode that
    // actually breaks the page for a real visitor.
    const revealEverything = () =>
      gsap.set([introEls, wordEls, illustrationEls], {
        opacity: 1,
        y: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        clearProps: "transform"
      });

    let ctx: gsap.Context | undefined;
    try {
      ctx = gsap.context(() => {
        const hexPolygon = root.querySelector(".hero-illustration-hex polygon") as SVGPolygonElement | null;
        const circuitPath = root.querySelector(".hero-illustration-line path") as SVGPathElement | null;

        gsap.set(introEls, { opacity: 0, y: 16 });
        gsap.set(wordEls, { opacity: 1, y: 24, clipPath: "inset(0% 100% 0% 0%)" });
        gsap.set(illustrationEls, { opacity: 0, y: 16 });

        if (reduceMotion) {
          revealEverything();
          if (hexPolygon) gsap.set(hexPolygon, { strokeDashoffset: 0 });
          if (circuitPath) gsap.set(circuitPath, { strokeDashoffset: 0 });
          return;
        }

        if (hexPolygon) {
          const hexLength = hexPolygon.getTotalLength();
          gsap.set(hexPolygon, { strokeDasharray: hexLength, strokeDashoffset: hexLength });
        }
        if (circuitPath) {
          const circuitLength = circuitPath.getTotalLength();
          gsap.set(circuitPath, { strokeDasharray: circuitLength, strokeDashoffset: circuitLength });
        }

        const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });

        if (hexPolygon) tl.to(hexPolygon, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut" }, 0);
        if (circuitPath) tl.to(circuitPath, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.25);
        tl.to(introEls, { opacity: 1, y: 0, stagger: 0.08, duration: 0.55 }, 0.05)
          .to(wordEls, { y: 0, stagger: 0.05, duration: 0.4 }, 0.1)
          .to(wordEls, { clipPath: "inset(0% 0% 0% 0%)", stagger: 0.05, duration: 0.5, ease: "steps(9)" }, 0.1)
          .to(illustrationEls, { opacity: 1, y: 0, stagger: 0.12, duration: 0.5 }, 0.55);

        // The right panel should keep feeling "live", not just draw in once —
        // redraw the hex/circuit signal lines on a loop after the intro settles.
        if (hexPolygon || circuitPath) {
          const hexLength = hexPolygon?.getTotalLength() ?? 0;
          const circuitLength = circuitPath?.getTotalLength() ?? 0;
          const loop = gsap.timeline({ repeat: -1, repeatDelay: 3.2, delay: tl.duration() + 0.6 });
          if (hexPolygon) {
            loop
              .set(hexPolygon, { strokeDashoffset: hexLength }, 0)
              .to(hexPolygon, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" }, 0.05);
          }
          if (circuitPath) {
            loop
              .set(circuitPath, { strokeDashoffset: circuitLength }, 0)
              .to(circuitPath, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.25);
          }
        }
      }, root);
    } catch (error) {
      console.error("[Hero] entrance animation failed, showing content directly:", error);
      revealEverything();
    }

    // Even on a healthy run, never leave text invisible for more than a
    // beat — a throttled/backgrounded tab can stall requestAnimationFrame
    // well past when the content should already be readable.
    const safety = window.setTimeout(revealEverything, 1800);

    return () => {
      window.clearTimeout(safety);
      ctx?.revert();
    };
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setSignalText(signalFrames[0]);
      return undefined;
    }

    let alive = true;
    let timeout = 0;
    let phraseIndex = 0;
    let charIndex = 0;
    let phase: "typing" | "holding" | "erasing" = "typing";

    const tick = () => {
      if (!alive) return;
      const phrase = signalFrames[phraseIndex];

      if (phase === "typing") {
        charIndex += 1;
        setSignalText(phrase.slice(0, charIndex));
        if (charIndex >= phrase.length) {
          phase = "holding";
          timeout = window.setTimeout(tick, 1100);
          return;
        }
        timeout = window.setTimeout(tick, 80);
        return;
      }

      if (phase === "holding") {
        phraseIndex = (phraseIndex + 1) % signalFrames.length;
        const nextPhrase = signalFrames[phraseIndex];
        phase = "typing";
        charIndex = 1;
        setSignalText(nextPhrase.slice(0, charIndex));
        timeout = window.setTimeout(tick, 80);
        return;
      }

    };

    timeout = window.setTimeout(tick, 220);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, [signalFrames]);

  return (
    <section className="hero" ref={rootRef}>
      <div className="hero-aurora" />
      <div className="hero-content">
        <div className="hero-label-row">
          <p className="kicker">{t.heroKicker}</p>
          <span className="signal-pill" aria-live="off">
            <span className="signal-pill-text">{signalText}</span>
            <span className="signal-cursor" aria-hidden="true">
              |
            </span>
          </span>
        </div>
        <h1>
          {words.map((word, i) => (
            <Fragment key={i}>
              <span className="word-mask">
                <span className="word">{word}</span>
              </span>
              {i < words.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h1>
        <p className="hero-copy">{t.heroCopy}</p>
        <div className="hero-actions">
          <a className="button primary" href="#feed">
            {t.heroCta}
          </a>
          <a className="button ghost" href="#position">
            {t.heroSecondary}
          </a>
        </div>
      </div>
      <div className="hero-visual">
        <HeroIllustration locale={locale} stats={stats} survival={survival} />
      </div>
    </section>
  );
}
